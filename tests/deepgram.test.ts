import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepgramToSubtitles, transcribeDeepgram } from '../lib/deepgram.js';

const word = (text: string, start: number, end: number, language: string, speaker = 0) =>
  ({ word: text, punctuated_word: text, start, end, language, speaker });
const response = (words: any[], languages?: string[]) =>
  ({ results: { channels: [{ alternatives: [{ transcript: words.map(w => w.word).join(' '), words, languages }] }] } });

test('English and non-English runs retain exact word boundaries without exposing foreign text', () => {
  const result = deepgramToSubtitles(response([word('Hello', 0.1, 0.4, 'en'), word('amigo', 0.4, 0.8, 'es'),
    word('hola', 0.8, 1.1, 'es'), word('Welcome.', 1.1, 1.8, 'en-US')]));
  assert.deepEqual(result.subtitles.map(s => s.text), ['Hello', '[Speaking non-English]', 'Welcome.']);
  assert.equal(result.subtitles[1].start_time, '00:00:00.400');
  assert.equal(result.subtitles[1].end_time, '00:00:01.100');
  assert.doesNotMatch(JSON.stringify(result), /amigo|hola/);
});
test('overlapping speakers remain overlapping and silence stays empty', () => {
  const result = deepgramToSubtitles(response([word('Yes.', 1, 2, 'en', 0), word('Okay.', 1.5, 2.5, 'en', 1)]));
  assert.equal(result.subtitles.length, 2);
  assert.equal(result.subtitles[1].start_time, '00:00:01.500');
  assert.deepEqual(deepgramToSubtitles(response([])).subtitles, []);
});
test('long speech is split; millisecond rounding carries into the next second', () => {
  const words = Array.from({ length: 30 }, (_, i) => word('something', i * 0.4, i * 0.4 + 0.35, 'en'));
  assert(deepgramToSubtitles(response(words)).subtitles.length > 1);
  assert.equal(deepgramToSubtitles(response([word('Hello.', 59.9996, 60.5, 'en')])).subtitles[0].start_time, '00:01:00.000');
});
test('missing language is not assumed English; malformed responses fail clearly', () => {
  const result = deepgramToSubtitles(response([{ word: 'unknown', start: 0.1, end: 0.3 }]));
  assert.equal(result.subtitles[0].text, '[indistinct chatter]');
  assert.equal(result.unknownLanguage, true);
  for (const payload of [{}, response([{ word: 'bad', start: 2, end: 1 }]),
    { results: { channels: [{ alternatives: [{ transcript: 'Missing timing', words: [] }] }] } }]) {
    assert.throws(() => deepgramToSubtitles(payload));
  }
});
test('transport sends binary audio with server key, bounded backup retries and no Gemini calls', async () => {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  Object.assign(process.env, { DEEPGRAM_API_KEY: 'synthetic-1', DEEPGRAM_API_KEY_2: 'synthetic-2', DEEPGRAM_API_KEY_3: 'synthetic-3' });
  delete process.env.DEEPGRAM_MODEL;
  const seen: string[] = [];
  globalThis.fetch = async (url, init) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.hostname, 'api.deepgram.com');
    assert.equal(parsed.searchParams.get('language'), 'multi');
    assert.equal(parsed.searchParams.get('profanity_filter'), 'true');
    assert.equal(parsed.searchParams.get('filler_words'), 'true');
    assert.equal(new Headers(init?.headers).get('Content-Type'), 'audio/mpeg');
    assert.equal(Buffer.from(init?.body as any).toString(), 'a');
    const auth = new Headers(init?.headers).get('Authorization')!;
    seen.push(auth);
    if (auth !== 'Token synthetic-3') return new Response('secret provider body', { status: 401 });
    return Response.json(response([word('Hello.', 0.1, 0.5, 'en')]));
  };
  try {
    const result = await transcribeDeepgram('data:audio/mp3;base64,YQ==');
    assert.deepEqual(seen, ['Token synthetic-1', 'Token synthetic-2', 'Token synthetic-3']);
    assert.equal(result._provider, 'deepgram');
    assert.equal(result.subtitles[0].text, 'Hello.');
    seen.length = 0;
    await assert.rejects(transcribeDeepgram('YQ==', 'audio/mpeg', false), error =>
      !String(error).includes('secret provider body'));
    assert.equal(seen.length, 1);
    delete process.env.DEEPGRAM_API_KEY; delete process.env.DEEPGRAM_API_KEY_2; delete process.env.DEEPGRAM_API_KEY_3;
    await assert.rejects(transcribeDeepgram('YQ=='), /DEEPGRAM_API_KEY/);
  } finally {
    globalThis.fetch = original;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
