import { VideoAnnotationResult, SubtitleAnnotation } from '../types';

/**
 * Converts HH:MM:SS.mmm to SRT timestamp HH:MM:SS,mmm
 */
function toSrtTimestamp(ts: string): string {
  return ts.replace('.', ',');
}

/**
 * Generates standard SRT subtitle string
 */
export function generateSrtContent(subtitles: SubtitleAnnotation[]): string {
  if (!subtitles || subtitles.length === 0) return '';

  return subtitles
    .map((sub, index) => {
      const start = toSrtTimestamp(sub.start_time);
      const end = toSrtTimestamp(sub.end_time);
      return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`;
    })
    .join('\n');
}

/**
 * Generates standard WebVTT string
 */
export function generateVttContent(subtitles: SubtitleAnnotation[]): string {
  let vtt = 'WEBVTT - Agentic Video Annotator Subtitles\n\n';

  if (!subtitles || subtitles.length === 0) return vtt;

  const body = subtitles
    .map((sub) => {
      return `${sub.start_time} --> ${sub.end_time}\n${sub.text}\n`;
    })
    .join('\n');

  return vtt + body;
}

/**
 * Downloads text as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
