import React, { useState } from 'react';
import { SceneAnnotation } from '../types';
import { Image as ImageIcon, Layers, ShieldCheck, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

interface SnapshotViewerProps {
  scenes: SceneAnnotation[];
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  annotationResult: any;
}

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({
  scenes,
  activeSceneIndex,
  onSelectScene
}) => {
  const [copied, setCopied] = useState(false);
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  const handleCopy = () => {
    if (!currentScene?.narrative_description) return;
    navigator.clipboard.writeText(currentScene.narrative_description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentScene) {
    return (
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 text-xs">
        No scene snapshots available. Open the Scene Configurator to add scene entries and snapshots.
      </div>
    );
  }

  const handlePrev = () => {
    if (activeSceneIndex > 0) {
      onSelectScene(activeSceneIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeSceneIndex < scenes.length - 1) {
      onSelectScene(activeSceneIndex + 1);
    }
  };

  const snapshotUrl = currentScene.start_image || currentScene.snapshot_image;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Top Header Controls */}
      <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              Scene Frame Snapshot Inspector
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Scene #{currentScene.scene_id} of {scenes.length}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Verified Single Frame Scene Snapshot & Factual English Visual Description
            </p>
          </div>
        </div>
      </div>

      {/* Main Snapshot Display Area */}
      <div className="p-4 bg-zinc-950/60 min-h-[300px] flex items-center justify-center relative">
        <div className="w-full max-w-2xl">
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/40 bg-zinc-900 group shadow-2xl">
            {snapshotUrl ? (
              <img
                src={snapshotUrl}
                alt={`Scene #${currentScene.scene_id} snapshot`}
                className="w-full h-72 sm:h-80 object-cover"
              />
            ) : (
              <div className="w-full h-72 sm:h-80 bg-gradient-to-br from-zinc-900 via-indigo-950/30 to-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <ImageIcon className="w-12 h-12 text-indigo-400/60" />
                <span className="text-xs font-bold text-zinc-300">Scene #{currentScene.scene_id} Snapshot Frame</span>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  No image uploaded for this scene snapshot.
                </p>
              </div>
            )}

            {/* Frame Badge Overlay */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md border border-indigo-500/40 rounded-xl text-[10px] text-indigo-300 font-bold flex items-center gap-1.5 shadow-lg">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Scene #{currentScene.scene_id} Frame Snapshot
            </div>
          </div>
        </div>
      </div>

      {/* Scene Navigation Footer Bar */}
      <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={activeSceneIndex === 0}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Scene
        </button>

        {/* Scene Selection Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] py-1">
          {scenes.map((sc, idx) => (
            <button
              key={sc.scene_id}
              onClick={() => onSelectScene(idx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all shrink-0 ${
                idx === activeSceneIndex
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              #{sc.scene_id}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={activeSceneIndex === scenes.length - 1}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          Next Scene <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current Scene Description Card */}
      <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Dense Factual Visual Description
          </span>
          <div className="flex items-center gap-2">
            {currentScene.raw_description && (
              <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Translated to English & Verified
              </span>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-white bg-zinc-950 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/80 transition-all shrink-0"
              title="Copy visual narrative"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy Narrative</span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed font-sans bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
          {currentScene.narrative_description}
        </p>

        {currentScene.raw_description && (
          <div className="text-[11px] text-zinc-400 italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/50">
            <strong className="text-zinc-300 not-italic font-semibold">Original User Input Guidance:</strong> "{currentScene.raw_description}"
          </div>
        )}
      </div>
    </div>
  );
};
