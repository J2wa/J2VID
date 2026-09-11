import React, { useState } from 'react';
import { Sparkles, Check, Zap, X, ArrowRightLeft, Key, ExternalLink, Globe, Cpu } from 'lucide-react';
import { AVAILABLE_MODELS, ModelOption, ModelProvider } from '../data/models';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  autoFallback: boolean;
  onToggleAutoFallback: (enabled: boolean) => void;
  hasGeminiKey?: boolean;
  hasOpenRouterKey?: boolean;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  autoFallback,
  onToggleAutoFallback,
  hasGeminiKey = true,
  hasOpenRouterKey = false
}) => {
  const [providerFilter, setProviderFilter] = useState<'all' | ModelProvider>('all');
  const [showKeyGuide, setShowKeyGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const filteredModels = AVAILABLE_MODELS.filter((m) => {
    if (providerFilter === 'all') return true;
    return m.provider === providerFilter;
  });

  const badgeColors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Select AI Model &amp; Provider
              </h2>
              <p className="text-xs text-zinc-400">
                Google Gemini + OpenRouter support for unlimited rate-limit protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Key Status Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-[#27272a] bg-[#141417] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#1c1c21] p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setProviderFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                providerFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Models ({AVAILABLE_MODELS.length})
            </button>
            <button
              onClick={() => setProviderFilter('gemini')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                providerFilter === 'gemini'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-blue-300" />
              Google Gemini
            </button>
            <button
              onClick={() => setProviderFilter('openrouter')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                providerFilter === 'openrouter'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-300" />
              OpenRouter
            </button>
          </div>

          <button
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>API Keys Guide</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Key Setup Instructions Accordion */}
          {showKeyGuide && (
            <div className="bg-[#18181f] border border-amber-500/30 rounded-2xl p-4 space-y-3 text-xs text-zinc-300 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  How to Configure Your OpenRouter API Key
                </span>
                <span className="text-[10px] text-zinc-400">Environment Variables</span>
              </div>
              <p className="text-zinc-300/90 leading-relaxed text-[11px]">
                To route requests through OpenRouter (for free community models like Llama 3.2, Qwen 2.5, or paid models with no Google rate limits), add your key to your environment variables:
              </p>
              <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Variable Name:</span>
                  <span className="text-cyan-300 font-bold">OPENROUTER_API_KEY</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Example Value:</span>
                  <span className="text-zinc-400">sk-or-v1-xxxxxxxxxxxx</span>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-zinc-400">
                <p className="font-semibold text-zinc-200">Where to set it:</p>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                  <li><strong>AI Studio Build:</strong> Settings &gt; Secrets &gt; Add <code className="text-amber-300">OPENROUTER_API_KEY</code></li>
                  <li><strong>Vercel:</strong> Project Settings &gt; Environment Variables &gt; Add <code className="text-amber-300">OPENROUTER_API_KEY</code> &gt; Redeploy</li>
                  <li><strong>Local Dev:</strong> Add <code className="text-amber-300">OPENROUTER_API_KEY=your_key</code> in your <code className="text-zinc-300">.env</code> file</li>
                </ul>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold underline"
                >
                  Get an OpenRouter API key here
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quota Tip Notice */}
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-200/90">
            <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-blue-300">Free Tier Quota Strategy:</span>
              <p className="text-blue-200/80 leading-relaxed text-[11px]">
                If your Google Gemini free tier hits a <span className="font-mono bg-blue-900/50 px-1 py-0.5 rounded text-blue-300">429 (Resource Exhausted)</span> rate limit, switch to <strong>Gemini 3.1 Flash Lite</strong> for a separate Google bucket, or choose an <strong>OpenRouter Free Tier</strong> model to bypass Gemini limits entirely!
              </p>
            </div>
          </div>

          {/* Model Cards */}
          <div className="space-y-2.5">
            {filteredModels.map((model: ModelOption) => {
              const isSelected = model.id === selectedModel;
              const colorClass = badgeColors[model.badgeColor] || badgeColors.blue;

              return (
                <div
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/30'
                      : 'bg-[#18181b]/60 border-[#27272a] hover:bg-[#1f1f23] hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-zinc-100">{model.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                        {model.tag}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase font-mono">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-500 font-mono flex-wrap">
                      <span>Quota: {model.freeTierStatus}</span>
                      <span>•</span>
                      <span>ID: {model.id}</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-Fallback Setting */}
          <div className="bg-[#18181b]/80 border border-[#27272a] rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-zinc-200">
                  Automatic Quota Fallback
                </div>
                <p className="text-[11px] text-zinc-400">
                  If the current model hits a 429 quota exhaustion, automatically failover to Flash Lite or OpenRouter without stopping your run.
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggleAutoFallback(!autoFallback)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                autoFallback ? 'bg-emerald-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoFallback ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#18181b]/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-400 truncate max-w-[280px]">
            Active: <span className="font-semibold text-zinc-200">{currentModelObj.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
          >
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
};
