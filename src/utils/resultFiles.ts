import type { VideoAnnotationResult, SceneAnnotation, SubtitleAnnotation, SubtitleType } from '../types';

export type ResultKind = 'scenes' | 'subtitles';
export interface ResultFile { format: 'aces-video-results'; version: 1; kind: ResultKind; result: VideoAnnotationResult }
const types: SubtitleType[] = ['Spoken words', 'Music', 'Sound effect', 'Ambient sound', 'Vocal sound', 'Other'];
export const MAX_RESULT_BYTES = 50 * 1024 * 1024;
export const emptyResult = (): VideoAnnotationResult => ({
  video_duration: '00:00:00.000',
  suitability: { status: 'suitable', category: null, confidence: 1, reason: '' },
  scenes: [], subtitles: []
});
function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length > 100000) throw new Error(label + ' must be text (up to 100,000 characters).');
  return value;
}
export function timestampSeconds(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{2,}:\d{2}:\d{2}\.\d{3}$/.test(value)) throw new Error('Times must use HH:MM:SS.mmm.');
  const [h,m,s] = value.split(':').map(Number);
  if (m >= 60 || s >= 60) throw new Error('Invalid timestamp: ' + value);
  return h * 3600 + m * 60 + s;
}
function range(start: unknown, end: unknown) {
  if (timestampSeconds(end) <= timestampSeconds(start)) throw new Error('End time must be after start time.');
}
export function parseResultFile(value: unknown, kind: ResultKind): ResultFile {
  const source: any = value;
  if (!source || typeof source !== 'object') throw new Error('Choose a JSON result object or an ACES Video PDF export.');
  if (source.format && (source.format !== 'aces-video-results' || source.version !== 1)) throw new Error('Unsupported result format or version.');
  if (source.format && source.kind !== kind) throw new Error('This file contains ' + source.kind + '. Import it in that workspace.');
  const raw = source.format ? source.result : source;
  const records = Array.isArray(raw) ? raw : raw?.[kind];
  if (!Array.isArray(records) || !records.length || records.length > 10000) throw new Error('The file must contain 1–10,000 ' + kind + '.');
  const ids = new Set<number>();
  const id = (n: unknown) => {
    if (!Number.isSafeInteger(n) || Number(n) < 1 || ids.has(Number(n))) throw new Error('Result IDs must be unique positive integers.');
    ids.add(Number(n)); return Number(n);
  };
  const scenes: SceneAnnotation[] = kind === 'scenes' ? records.map((s: any) => {
    if (!s || typeof s !== 'object') throw new Error('Invalid scene.');
    const scene: SceneAnnotation = { scene_id: id(s.scene_id), narrative_description: text(s.narrative_description, 'Description') };
    if (s.start_time !== undefined || s.end_time !== undefined) { range(s.start_time, s.end_time); scene.start_time = s.start_time; scene.end_time = s.end_time; }
    for (const key of ['raw_description', 'initial_background'] as const) if (s[key] !== undefined) scene[key] = text(s[key], key);
    for (const key of ['start_image', 'snapshot_image'] as const) if (s[key] !== undefined) {
      if (typeof s[key] !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(s[key])) throw new Error('Snapshots must be embedded PNG, JPEG or WebP images.');
      scene[key] = s[key];
    }
    if (s.revision_history !== undefined) {
      if (!Array.isArray(s.revision_history)) throw new Error('Invalid revision history.');
      scene.revision_history = s.revision_history.map((v: unknown) => text(v, 'Revision'));
    }
    return scene;
  }) : [];
  const subtitles: SubtitleAnnotation[] = kind === 'subtitles' ? records.map((s: any) => {
    if (!s || typeof s !== 'object') throw new Error('Invalid subtitle.');
    range(s.start_time, s.end_time);
    if (!types.includes(s.type)) throw new Error('Unsupported subtitle type.');
    return { subtitle_id: id(s.subtitle_id), start_time: s.start_time, end_time: s.end_time, type: s.type, text: text(s.text, 'Subtitle') };
  }) : [];
  const result = { ...emptyResult(), scenes, subtitles };
  if (raw.video_duration !== undefined) { timestampSeconds(raw.video_duration); result.video_duration = raw.video_duration; }
  if (raw.suitability) {
    const s = raw.suitability;
    if (!['suitable','discarded'].includes(s.status) || ![null,'Live Performance','Documentary','Movie','Advertisement'].includes(s.category) || typeof s.confidence !== 'number' || !Number.isFinite(s.confidence) || s.confidence < 0 || s.confidence > 1) throw new Error('Invalid suitability metadata.');
    result.suitability = { status: s.status, category: s.category, confidence: s.confidence, reason: text(s.reason, 'Suitability reason') };
  }
  for (const key of ['_modelUsed','_fellBackFrom'] as const) if (raw[key] !== undefined) result[key] = text(raw[key], key);
  return { format: 'aces-video-results', version: 1, kind, result };
}
export function mergeImportedResult(previous: VideoAnnotationResult | null, file: ResultFile): VideoAnnotationResult {
  return { ...(previous || file.result), [file.kind]: file.result[file.kind] };
}
export async function readResultFile(file: File, kind: ResultKind): Promise<ResultFile> {
  if (file.size > MAX_RESULT_BYTES) throw new Error('Choose a file smaller than 50 MB.');
  let data: unknown;
  if (/\.json$/i.test(file.name)) {
    try { data = JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON.'); }
  } else if (/\.pdf$/i.test(file.name)) {
    const { readResultPdf } = await import('./resultPdf');
    data = await readResultPdf(new Uint8Array(await file.arrayBuffer()));
  } else throw new Error('Choose a .json or .pdf file.');
  return parseResultFile(data, kind);
}
export function downloadResult(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
