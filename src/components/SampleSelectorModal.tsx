import React from 'react';
import { X, Layers, Upload, Film, Award, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { SampleVideo } from '../types';
import { SAMPLE_VIDEOS } from '../data/sampleVideos';

interface SampleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleVideo) => void;
  onFileUpload: (file: File) => void;
  selectedSampleId?: string;
}

export const SampleSelectorModal: React.FC<SampleSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  onFileUpload,
  selectedSampleId
}) => {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Video Benchmark Suite & Upload</h2>
              <p className="text-xs text-zinc-400">
                Select a pre-analyzed benchmark sample or upload a custom video file for live annotation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Upload Area */}
        <div className="mb-6 p-4 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-950/20 hover:border-indigo-500/60 transition-all text-center group cursor-pointer relative">
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-300 block">
                Upload Local Video File (MP4, WebM, MOV)
              </span>
              <span className="text-[11px] text-zinc-400">
                Process custom video with Gemini Multimodal Video Agent
              </span>
            </div>
          </div>
        </div>

        {/* Sample List Grid */}
        <div className="overflow-y-auto space-y-3 pr-1">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Standard Agent Evaluation Benchmark Samples
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SAMPLE_VIDEOS.map((sample) => {
              const isSelected = sample.id === selectedSampleId;

              return (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          sample.isSuitable
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {sample.isSuitable ? sample.categoryName : 'Discarded Case'}
                      </span>

                      <span className="text-[10px] font-mono text-zinc-500">
                        {sample.durationStr}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-indigo-400 shrink-0" />
                      {sample.title}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                    <span className="text-indigo-400 font-medium text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {sample.precomputedResult.scenes.length} Scenes / {sample.precomputedResult.subtitles.length} Subtitles
                    </span>

                    {isSelected && (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
