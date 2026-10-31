import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeWav, planAudioChunks, transcribeDecodedAudio, MAX_REQUEST_BYTES } from '../src/utils/audioUpload.js';

function audio(duration: number, sampleRate = 16000) {
  const samples = new Float32Array(Math.round(duration * sampleRate));
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 0.1) * 0.2;
  return { sampleRate, length: samples.length, numberOfChannels: 1, getChannelData: () => samples };
}
const line = (start = '00:00:01.000', end = '00:00:02.000') =>
  ({ subtitle_id: 1, start_time: start, end_time: end, type: 'Spoken words', text: 'Hello.' });

test('large decoded audio becomes independently playable bounded WAVs with complete sample coverage', () => {
  const source = audio(181);
  const ranges = planAudioChunks(source);
  assert.equal(ranges.length, 4);
  let next = 0;
  for (const range of ranges) {
    assert.equal(range.start, next);
    const wav = encodeWav(source, range);
    const header = new DataView(wav.buffer);
    assert.equal(new TextDecoder().decode(wav.subarray(0, 4)), 'RIFF');
    assert.equal(header.getUint32(40, true), (range.end - range.start) * 2);
    assert.equal(header.getUint32(24, true), 16000);
    assert(wav.length * 4 / 3 + 1000 < MAX_REQUEST_BYTES);
    next = range.end;
  }
  assert.equal(next, source.length);
});
test('transcription offsets every part to the original timeline and preserves overlapping speech', async () => {
  const bodies: any[] = [];
  const result = await transcribeDecodedAudio(audio(180), { subtitleProvider: 'deepgram' }, (async (_url, init) => {
    assert(new TextEncoder().encode(String(init?.body)).length < MAX_REQUEST_BYTES);
    bodies.push(JSON.parse(String(init?.body)));
    return Response.json({ subtitles: [line(), line('00:00:01.500', '00:00:02.500')] });
  }) as typeof fetch);
  assert.equal(bodies.length, 3);
  assert.equal(bodies[0].subtitleProvider, 'deepgram');
  assert.equal(result.subtitles[2].start_time, '00:01:01.000');
  assert.equal(result.subtitles[4].start_time, '00:02:01.000');
  assert.deepEqual(result.subtitles.map(s => s.subtitle_id), [1, 2, 3, 4, 5, 6]);
});
test('413 automatically splits just the rejected part without repeating completed API calls', async () => {
  const sizes: number[] = [];
  let attempts = 0;
  const result = await transcribeDecodedAudio(audio(120), { subtitleProvider: 'gemini' }, (async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const data = Buffer.from(body.audioData, 'base64');
    sizes.push(data.length);
    if (++attempts === 2) return new Response('Payload too large', { status: 413 });
    return Response.json({ subtitles: [line()] });
  }) as typeof fetch);
  assert.equal(attempts, 4);
  assert.equal(result.parts, 3);
  assert.equal(sizes[0], sizes[1]);
  assert(sizes[2] < sizes[1]);
  assert.deepEqual(result.subtitles.map(s => s.start_time), ['00:00:01.000', '00:01:01.000', '00:01:31.000']);
});
test('failed parts reject the result without replacing existing subtitles; auth errors are not retried', async () => {
  let attempts = 0;
  await assert.rejects(transcribeDecodedAudio(audio(120), { subtitleProvider: 'deepgram' }, (async () => {
    attempts++;
    return attempts === 1 ? Response.json({ subtitles: [] }) : Response.json({ error: 'Sign in again.' }, { status: 401 });
  }) as typeof fetch), /part 2 failed after 1 completed parts/);
  assert.equal(attempts, 2);
});
test('small gateway caps stop bounded retries and invalid provider ranges fail clearly', async () => {
  let attempts = 0;
  await assert.rejects(transcribeDecodedAudio(audio(2), { subtitleProvider: 'deepgram' }, (async () => {
    attempts++; return new Response('', { status: 413 });
  }) as typeof fetch), /gateway rejected/);
  assert.equal(attempts, 2);
  await assert.rejects(transcribeDecodedAudio(audio(2), { subtitleProvider: 'deepgram' }, (async () =>
    Response.json({ subtitles: [line('bad', '00:00:01.000')] })) as typeof fetch), /invalid timestamp/);
});
