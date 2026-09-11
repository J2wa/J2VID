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

export const AVAILABLE_MODELS: ModelOption[] = [
  // Google Gemini Direct Models
  {
    id: 'gemini-3.8-flash',
    provider: 'gemini',
    name: 'Gemini 3.8 Flash',
    tag: 'Recommended Default',
    description: 'High intelligence, balanced multimodal comprehension, and dense factual scene annotation.',
    isDefault: true,
    freeTierStatus: '15 RPM / Standard Google Quota',
    badgeColor: 'blue',
    requiresKey: 'gemini'
  },
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'gemini',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'High Rate Limit Fallback',
    description: 'Ultra-fast, lowest latency model with separate free-tier quota when standard Flash is exhausted.',
    freeTierStatus: 'Separate Google Quota Bucket',
    badgeColor: 'emerald',
    requiresKey: 'gemini'
  },
  {
    id: 'gemini-flash-latest',
    provider: 'gemini',
    name: 'Gemini Flash Latest',
    tag: 'Latest Production Alias',
    description: 'Points to the newest production Flash release with an independent endpoint pool.',
    freeTierStatus: 'Alternative Endpoint',
    badgeColor: 'purple',
    requiresKey: 'gemini'
  },
  {
    id: 'gemini-3.1-pro-preview',
    provider: 'gemini',
    name: 'Gemini 3.1 Pro Preview',
    tag: 'Deep Reasoning',
    description: 'Advanced reasoning model for complex scene interactions and high-resolution tracking.',
    freeTierStatus: 'Pro Google Quota Tier',
    badgeColor: 'amber',
    requiresKey: 'gemini'
  },

  // OpenRouter Models
  {
    id: 'google/gemini-2.5-flash:free',
    provider: 'openrouter',
    name: 'OpenRouter: Gemini 2.5 Flash Free',
    tag: 'Free Tier OpenRouter',
    description: 'Direct access to Gemini 2.5 Flash through OpenRouter free community tier endpoints.',
    freeTierStatus: 'Free (OpenRouter Quota)',
    badgeColor: 'cyan',
    requiresKey: 'openrouter'
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    provider: 'openrouter',
    name: 'OpenRouter: Llama 3.2 11B Vision Free',
    tag: 'Open Source Vision',
    description: 'Meta multimodal open weights model hosted free on OpenRouter for image & frame understanding.',
    freeTierStatus: 'Free (OpenRouter Quota)',
    badgeColor: 'purple',
    requiresKey: 'openrouter'
  },
  {
    id: 'qwen/qwen-2.5-vl-72b-instruct:free',
    provider: 'openrouter',
    name: 'OpenRouter: Qwen 2.5 VL 72B Free',
    tag: 'High Precision Vision',
    description: 'Alibaba 72B vision-language model with exceptional visual spatial comprehension.',
    freeTierStatus: 'Free (OpenRouter Quota)',
    badgeColor: 'emerald',
    requiresKey: 'openrouter'
  },
  {
    id: 'google/gemini-2.5-flash',
    provider: 'openrouter',
    name: 'OpenRouter: Gemini 2.5 Flash (Paid Tier)',
    tag: 'Pay-As-You-Go Quota',
    description: 'Uncapped rate limits via your OpenRouter account balance when all free quotas are exhausted.',
    freeTierStatus: 'Pay-As-You-Go / Uncapped',
    badgeColor: 'blue',
    requiresKey: 'openrouter'
  },
  {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    name: 'OpenRouter: OpenAI GPT-4o Mini',
    tag: 'OpenAI Vision',
    description: 'Fast, cost-effective multimodal model from OpenAI through OpenRouter unified API.',
    freeTierStatus: 'Pay-As-You-Go / $0.15/M',
    badgeColor: 'rose',
    requiresKey: 'openrouter'
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';
