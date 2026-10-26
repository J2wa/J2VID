import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelSelection, AVAILABLE_MODELS, DEFAULT_MODEL_ID, GEMINI_MODEL_IDS } from '../src/data/models.js';
import { apiHealth } from '../lib/api-health.js';
import health from '../api/health.js';

test('saved stale models migrate and task-incompatible models cannot enter scene generation', () => {
  assert.equal(resolveModelSelection('gemini-3.1-flash-lite'), 'gemini-3.5-flash-lite');
  assert.equal(resolveModelSelection('gemini-3.1-pro-preview'), 'gemini-4-argon');
  assert.equal(resolveModelSelection('google/gemini-2.5-flash:free'), 'openrouter/free');
  assert.equal(resolveModelSelection('gemini-3.5-transcribe'), DEFAULT_MODEL_ID);
  assert(AVAILABLE_MODELS.some(m => m.id === 'google/gemini-4-argon'));
  assert(!GEMINI_MODEL_IDS.includes('gemini-3.5-transcribe'));
});
test('Vercel health recognizes backup-only keys and exposes no secret values', () => {
  const saved = { ...process.env };
  for (const key of Object.keys(process.env)) if (/^(GEMINI|GOOGLE|OPENROUTER|DEEPGRAM).*KEY/.test(key)) delete process.env[key];
  Object.assign(process.env, { GEMINI_API_KEY_3: 'synthetic-google-private', OPENROUTER_API_KEY_2: 'synthetic-router-private', DEEPGRAM_API_KEY_3: 'synthetic-deepgram-private' });
  try {
    let result: any;
    const res: any = { setHeader: () => {}, status: () => res, json: (value: any) => { result = value; } };
    health({} as any, res);
    assert.equal(result.hasGeminiKey, true);
    assert.equal(result.hasOpenRouterKey, true);
    assert.equal(result.hasDeepgramKey, true);
    assert.deepEqual(result.availableGeminiModels, apiHealth().availableGeminiModels);
    assert(!JSON.stringify(result).includes('synthetic-'));
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
