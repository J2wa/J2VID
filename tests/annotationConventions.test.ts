import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanSceneNarrative, normalizeSubtitles, NON_ENGLISH_SPEECH } from '../lib/annotationConventions.js';

test('replaces only non-English speech while preserving timing and English speech', () => {
  const data = normalizeSubtitles({ subtitles: [
    { subtitle_id: 1, start_time: '00:00:01.000', end_time: '00:00:02.000', type: 'Spoken words', text: 'Hello', language: 'English' },
    { subtitle_id: 2, start_time: '00:00:02.000', end_time: '00:00:03.000', type: 'Spoken words', text: 'Kamusta', language: 'non-English' },
    { subtitle_id: 3, start_time: '00:00:03.000', end_time: '00:00:04.000', type: 'Sound effect', text: '[door slams]', language: 'none' }
  ] });
  assert.equal(data.subtitles[0].text, 'Hello');
  assert.equal(data.subtitles[1].text, NON_ENGLISH_SPEECH);
  assert.equal(data.subtitles[1].start_time, '00:00:02.000');
  assert.equal(data.subtitles[2].text, '[door slams]');
});

test('a mixed speech entry is masked if the model fails to split it', () => {
  const data = normalizeSubtitles({ subtitles: [
    { type: 'Spoken words', text: 'Hello, kamusta', language: 'mixed' }
  ] });
  assert.equal(data.subtitles[0].text, NON_ENGLISH_SPEECH);
});

test('keeps visual facts and removes empty scene filler', () => {
  const description = "A monkey faces the camera with dark eyes and light fur. The background remains dark and out of focus, providing no additional environmental context. No movement or transition occurs within the frame.";
  assert.equal(
    cleanSceneNarrative(description),
    'A monkey faces the camera with dark eyes and light fur. The background remains dark and out of focus.'
  );
});
