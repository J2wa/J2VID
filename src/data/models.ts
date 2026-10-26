export type ModelProvider = 'gemini' | 'openrouter';

export interface ModelOption {
  id: string;
  provider: ModelProvider;
  name: string;
  tag: string;
  description: string;
  isDefault?: boolean;
  freeTierStatus: string;
  badgeColor: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose';
  requiresKey: 'gemini' | 'openrouter';
}

// Reviewed against provider catalogs on 2026-10-26. This is a supported catalog,
// not a claim that a particular account has access or remaining quota.
export const MODEL_CATALOG_REVIEWED = '2026-10-26';
export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL_ID = 'gemini-3.5-flash-lite';
export const DEFAULT_OPENROUTER_MODEL_ID = 'openrouter/free';
export const OPENROUTER_FALLBACK_MODEL_ID = 'openrouter/free';

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: DEFAULT_MODEL_ID, provider: 'gemini', name: 'Gemini 3.8 Flash', tag: 'Recommended Default',
    description: 'Current stable Flash model for multimodal scene annotation.', isDefault: true,
    freeTierStatus: 'Account quota and billing apply', badgeColor: 'blue', requiresKey: 'gemini' },
  { id: 'gemini-4-argon', provider: 'gemini', name: 'Gemini 4 Argon', tag: 'Latest Flagship',
    description: 'Latest stable reasoning model with image, video, audio and structured output support.',
    freeTierStatus: 'Check account access and pricing', badgeColor: 'purple', requiresKey: 'gemini' },
  { id: GEMINI_FALLBACK_MODEL_ID, provider: 'gemini', name: 'Gemini 3.5 Flash-Lite', tag: 'Efficient Fallback',
    description: 'Current stable Flash-Lite model for lower-latency multimodal requests.',
    freeTierStatus: 'Account quota and billing apply', badgeColor: 'emerald', requiresKey: 'gemini' },
  { id: 'openrouter/free', provider: 'openrouter', name: 'OpenRouter: Free Models Router', tag: 'Free Router',
    description: 'Routes to available free models compatible with the request. Model choice and availability vary.',
    freeTierStatus: 'Free; OpenRouter rate limits apply', badgeColor: 'cyan', requiresKey: 'openrouter' },
  { id: 'google/gemini-3.8-flash', provider: 'openrouter', name: 'OpenRouter: Gemini 3.8 Flash', tag: 'Multimodal',
    description: 'Current Gemini Flash via your OpenRouter account.',
    freeTierStatus: 'OpenRouter credits and rate limits apply', badgeColor: 'cyan', requiresKey: 'openrouter' },
  { id: 'google/gemini-4-argon', provider: 'openrouter', name: 'OpenRouter: Gemini 4 Argon', tag: 'Latest Flagship',
    description: 'Current flagship reasoning model via OpenRouter.',
    freeTierStatus: 'OpenRouter credits and rate limits apply', badgeColor: 'purple', requiresKey: 'openrouter' },
  { id: 'google/gemini-3.5-flash-lite', provider: 'openrouter', name: 'OpenRouter: Gemini 3.5 Flash-Lite', tag: 'Efficient Fallback',
    description: 'Current Flash-Lite via OpenRouter.',
    freeTierStatus: 'OpenRouter credits and rate limits apply', badgeColor: 'emerald', requiresKey: 'openrouter' }
];

export const GEMINI_MODEL_IDS = AVAILABLE_MODELS.filter(m => m.provider === 'gemini').map(m => m.id);
export const OPENROUTER_MODEL_IDS = AVAILABLE_MODELS.filter(m => m.provider === 'openrouter').map(m => m.id);

// Migrate saved selections without passing old or task-incompatible IDs to providers.
export function resolveModelSelection(id?: string | null): string {
  if (id && AVAILABLE_MODELS.some(model => model.id === id)) return id;
  if (id === 'gemini-3.1-flash-lite') return GEMINI_FALLBACK_MODEL_ID;
  if (id === 'gemini-3.1-pro-preview') return 'gemini-4-argon';
  if (id?.includes('/')) return DEFAULT_OPENROUTER_MODEL_ID;
  return DEFAULT_MODEL_ID;
}
