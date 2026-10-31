import { SubtitleAnnotation, SubtitleProvider } from '../types';

// Base64 adds about 33%. Keep each request comfortably below Vercel's 4.5 MB cap.
export const MAX_WAV_BYTES = 2 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 3_500_000;
export interface DecodedAudio {
  sampleRate: number;
  length: number;
  numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}
interface Range { start: number; end: number }

export function planAudioChunks(audio: DecodedAudio): Range[] {
  if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0 || audio.length < 1) {
    throw new Error('The audio file is empty or has an invalid sample rate.');
  }
  const frames = Math.max(1, Math.min(Math.floor(audio.sampleRate * 60), Math.floor((MAX_WAV_BYTES - 44) / 2)));
  const ranges: Range[] = [];
  for (let start = 0; start < audio.length; start += frames) ranges.push({ start, end: Math.min(start + frames, audio.length) });
  return ranges;
}

export function encodeWav(audio: DecodedAudio, range: Range): Uint8Array {
  const bytes = new Uint8Array(44 + (range.end - range.start) * 2);
  const view = new DataView(bytes.buffer);
  const label = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  label(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); label(8, 'WAVE');
  label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); label(36, 'data'); view.setUint32(40, bytes.length - 44, true);
  const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
  for (let frame = range.start; frame < range.end; frame++) {
    const sample = Math.max(-1, Math.min(1, channels.reduce((sum, channel) => sum + channel[frame], 0) / channels.length));
    view.setInt16(44 + (frame - range.start) * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return bytes;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}
function seconds(timestamp: string): number {
  const match = /^(\d{2,}):([0-5]\d):([0-5]\d)\.(\d{3})$/.exec(timestamp);
  if (!match) throw new Error('The subtitle provider returned an invalid timestamp.');
  return +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000;
}
export function audioTimestamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
    .map(value => String(value).padStart(2, '0')).join(':') + '.' + String(ms % 1000).padStart(3, '0');
}

export async function transcribeDecodedAudio(audio: DecodedAudio, options: {
  subtitleProvider: SubtitleProvider;
  autoFallback?: boolean;
  fileName?: string;
  onProgress?: (message: string) => void;
}, request: typeof fetch = fetch) {
  const ranges = planAudioChunks(audio);
  const subtitles: SubtitleAnnotation[] = [];
  const warnings = new Set<string>();
  let completed = 0;
  for (let index = 0; index < ranges.length;) {
    const range = ranges[index];
    options.onProgress?.('Transcribing audio part ' + (index + 1) + ' of ' + ranges.length + '…');
    const body = JSON.stringify({ audioData: base64(encodeWav(audio, range)), audioMimeType: 'audio/wav',
      fileName: (options.fileName || 'audio').slice(0, 160) + '-part-' + (index + 1) + '.wav',
      subtitleProvider: options.subtitleProvider, autoFallback: options.autoFallback });
    if (new TextEncoder().encode(body).length > MAX_REQUEST_BYTES) throw new Error('An audio chunk exceeded the safe upload size.');
    let response: Response;
    try {
      response = await request('/api/transcribe-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-J2-Request': '1' }, body
      });
    } catch {
      throw new Error('Audio part ' + (index + 1) + ' failed after ' + completed + ' completed parts. Check your connection and retry.');
    }
    // Some gateways have a smaller cap. Re-split only the rejected part, not completed work.
    if (response.status === 413 && range.end - range.start > audio.sampleRate) {
      const middle = Math.floor((range.start + range.end) / 2);
      ranges.splice(index, 1, { start: range.start, end: middle }, { start: middle, end: range.end });
      options.onProgress?.('Upload size limit reached. Splitting this audio part into smaller pieces…');
      continue;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error('Audio part ' + (index + 1) + ' failed after ' + completed +
      ' completed parts. ' + (data?.error || (response.status === 413 ? 'The upload gateway rejected even a small audio part.' : 'Transcription failed. Please retry.')));
    if (!Array.isArray(data?.subtitles)) throw new Error('Audio part ' + (index + 1) + ' returned no subtitle array.');
    const offset = range.start / audio.sampleRate;
    const length = (range.end - range.start) / audio.sampleRate;
    for (const sub of data.subtitles as SubtitleAnnotation[]) {
      const start = seconds(sub.start_time), end = seconds(sub.end_time);
      if (typeof sub.text !== 'string' || !sub.text.trim() || start >= length || end <= start || end > length + 0.5) {
        throw new Error('Audio part ' + (index + 1) + ' returned an invalid subtitle range.');
      }
      subtitles.push({ ...sub, start_time: audioTimestamp(offset + start),
        end_time: audioTimestamp(offset + Math.min(end, length)) });
    }
    for (const warning of data._warnings || []) if (typeof warning === 'string') warnings.add(warning);
    completed++; index++;
  }
  subtitles.sort((a, b) => seconds(a.start_time) - seconds(b.start_time));
  return { subtitles: subtitles.map((sub, index) => ({ ...sub, subtitle_id: index + 1 })),
    duration: audio.length / audio.sampleRate, warnings: [...warnings], parts: completed };
}

export async function transcribeAudioFile(file: File, options: Parameters<typeof transcribeDecodedAudio>[1]) {
  options.onProgress?.('Preparing audio and splitting it into upload-safe parts…');
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) throw new Error('This browser cannot prepare audio. Try a current version of Chrome or Edge.');
  const context = new AudioContextClass({ sampleRate: 16000 });
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error('The browser could not decode this audio file. Try MP3, WAV or another supported audio format.');
  } finally {
    await context.close();
  }
  return transcribeDecodedAudio(decoded, { ...options, fileName: file.name });
}
