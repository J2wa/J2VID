import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { MAX_RESULT_BYTES, timestampSeconds, type ResultFile } from './resultFiles';

export async function readResultPdf(bytes: Uint8Array): Promise<unknown> {
  let pdf: PDFDocument;
  try { pdf = await PDFDocument.load(bytes); } catch { throw new Error('This PDF is damaged or password-protected. Choose an unencrypted ACES Video PDF export.'); }
  const payload = pdf.catalog.lookup(PDFName.of('ACESVideoResults'));
  if (!(payload instanceof PDFRawStream)) throw new Error('This PDF has no ACES Video result data. Import a PDF exported by ACES Video, or use JSON. Scanned and other PDF layouts are not supported.');
  const decoded = decodePDFRawStream(payload).decode();
  if (decoded.length > MAX_RESULT_BYTES) throw new Error('The embedded results exceed 50 MB.');
  try { return JSON.parse(new TextDecoder().decode(decoded)); } catch { throw new Error('The PDF result data is invalid.'); }
}
export async function createResultPdf(file: ResultFile, fontBytes?: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  if (!fontBytes) {
    const response = await fetch('/fonts/DejaVuSans.ttf');
    if (!response.ok) throw new Error('Could not load the PDF font. Please retry.');
    fontBytes = new Uint8Array(await response.arrayBuffer());
  }
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  const safe = (s: string) => Array.from(s).map(c => supported.has(c.codePointAt(0)!) || c === '\n' ? c : '[U+' + c.codePointAt(0)!.toString(16).toUpperCase() + ']').join('');
  pdf.setTitle('ACES Video - ' + (file.kind === 'scenes' ? 'Scene descriptions' : 'Subtitles'));
  pdf.setAuthor('ACES Intelligence');
  const json = new TextEncoder().encode(JSON.stringify(file));
  if (json.length > MAX_RESULT_BYTES) throw new Error('Results exceed 50 MB. Export fewer results or remove large snapshots.');
  pdf.catalog.set(PDFName.of('ACESVideoResults'), pdf.context.register(pdf.context.flateStream(json)));
  await pdf.attach(json, 'aces-video-results.json', { mimeType: 'application/json', description: 'Original editable ACES Video results' });
  let page = pdf.addPage([595.28, 841.89]); let y = 785;
  const line = (value: string, size = 11, blue = false) => {
    if (y < 60) { page = pdf.addPage([595.28, 841.89]); y = 785; }
    page.drawText(value, { x: 44, y, font, size, color: blue ? rgb(.12,.28,.6) : rgb(.1,.13,.18) }); y -= size * 1.5;
  };
  const paragraph = (value: string, size = 11, blue = false) => {
    for (const block of safe(value).split('\n')) {
      let current = '';
      for (const word of block.split(/\s+/)) {
        if (font.widthOfTextAtSize((current ? current + ' ' : '') + word, size) <= 507) { current += (current ? ' ' : '') + word; continue; }
        if (current) line(current,size,blue);
        current = '';
        for (const char of word) {
          if (font.widthOfTextAtSize(current + char, size) > 507) { line(current,size,blue); current = ''; }
          current += char;
        }
      }
      line(current,size,blue);
    }
  };
  paragraph('ACES VIDEO', 22, true);
  paragraph(file.kind === 'scenes' ? 'Scene descriptions' : 'Subtitles', 16);
  paragraph(file.result[file.kind].length + ' results | Duration: ' + file.result.video_duration, 10);
  paragraph('Import this PDF in ACES Video to restore the editable results.', 9);
  y -= 15;
  if (file.kind === 'scenes') for (const scene of file.result.scenes) {
    if (y < 125) { page = pdf.addPage([595.28,841.89]); y = 785; }
    paragraph('Scene ' + scene.scene_id, 13, true);
    if (scene.start_time) paragraph(scene.start_time + ' - ' + scene.end_time, 9);
    paragraph(scene.narrative_description); y -= 16;
  } else for (const sub of file.result.subtitles) {
    if (y < 150) { page = pdf.addPage([595.28,841.89]); y = 785; }
    paragraph('Subtitle ' + sub.subtitle_id + ' | ' + sub.type, 13, true);
    paragraph(sub.start_time + ' - ' + sub.end_time, 10);
    paragraph('Playhead durations: Start ' + timestampSeconds(sub.start_time).toFixed(3) + ' seconds | End ' + timestampSeconds(sub.end_time).toFixed(3) + ' seconds', 9);
    paragraph(sub.text); y -= 16;
  }
  pdf.getPages().forEach((p,i,pages) => p.drawText('ACES Intelligence  |  ' + (i+1) + ' / ' + pages.length, { x:44,y:30,font,size:9,color:rgb(.4,.4,.4) }));
  return pdf.save();
}
