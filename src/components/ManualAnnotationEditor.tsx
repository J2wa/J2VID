import React, { useState, useEffect } from 'react';
import { X, Check, Film } from 'lucide-react';
import { SceneAnnotation } from '../types';

interface ManualAnnotationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialScene?: SceneAnnotation | null;
  currentVideoTime: number;
  onSaveScene: (scene: SceneAnnotation) => void;
}

export const ManualAnnotationEditor: React.FC<ManualAnnotationEditorProps> = ({
  isOpen,
  onClose,
  initialScene,
  onSaveScene
}) => {
  const [sceneId, setSceneId] = useState(1);
  const [narrative, setNarrative] = useState('');

  useEffect(() => {
    if (initialScene) {
      setSceneId(initialScene.scene_id);
      setNarrative(initialScene.narrative_description);
    } else {
      setSceneId(1);
      setNarrative('');
    }
  }, [initialScene, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveScene({
      ...(initialScene || {}),
      scene_id: Number(sceneId),
      narrative_description: narrative
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden relative">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">
              {initialScene ? `Edit Scene #${initialScene.scene_id} Description` : 'Add New Scene Description'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
          {/* Text Content */}
          <div>
            <label className="block text-zinc-300 font-bold mb-1.5">
              Scene Factual Visual Narrative Description
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={5}
              required
              placeholder="Describe background setting, subjects, movements, postures, and chronological actions..."
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Description
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
