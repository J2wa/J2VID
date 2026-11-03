import { Check, Film, Loader2, Sparkles } from 'lucide-react';
import type { SceneInput, SceneAnnotation } from '../types';
import type { SceneBatchProgress } from '../utils/sceneBatches';

interface ProcessingScreenProps {
  readyScenes?: SceneAnnotation[];
  onOpenScene?: (scene: SceneAnnotation) => void;
  step: string;
  scenes?: SceneInput[];
  progress?: SceneBatchProgress | null;
}

export function ProcessingScreen({ step, scenes = [], progress = null, readyScenes = [], onOpenScene }: ProcessingScreenProps) {
  const completed = progress?.completed ?? 0;
  return <section className="aces-loading">
    <div className="aces-processing-emblem"><Sparkles size={30} aria-hidden="true"/><span /></div>
    <div className="space-y-3">
      <p className="aces-eyebrow">{scenes.length ? 'YOUR SCENES, TAKING SHAPE' : 'ACES VIDEO'}</p>
      <h2>{scenes.length ? 'Bringing every scene into focus' : 'Processing your upload'}</h2>
      <p role="status" aria-live="polite" className="aces-processing-status"><Loader2 size={16} className="animate-spin" aria-hidden="true"/>{step}</p>
    </div>
    {scenes.length > 0 && <>
      <div className="aces-progress-summary">
        <div><span>Scene descriptions</span><strong>{completed} / {scenes.length} ready</strong></div>
        <progress max={scenes.length} value={completed} aria-label="Completed scene descriptions" />
      </div>
      <div className="aces-processing-grid" aria-label="Scene processing previews">
        {scenes.map((scene, index) => {
          const done = index < completed;
          const active = !!progress && index >= progress.activeStart && index < progress.activeEnd;
          const readyScene = readyScenes.find(result => result.scene_id === scene.scene_id);
          const image = scene.start_image || scene.snapshot_image;
          return <figure key={scene.id} className={`aces-scene-preview ${active ? 'is-processing' : ''} ${done ? 'is-complete' : ''}`}>
            <button type="button" className="aces-scene-open" disabled={!readyScene || !onOpenScene} onClick={() => readyScene && onOpenScene?.(readyScene)} aria-label={readyScene ? `Open description for scene ${scene.scene_id}` : `Scene ${scene.scene_id}: ${active ? 'processing' : 'queued'}`} >
            <div className="aces-scene-image">
              {image ? <img src={image} alt={`Snapshot for scene ${scene.scene_id}`} /> : <Film size={36} aria-hidden="true"/>}
              {active && <div className="aces-scene-scan" aria-hidden="true"/>}
              <span className="aces-scene-number">{String(scene.scene_id).padStart(2, '0')}</span>
            </div>
            <div className="aces-scene-caption"><strong>Scene {scene.scene_id}</strong><span>{done ? <Check size={14}/> : active ? <Loader2 size={14} className="animate-spin"/> : <Film size={14}/>} {done ? 'Ready' : active ? 'Processing' : 'Queued'}</span></div>
            </button>
          </figure>;
        })}
      </div>
    </>}
    <small>{readyScenes.length > 0 && 'Click any ready scene to read and copy its description while processing continues. '}{scenes.length ? 'Your snapshots stay visible while we work. ' : ''}Please keep this tab open.</small>
  </section>;
}
