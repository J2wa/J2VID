export interface GeminiModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  isDefault?: boolean;
  freeTierStatus: string;
  badgeColor: 'blue' | 'emerald' | 'purple' | 'amber';
}

export const AVAILABLE_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Recommended Default',
    description: 'High intelligence, balanced multimodal comprehension, and dense factual scene annotation.',
    isDefault: true,
    freeTierStatus: '15 RPM / Standard Quota',
    badgeColor: 'blue'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'High Rate Limit Fallback',
    description: 'Ultra-fast, lowest latency model with separate free-tier quota when standard Flash is exhausted.',
    freeTierStatus: 'Separate Quota / Fast Response',
    badgeColor: 'emerald'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    tag: 'Latest Production Alias',
    description: 'Points to the newest production Flash release with an independent endpoint pool.',
    freeTierStatus: 'Alternative Endpoint',
    badgeColor: 'purple'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    tag: 'Deep Reasoning',
    description: 'Advanced reasoning model for complex scene interactions and high-resolution tracking.',
    freeTierStatus: 'Pro Quota Tier',
    badgeColor: 'amber'
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';
