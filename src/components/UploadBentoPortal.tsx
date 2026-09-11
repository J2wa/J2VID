import React from 'react';
import { Sparkles, Globe, ArrowRight, ShieldCheck, Image as ImageIcon, Play, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

interface UploadBentoPortalProps {
  onOpenConfigurator: () => void;
  onLaunchPreset: (presetIndex: number) => void;
  isAnalyzing: boolean;
}

export const UploadBentoPortal: React.FC<UploadBentoPortalProps> = ({
  onOpenConfigurator,
  onLaunchPreset,
  isAnalyzing
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Primary Hero Banner Card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            3-Stage Protocol: Snapshots • Generation • Revision
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Multimodal Visual Scene Annotator
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Upload scene frame snapshots and action guidance (in Tagalog or English). The AI translates Tagalog guidance to English and writes dense factual visual descriptions adhering strictly to video annotation guidelines.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenConfigurator}
              disabled={isAnalyzing}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/25 border border-indigo-400/30 transition-all flex items-center gap-2.5 text-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Stage 2: Running Generation...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-indigo-200" />
                  <span>Stage 1: Enter Snapshots & Guidance</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Test Presets Box */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-3 shrink-0 w-full sm:w-72 shadow-xl">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Test Instant Presets
          </span>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Try 1-click sample presets with Tagalog/English guidance notes.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => onLaunchPreset(0)}
              disabled={isAnalyzing}
              className="w-full text-left p-2.5 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl transition-all group/btn"
            >
              <div className="text-[11px] font-bold text-indigo-200 flex items-center justify-between">
                <span>Park & Bike Preset</span>
                <Play className="w-3 h-3 text-amber-400 fill-amber-400 group-hover/btn:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Tagalog Guidance • 2 Scenes</span>
            </button>

            <button
              onClick={() => onLaunchPreset(1)}
              disabled={isAnalyzing}
              className="w-full text-left p-2.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 rounded-xl transition-all group/btn"
            >
              <div className="text-[11px] font-bold text-zinc-200 flex items-center justify-between">
                <span>Plaza Performance</span>
                <Play className="w-3 h-3 text-indigo-400 fill-indigo-400 group-hover/btn:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Bilingual Guidance • 2 Scenes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Stage Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <ImageIcon className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
              STAGE 1
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Enter Snapshots & Guidance</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Upload starting and ending frame snapshots for each scene. Add textbox guidance describing actions in Tagalog or English.
          </p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded">
              STAGE 2
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">AI Multimodal Generation</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Multimodal pipeline translates Tagalog drafts and writes dense factual visual descriptions based strictly on image evidence.
          </p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
              STAGE 3
            </span>
          </div>
          <h4 className="text-xs font-bold text-white">Interactive Revision</h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Review generated descriptions and request targeted AI revisions or manual edits whenever needed.
          </p>
        </div>
      </div>
    </div>
  );
};
