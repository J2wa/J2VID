import React, { useState } from 'react';
import { Film, Edit3, Plus, Trash2, Search, RefreshCw, Send, Sparkles, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { SceneAnnotation } from '../types';

interface SceneListProps {
  scenes: SceneAnnotation[];
  currentTime: number;
  onJumpToTime: (seconds: number) => void;
  onEditScene: (scene: SceneAnnotation) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: number) => void;
  onReviseScene?: (sceneId: number, feedback: string) => Promise<void>;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  onEditScene,
  onAddScene,
  onDeleteScene,
  onReviseScene
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [revisionInputs, setRevisionInputs] = useState<{ [sceneId: number]: string }>({});
  const [revisingMap, setRevisingMap] = useState<{ [sceneId: number]: boolean }>({});
  const [copiedMap, setCopiedMap] = useState<{ [sceneId: number]: boolean }>({});

  const handleCopyNarrative = (text: string, sceneId: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [sceneId]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [sceneId]: false }));
    }, 2000);
  };

  const filteredScenes = scenes.filter((scene) =>
    scene.narrative_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scene.raw_description && scene.raw_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    `scene ${scene.scene_id}`.includes(searchTerm.toLowerCase())
  );

  const handleApplyRevision = async (sceneId: number) => {
    const feedback = revisionInputs[sceneId];
    if (!feedback || !feedback.trim() || !onReviseScene) return;

    setRevisingMap((prev) => ({ ...prev, [sceneId]: true }));
    try {
      await onReviseScene(sceneId, feedback.trim());
      setRevisionInputs((prev) => ({ ...prev, [sceneId]: '' }));
    } catch (err) {
      console.error('Revision error:', err);
    } finally {
      setRevisingMap((prev) => ({ ...prev, [sceneId]: false }));
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* List Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-100">Factual Visual Scene Descriptions</h2>
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
            {scenes.length} Scenes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search descriptions or guidance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-52"
            />
          </div>

          <button
            onClick={onAddScene}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-indigo-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Scene
          </button>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Stage 3 Protocol: Review descriptions below & submit revisions if needed.
        </span>
      </div>

      {/* Scenes Items Container */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {filteredScenes.length > 0 ? (
          filteredScenes.map((scene) => {
            const isRevising = revisingMap[scene.scene_id] || false;

            return (
              <div
                key={scene.scene_id}
                className="p-4 rounded-xl border bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
              >
                {/* Scene Card Top Bar */}
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                      #{scene.scene_id}
                    </span>
                    <span className="text-xs font-bold text-zinc-200">Scene #{scene.scene_id}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditScene(scene)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      title="Manual Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Manual Edit
                    </button>

                    <button
                      onClick={() => onDeleteScene(scene.scene_id)}
                      className="p-1.5 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Single Snapshot Preview */}
                {(scene.start_image || scene.snapshot_image) && (
                  <div className="my-1">
                    <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 aspect-video bg-zinc-900 max-w-xs">
                      <img
                        src={scene.start_image || scene.snapshot_image}
                        alt={`Scene #${scene.scene_id} snapshot`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[9px] text-indigo-300 font-bold rounded flex items-center gap-1 border border-indigo-500/30">
                        <ImageIcon className="w-2.5 h-2.5" /> Scene #{scene.scene_id} Snapshot
                      </span>
                    </div>
                  </div>
                )}

                {/* Raw Guidance Tagalog/English */}
                {scene.raw_description && (
                  <div className="text-[10px] text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-amber-400 font-bold">Input Guidance:</span> "{scene.raw_description}"
                  </div>
                )}

                {/* Generated Factual Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                      Generated Visual Narrative
                    </span>
                    <button
                      onClick={() => handleCopyNarrative(scene.narrative_description, scene.scene_id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/80 transition-all shrink-0"
                      title="Copy Visual Narrative"
                    >
                      {copiedMap[scene.scene_id] ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-indigo-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                    {scene.narrative_description}
                  </p>
                </div>

                {/* Stage 3: Revision Box */}
                <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    Stage 3: Request Revision or Refinement (Optional)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Specify that the jacket is dark navy blue and clarify the girl waved with her right hand"
                      value={revisionInputs[scene.scene_id] || ''}
                      onChange={(e) =>
                        setRevisionInputs((prev) => ({ ...prev, [scene.scene_id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyRevision(scene.scene_id);
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      onClick={() => handleApplyRevision(scene.scene_id)}
                      disabled={isRevising || !revisionInputs[scene.scene_id]?.trim()}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {isRevising ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Revising...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Revise</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
            No scene descriptions match your search.
          </div>
        )}
      </div>
    </div>
  );
};
