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
interface Range { start: number; end: number; timingSplits?: number }
class ChunkTimingError extends Error {}

// Keep completed requests in memory for a retry with the same File and settings.
// Nothing is persisted to browser storage or shared between files/providers.
export function createAudioCheckpoint(audio: DecodedAudio) {
  return { ranges: planAudioChunks(audio), index: 0, subtitles: [] as SubtitleAnnotation[],
    warnings: new Set<string>(), sampleRate: audio.sampleRate, length: audio.length };
}
const fileCheckpoints = new WeakMap<File, Map<string, ReturnType<typeof createAudioCheckpoint>>>();

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
  if (!match) throw new ChunkTimingError('The subtitle provider returned an invalid timestamp.');
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
}, request: typeof fetch = fetch, checkpoint = createAudioCheckpoint(audio)) {
  if (checkpoint.sampleRate !== audio.sampleRate || checkpoint.length !== audio.length) {
    throw new Error('The audio changed. Choose the file again to start a new transcription.');
  }
  const { ranges, subtitles, warnings } = checkpoint;
  if (checkpoint.index) options.onProgress?.('Resuming audio after ' + checkpoint.index + ' completed parts…');
  while (checkpoint.index < ranges.length) {
    const index = checkpoint.index;
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
      throw new Error('Audio part ' + (index + 1) + ' failed after ' + index + ' completed parts. Check your connection and retry.');
    }
    // Some gateways have a smaller cap. Re-split only the rejected part, not completed work.
    if (response.status === 413 && range.end - range.start > audio.sampleRate) {
      const middle = Math.floor((range.start + range.end) / 2);
      ranges.splice(index, 1, { ...range, end: middle }, { ...range, start: middle });
      options.onProgress?.('Upload size limit reached. Splitting this audio part into smaller pieces…');
      continue;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error('Audio part ' + (index + 1) + ' failed after ' + index +
      ' completed parts. ' + (data?.error || (response.status === 413 ? 'The upload gateway rejected even a small audio part.' : 'Transcription failed. Please retry.')));
    if (!Array.isArray(data?.subtitles)) throw new Error('Audio part ' + (index + 1) + ' returned no subtitle array.');
    const offset = range.start / audio.sampleRate;
    const length = (range.end - range.start) / audio.sampleRate;
    // Validate the whole response before adding anything, so a retry cannot duplicate
    // earlier lines from a partly valid response. Only small boundary drift is clipped.
    const chunkSubtitles: SubtitleAnnotation[] = [];
    let clipped = false;
    try {
      for (const [lineIndex, sub] of (data.subtitles as SubtitleAnnotation[]).entries()) {
        if (!sub || typeof sub.text !== 'string' || !sub.text.trim()) {
          throw new Error('Audio part ' + (index + 1) + ' returned an empty subtitle.');
        }
        const start = seconds(sub.start_time), end = seconds(sub.end_time);
        if (start >= length || end <= start || end > length + 2) {
          throw new ChunkTimingError('Subtitle ' + (lineIndex + 1) + ' has range ' + sub.start_time +
            '–' + sub.end_time + ' for a ' + length.toFixed(3) + '-second audio part.');
        }
        const startTime = audioTimestamp(offset + start);
        const endTime = audioTimestamp(offset + Math.min(end, length));
        if (seconds(endTime) <= seconds(startTime)) {
          throw new ChunkTimingError('A subtitle collapses at the audio boundary after millisecond rounding.');
        }
        clipped ||= end > length;
        chunkSubtitles.push({ ...sub, start_time: startTime, end_time: endTime });
      }
    } catch (error) {
      if (!(error instanceof ChunkTimingError)) throw error;
      // Two levels (60 → 30 → 15 seconds) bound provider calls for bad timing.
      if ((range.timingSplits || 0) < 2 && range.end - range.start >= audio.sampleRate * 2) {
        const middle = Math.floor((range.start + range.end) / 2);
        const timingSplits = (range.timingSplits || 0) + 1;
        ranges.splice(index, 1, { start: range.start, end: middle, timingSplits },
          { start: middle, end: range.end, timingSplits });
        options.onProgress?.('Audio part ' + (index + 1) + ' had invalid timing. Retrying just this part in smaller pieces…');
        warnings.add('Some audio parts needed smaller chunks to recover subtitle timing. Review those boundaries.');
        continue;
      }
      throw new Error('Audio part ' + (index + 1) + ' returned invalid subtitle timing after ' + index +
        ' completed parts. ' + error.message + ' Completed parts are kept while this page stays open; retry the same file.');
    }
    subtitles.push(...chunkSubtitles);
    if (clipped) warnings.add('Some subtitle ends were clipped to the audio boundary (up to 2 seconds). Review those endings.');
    for (const warning of data._warnings || []) if (typeof warning === 'string') warnings.add(warning);
    checkpoint.index++;
  }
  subtitles.sort((a, b) => seconds(a.start_time) - seconds(b.start_time));
  return { subtitles: subtitles.map((sub, index) => ({ ...sub, subtitle_id: index + 1 })),
    duration: audio.length / audio.sampleRate, warnings: [...warnings], parts: checkpoint.index };
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
  const settings = options.subtitleProvider + ':' + (options.autoFallback !== false);
  const checkpoints = fileCheckpoints.get(file) || new Map();
  if (!checkpoints.has(settings)) checkpoints.set(settings, createAudioCheckpoint(decoded));
  fileCheckpoints.set(file, checkpoints);
  return transcribeDecodedAudio(decoded, { ...options, fileName: file.name }, fetch, checkpoints.get(settings));
}
