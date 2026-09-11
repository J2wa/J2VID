import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight, Eye, ShieldCheck, Film, AlignLeft, Volume2, SearchCheck, CheckCheck } from 'lucide-react';
import { AgentWorkflowStep } from '../types';

interface WorkflowStepsVisualizerProps {
  steps: AgentWorkflowStep[];
  currentStepIndex: number;
  isAnalyzing: boolean;
}

export const WorkflowStepsVisualizer: React.FC<WorkflowStepsVisualizerProps> = ({
  steps,
  currentStepIndex,
  isAnalyzing
}) => {
  const getStepIcon = (index: number) => {
    switch (index) {
      case 0: return <Eye className="w-4 h-4" />;
      case 1: return <ShieldCheck className="w-4 h-4" />;
      case 2: return <Film className="w-4 h-4" />;
      case 3: return <SearchCheck className="w-4 h-4" />;
      case 4: return <AlignLeft className="w-4 h-4" />;
      case 5: return <Volume2 className="w-4 h-4" />;
      case 6: return <SearchCheck className="w-4 h-4" />;
      case 7: return <CheckCheck className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Agentic Workflow Execution Steps</h2>
            <p className="text-xs text-zinc-400">
              8-Step Autonomous Annotation & Review Pipeline
            </p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full animate-pulse font-mono">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Running Step #{currentStepIndex + 1}...
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex && isAnalyzing;
          const isDone = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isSkipped = step.status === 'skipped';

          return (
            <div
              key={step.step_number}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : isDone
                  ? 'bg-zinc-950/60 border-zinc-800/90'
                  : isFailed
                  ? 'bg-red-950/30 border-red-800/50'
                  : 'bg-zinc-950/30 border-zinc-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : isFailed
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isFailed ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      getStepIcon(idx)
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">Step {step.step_number}</span>
                      <h3 className={`text-sm font-semibold ${isCurrent ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {step.name}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {step.durationMs && (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                      {step.durationMs}ms
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      isDone
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isCurrent
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : isFailed
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                    }`}
                  >
                    {isDone ? 'Completed' : isCurrent ? 'Analyzing...' : isFailed ? 'Failed' : isSkipped ? 'Skipped' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Log Details if available */}
              {step.logDetails && step.logDetails.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-900/60 p-3 rounded-lg text-xs font-mono text-zinc-300 space-y-1">
                  {step.logDetails.map((log, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
