import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectAudioModel, parseAudioInput, normalizeSubtitles } from '../lib/subtitles.js';
import { validateAnnotationResult } from '../src/utils/validationUtils.js';

const subtitle = { subtitle_id: 4, start_time: '00:00:01.000', end_time: '00:00:02.500',
  type: 'Spoken words', text: '[non-English speech]' };

test('vision and Interactions-only selections cannot enter the Gemini audio path', () => {
  assert.equal(selectAudioModel('openai/gpt-4o-mini'), 'gemini-flash-latest');
  assert.equal(selectAudioModel('gemini-3.5-transcribe'), 'gemini-flash-latest');
  assert.equal(selectAudioModel('gemini-3.1-flash-lite'), 'gemini-3.1-flash-lite');
});
test('audio data URL is validated and MP3 MIME normalized', () => {
  assert.deepEqual(parseAudioInput('data:audio/mp3;base64,YQ=='), { mimeType: 'audio/mpeg', data: 'YQ==' });
  assert.throws(() => parseAudioInput('data:image/png;base64,YQ=='));
  assert.throws(() => parseAudioInput(''));
  assert.throws(() => parseAudioInput('not!base64'));
});
test('silence stays empty; meaningful overlap is preserved; labels normalized', () => {
  assert.deepEqual(normalizeSubtitles([]), []);
  const result = normalizeSubtitles([subtitle, { ...subtitle, text: 'Hello.' }]);
  assert.equal(result[0].text, '[Speaking non-English]');
  assert.equal(result[1].subtitle_id, 2);
  assert.equal(result[1].start_time, subtitle.start_time);
});
test('missing arrays, invalid timings, empty text and unknown categories fail clearly', () => {
  for (const value of [undefined, {}, [{ ...subtitle, end_time: subtitle.start_time }],
    [{ ...subtitle, start_time: 'bad' }], [{ ...subtitle, text: '' }], [{ ...subtitle, type: 'unknown' }]]) {
    assert.throws(() => normalizeSubtitles(value));
  }
});
test('review catches empty subtitles and duplicate/filler scene descriptions', () => {
  const result: any = { suitability: { status: 'suitable' }, scenes: [
    { scene_id: 1, narrative_description: 'This image shows a person.' },
    { scene_id: 2, narrative_description: 'This image shows a person.' }],
    subtitles: [{ ...subtitle, text: '' }] };
  const errors = validateAnnotationResult(result);
  assert(errors.some(e => /Repeated/.test(e.message)));
  assert(errors.some(e => /direct video/.test(e.message)));
  assert(errors.some(e => e.type === 'error'));
});
