import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SceneAnnotation } from '../types';

export function SceneDescriptionDialog({ scene, scenes, onSelectScene, isProcessing, onClose }: {
  scene: SceneAnnotation; scenes: SceneAnnotation[]; onSelectScene: (scene: SceneAnnotation) => void; isProcessing: boolean; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyResult, setCopyResult] = useState({ sceneId: 0, message: '' });
  const copyStatus = copyResult.sceneId === scene.scene_id ? copyResult.message : '';
  const index = scenes.findIndex(item => item.scene_id === scene.scene_id);
  const previous = index > 0 ? scenes[index - 1] : undefined;
  const next = index >= 0 ? scenes[index + 1] : undefined;
  const navigate = (target: SceneAnnotation) => {
    setCopyResult({ sceneId: target.scene_id, message: '' });
    onSelectScene(target);
    dialog.current?.scrollTo({ top: 0 });
  };
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scene.narrative_description);
      setCopyResult({ sceneId: scene.scene_id, message: 'Copied' });
    } catch { setCopyResult({ sceneId: scene.scene_id, message: 'Copy unavailable. Select the description below and copy it manually.' }); }
  };
  return <dialog ref={dialog} className="aces-scene-dialog" aria-labelledby="scene-dialog-title" onCancel={onClose} onClick={event => { if(event.target === event.currentTarget) onClose(); }}>
    <div className="aces-scene-dialog-content">
      <div className="flex justify-between items-center gap-4"><div><p className="aces-eyebrow">DESCRIPTION READY</p><h2 id="scene-dialog-title" className="text-2xl font-bold mt-2">Scene {scene.scene_id}</h2></div><button autoFocus aria-label="Close scene description" onClick={onClose}><X/></button></div>
      {(scene.start_image || scene.snapshot_image) && <img className="aces-dialog-snapshot" src={scene.start_image || scene.snapshot_image} alt={`Snapshot for scene ${scene.scene_id}`}/>}
      <p className="aces-scene-description">{scene.narrative_description}</p>
      <div className="flex justify-between items-center flex-wrap gap-4"><p className="text-sm">{isProcessing ? 'Later batches are still processing. You can use this description now.' : 'Generation has stopped. This description remains available.'}</p><button className="aces-primary" onClick={copy}>{copyStatus === 'Copied' ? <Check size={16}/> : <Copy size={16}/>} {copyStatus === 'Copied' ? 'Copied' : 'Copy description'}</button></div>
      <p role="status" className="text-sm">{copyStatus}</p>
      <nav aria-label="Scene descriptions" className="flex items-center justify-between flex-wrap gap-3 border-t border-zinc-700 pt-4">
        <button type="button" className="aces-nav-button inline-flex items-center gap-2 disabled:cursor-not-allowed" disabled={!previous} onClick={() => previous && navigate(previous)}><ChevronLeft size={16} aria-hidden="true"/>Previous</button>
        <span role="status" aria-live="polite" className="text-sm">{index + 1} of {scenes.length} available</span>
        <button type="button" className="aces-nav-button inline-flex items-center gap-2 disabled:cursor-not-allowed" disabled={!next} onClick={() => next && navigate(next)}>Next<ChevronRight size={16} aria-hidden="true"/></button>
      </nav>
      {!next && isProcessing && <p className="text-sm text-zinc-400">Next becomes available when more descriptions are ready.</p>}
    </div>
  </dialog>;
}
