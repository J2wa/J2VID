export type KeyPurpose = 'gemini' | 'openrouter' | 'audio' | 'deepgram';

function pool(env: NodeJS.ProcessEnv, prefix: string): string[] {
  const values = [env[prefix]?.trim() || env[prefix + '_1'], env[prefix + '_2'], env[prefix + '_3']];
  return [...new Set(values.map(value => value?.trim()).filter((value): value is string => !!value))];
}

export function getApiKeys(purpose: KeyPurpose, env: NodeJS.ProcessEnv = process.env): string[] {
  if (purpose === 'deepgram') return pool(env, 'DEEPGRAM_API_KEY');
  if (purpose === 'openrouter') return pool(env, 'OPENROUTER_API_KEY');
  if (purpose === 'audio') {
    const dedicated = pool(env, 'GEMINI_AUDIO_API_KEY');
    return dedicated.length ? dedicated : getApiKeys('gemini', env);
  }
  const keys = pool(env, 'GEMINI_API_KEY');
  if (keys.length) return keys;
  return [...new Set([env.GOOGLE_API_KEY, env.GOOGLE_GENAI_API_KEY]
    .map(value => value?.trim()).filter((value): value is string => !!value))];
}

export function canTryBackupKey(error: any): boolean {
  const status = Number(error?.status || error?.statusCode || error?.code || 0);
  return [401, 402, 403, 429, 500, 502, 503, 504].includes(status);
}

// Ordered, bounded failover. No values are returned to the client or logged.
export async function withApiKeyFallback<T>(
  keys: string[], request: (key: string) => Promise<T>, enabled = true
): Promise<T> {
  if (!keys.length) throw new Error('No API key is configured for this purpose.');
  const candidates = enabled ? keys : keys.slice(0, 1);
  for (let index = 0; index < candidates.length; index++) {
    try {
      return await request(candidates[index]);
    } catch (error) {
      if (index === candidates.length - 1 || !canTryBackupKey(error)) throw error;
    }
  }
  throw new Error('No API key is configured for this purpose.');
}
