import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { SceneAnnotation } from '../types';

export function SceneDescriptionDialog({ scene, isProcessing, onClose }: {
  scene: SceneAnnotation; isProcessing: boolean; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scene.narrative_description);
      setCopyStatus('Copied');
    } catch { setCopyStatus('Copy unavailable. Select the description below and copy it manually.'); }
  };
  return <dialog ref={dialog} className="aces-scene-dialog" aria-labelledby="scene-dialog-title" onCancel={onClose} onClick={event => { if(event.target === event.currentTarget) onClose(); }}>
    <div className="aces-scene-dialog-content">
      <div className="flex justify-between items-center gap-4"><div><p className="aces-eyebrow">DESCRIPTION READY</p><h2 id="scene-dialog-title" className="text-2xl font-bold mt-2">Scene {scene.scene_id}</h2></div><button autoFocus aria-label="Close scene description" onClick={onClose}><X/></button></div>
      {(scene.start_image || scene.snapshot_image) && <img className="aces-dialog-snapshot" src={scene.start_image || scene.snapshot_image} alt={`Snapshot for scene ${scene.scene_id}`}/>}
      <p className="aces-scene-description">{scene.narrative_description}</p>
      <div className="flex justify-between items-center flex-wrap gap-4"><p className="text-sm">{isProcessing ? 'Later batches are still processing. You can use this description now.' : 'Generation has stopped. This description remains available.'}</p><button className="aces-primary" onClick={copy}>{copyStatus === 'Copied' ? <Check size={16}/> : <Copy size={16}/>} {copyStatus === 'Copied' ? 'Copied' : 'Copy description'}</button></div>
      <p role="status" className="text-sm">{copyStatus}</p>
    </div>
  </dialog>;
}
