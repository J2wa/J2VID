import { audioTimestamp, transcribeAudioFile } from './audioUpload';
import type { SubtitleAnnotation } from '../types';

export interface AudioFileInfo { name: string; number: number | null; start: number | null; end: number | null; }
const natural = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function parseAudioFilename(name: string): AudioFileInfo {
  const stem = name.replace(/\.[a-z0-9]+$/i, '');
  // h/m/s labels or HH:MM:SS / HH_MM_SS clocks; timestamps are not sequence numbers.
  const pattern = /\d+h\d{1,2}m\d{1,2}(?:\.\d+)?s|\d{2,}[:_]\d{2}[:_]\d{2}(?:\.\d+)?/gi;
  const times = [...stem.matchAll(pattern)];
  const toSeconds = (value: string) => {
    const values = value.toLowerCase().replace(/[hms:_]/g, ' ').trim().split(/\s+/).map(Number);
    if (values[1] >= 60 || values[2] >= 60) throw new Error(`Invalid timestamp in ${name}. Use hours, minutes 00–59 and seconds 00–59.`);
    return values[0] * 3600 + values[1] * 60 + values[2];
  };
  if(times.length !== 0 && times.length !== 2) throw new Error(`Include both start and end timestamps in ${name}, or use a numbered filename without timestamps.`);
  const start = times.length ? toSeconds(times[0][0]) : null;
  const end = times.length ? toSeconds(times[1][0]) : null;
  if(start !== null && end! <= start) throw new Error(`End time must be after start time in ${name}.`);
  const withoutTimes = stem.replace(pattern, ' ');
  const match = withoutTimes.match(/\d+/);
  const number = match ? Number(match[0]) : null;
  return { name, number, start, end };
}

export function orderAudioFiles<T extends {name: string}>(files: readonly T[]) {
  return files.map((file, index) => ({ file, info: parseAudioFilename(file.name), index }))
    .sort((a,b) => {
      if(a.info.number !== null || b.info.number !== null) {
        const diff = (a.info.number ?? Infinity) - (b.info.number ?? Infinity);
        if(diff) return diff;
      }
      if(a.info.start !== null && b.info.start !== null && a.info.start !== b.info.start) return a.info.start - b.info.start;
      return natural.compare(a.file.name,b.file.name) || a.index - b.index;
    });
}

function seconds(value: string) {
  const [h,m,s] = value.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

export async function transcribeAudioFiles(files: readonly File[], options: Parameters<typeof transcribeAudioFile>[1], transcribe = transcribeAudioFile) {
  const ordered = orderAudioFiles(files);
  if(!ordered.length) throw new Error('Choose at least one audio file.');
  const subtitles: SubtitleAnnotation[] = [];
  const warnings = new Set<string>();
  let cursor = 0, parts = 0;
  for(const [index, {file, info}] of ordered.entries()) {
    const offset = info.start ?? cursor;
    if(offset < cursor - 0.05) throw new Error(`${file.name} starts before the previous file ends. Check the filenames and clip ranges.`);
    const data = await transcribe(file, { ...options, onProgress: message => options.onProgress?.(`File ${index + 1} of ${ordered.length} · ${file.name} · ${message}`) });
    if(info.end !== null && Math.abs((info.end - offset) - data.duration) > 1) {
      warnings.add(`${file.name}: filename duration differs from the audio length. Actual audio length was used; review its timing.`);
    }
    for(const sub of data.subtitles) subtitles.push({ ...sub,
      start_time: audioTimestamp(offset + seconds(sub.start_time)),
      end_time: audioTimestamp(offset + seconds(sub.end_time)) });
    data.warnings.forEach(warning => warnings.add(warning));
    cursor = offset + data.duration;
    parts += data.parts;
  }
  return { subtitles: subtitles.map((sub,index)=>({...sub,subtitle_id:index+1})), duration:cursor, parts, warnings:[...warnings] };
}
