import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Award, AlertTriangle, FileText } from 'lucide-react';
import { SuitabilityResult } from '../types';

interface SuitabilityBadgeProps {
  suitability: SuitabilityResult | undefined;
  durationStr?: string;
}

export const SuitabilityBadge: React.FC<SuitabilityBadgeProps> = ({ suitability, durationStr }) => {
  if (!suitability) return null;

  const isSuitable = suitability.status === 'suitable';

  return (
    <div className={`p-4 rounded-2xl border shadow-xl transition-all ${
      isSuitable
        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
        : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isSuitable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {isSuitable ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isSuitable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {suitability.status}
              </span>

              {suitability.category && (
                <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-400" />
                  {suitability.category}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-zinc-100 mt-1">
              {isSuitable ? 'Video Eligible for Full Multimodal Annotation' : 'Video Discarded per Suitability Criteria'}
            </h3>
          </div>
        </div>

        {/* Confidence Score Bar */}
        <div className="flex items-center gap-3 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-400">Confidence:</span>
          <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isSuitable ? 'bg-emerald-400' : 'bg-rose-400'}`}
              style={{ width: `${Math.round(suitability.confidence * 100)}%` }}
            />
          </div>
          <span className="font-bold text-zinc-200">{(suitability.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Decision Reason */}
      <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
        <span className="font-semibold text-zinc-200 block mb-1">Assessment Justification:</span>
        <p className="text-zinc-300">{suitability.reason}</p>
      </div>
    </div>
  );
};
