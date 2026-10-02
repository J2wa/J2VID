import { test } from 'node:test';
import assert from 'node:assert/strict';

test('audio service sends audio to a compatible Gemini model and validates the SDK response', async () => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  process.env.VERCEL = '1';
  process.env.GEMINI_API_KEY = 'synthetic-test-key';
  delete process.env.GEMINI_AUDIO_API_KEY;
  delete process.env.GEMINI_AUDIO_MODEL;
  const requests: any[] = [];
  let malformed = false;
  let useBackups = false;
  globalThis.fetch = async (input, init) => {
    const key = new Headers(init?.headers).get('x-goog-api-key');
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)), key });
    if (useBackups && key !== 'synthetic-audio-3') {
      return new Response(JSON.stringify({ error: { code: 401, message: 'synthetic auth failure' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text:
      JSON.stringify(malformed ? {} : { subtitles: [{ subtitle_id: 9,
        start_time: '00:00:01.000', end_time: '00:00:02.000',
        type: 'Spoken words', text: '[non-English speech]' }] }) }] }, finishReason: 'STOP' }] }),
      { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const { transcribeAudio } = await import('../server.js');
    const result = await transcribeAudio('data:audio/mp3;base64,YQ==', undefined, 'openai/gpt-4o-mini', false);
    assert.match(requests[0].url, /gemini-flash-latest:generateContent/);
    assert.equal(requests[0].body.contents[0].parts[0].inlineData.mimeType, 'audio/mpeg');
    assert.match(JSON.stringify(requests[0].body), /Speaking non-English/);
    assert.equal(result.subtitles[0].text, '[Speaking non-English]');
    assert.equal(result.subtitles[0].subtitle_id, 1);
    process.env.GEMINI_AUDIO_API_KEY = 'synthetic-audio-1';
    process.env.GEMINI_AUDIO_API_KEY_2 = 'synthetic-audio-2';
    process.env.GEMINI_AUDIO_API_KEY_3 = 'synthetic-audio-3';
    useBackups = true;
    const backupResult = await transcribeAudio('YQ==', 'audio/mpeg', undefined, true);
    assert.equal(backupResult.subtitles.length, 1);
    assert.deepEqual(requests.slice(-3).map(request => request.key),
      ['synthetic-audio-1', 'synthetic-audio-2', 'synthetic-audio-3']);
    useBackups = false;
    malformed = true;
    await assert.rejects(transcribeAudio('YQ==', 'audio/mpeg', undefined, false), /no subtitle array/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
