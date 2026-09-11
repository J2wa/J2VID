import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { VideoAnnotationResult } from '../types';
import { validateAnnotationResult } from '../utils/validationUtils';

interface ValidationReportProps {
  annotationResult: VideoAnnotationResult | null;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({ annotationResult }) => {
  if (!annotationResult) return null;

  const errors = validateAnnotationResult(annotationResult);
  const criticalErrors = errors.filter((e) => e.type === 'error');
  const warnings = errors.filter((e) => e.type === 'warning');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Step 7 & 8 Automated Validation Report</h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {criticalErrors.length === 0 ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Rules Passed
            </span>
          ) : (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {criticalErrors.length} Schema Violations
            </span>
          )}
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All timestamps, sequential IDs, entity trajectories, background setting checks, and non-overlapping scene boundaries passed validation checks.</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {errors.map((err, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                err.type === 'error'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              {err.type === 'error' ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-mono text-[10px] uppercase font-bold opacity-80 block mb-0.5">
                  [{err.field}]
                </span>
                <span>{err.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
