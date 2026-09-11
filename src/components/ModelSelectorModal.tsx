import React from 'react';
import { Sparkles, Check, Zap, AlertCircle, X, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { AVAILABLE_MODELS, GeminiModelOption } from '../data/models';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  autoFallback: boolean;
  onToggleAutoFallback: (enabled: boolean) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  autoFallback,
  onToggleAutoFallback
}) => {
  if (!isOpen) return null;

  const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#121215] border border-[#27272a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Select Gemini AI Model
              </h2>
              <p className="text-xs text-zinc-400">
                Switch models if free tier request quotas or rate limits are reached
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Quota Tip Notice */}
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-200/90">
            <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-blue-300">Free Tier Quota Tip:</span>
              <p className="text-blue-200/80 leading-relaxed text-[11px]">
                Google Gemini assigns separate rate-limit buckets to different models. If you encounter a <span className="font-mono bg-blue-900/50 px-1 py-0.5 rounded text-blue-300">429 (Resource Exhausted)</span> error on one model, switching to <strong>Gemini 3.1 Flash Lite</strong> provides a fresh, separate quota pool.
              </p>
            </div>
          </div>

          {/* Model List */}
          <div className="space-y-2.5">
            {AVAILABLE_MODELS.map((model: GeminiModelOption) => {
              const isSelected = model.id === selectedModel;
              const badgeColors = {
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              };

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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeColors[model.badgeColor]}`}>
                        {model.tag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {model.description}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-500 font-mono">
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
                  If current model hits 429 / quota limit, automatically failover to Flash Lite without failing your run.
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
        <div className="p-4 border-t border-[#27272a] bg-[#18181b]/50 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
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
