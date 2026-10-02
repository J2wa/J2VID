import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApiKeys, withApiKeyFallback } from '../lib/api-keys.js';

test('three independent pools preserve order, trim values, and deduplicate', () => {
  const env = { GEMINI_API_KEY: ' scene1 ', GEMINI_API_KEY_2: 'scene2', GEMINI_API_KEY_3: 'scene3',
    OPENROUTER_API_KEY: 'router1', OPENROUTER_API_KEY_2: 'router2', OPENROUTER_API_KEY_3: 'router3',
    GEMINI_AUDIO_API_KEY: 'audio1', GEMINI_AUDIO_API_KEY_2: 'audio2', GEMINI_AUDIO_API_KEY_3: 'audio3' };
  assert.deepEqual(getApiKeys('gemini', env), ['scene1', 'scene2', 'scene3']);
  assert.deepEqual(getApiKeys('openrouter', env), ['router1', 'router2', 'router3']);
  assert.deepEqual(getApiKeys('audio', env), ['audio1', 'audio2', 'audio3']);
  assert.deepEqual(getApiKeys('gemini', { GEMINI_API_KEY: 'a', GEMINI_API_KEY_2: ' a ' }), ['a']);
  assert.deepEqual(getApiKeys('gemini', { GEMINI_API_KEY_1: 'a' }), ['a']);
});
test('audio inherits all Gemini keys only when its dedicated pool is absent', () => {
  assert.deepEqual(getApiKeys('audio', { GEMINI_API_KEY: 'a', GEMINI_API_KEY_2: 'b', GEMINI_API_KEY_3: 'c' }), ['a', 'b', 'c']);
  assert.deepEqual(getApiKeys('audio', { GEMINI_API_KEY: 'a', GEMINI_AUDIO_API_KEY_3: 'c' }), ['c']);
  assert.deepEqual(getApiKeys('gemini', { GOOGLE_API_KEY: 'legacy' }), ['legacy']);
});
test('auth, quota and availability errors can progress through all three keys', async () => {
  for (const status of [401, 402, 403, 429, 500, 502, 503, 504]) {
    const seen: string[] = [];
    const result = await withApiKeyFallback(['a', 'b', 'c'], async key => {
      seen.push(key);
      if (key !== 'c') throw Object.assign(new Error('synthetic provider error'), { status });
      return 'ok';
    });
    assert.equal(result, 'ok');
    assert.deepEqual(seen, ['a', 'b', 'c']);
  }
});
test('bad requests are not retried; disabling fallback uses only the primary; exhaustion is bounded', async () => {
  for (const [status, enabled, expected] of [[400, true, 1], [429, false, 1], [429, true, 3]] as const) {
    let attempts = 0;
    await assert.rejects(withApiKeyFallback(['a', 'b', 'c'], async () => {
      attempts++;
      throw Object.assign(new Error('synthetic provider error'), { status });
    }, enabled));
    assert.equal(attempts, expected);
  }
  await assert.rejects(withApiKeyFallback([], async () => 'never'), /No API key/);
});
