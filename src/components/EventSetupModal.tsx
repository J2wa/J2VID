import { ProcessingScreen } from './ProcessingScreen';
import { SubtitleProviderSelector } from './SubtitleProviderSelector';
import React, { useState, useEffect } from 'react';
import { X, MapPin, Sparkles, Plus, Trash2, Upload, Image as ImageIcon, Globe, Play, ArrowUpDown, Layers, CheckCircle2, Music } from 'lucide-react';
import { SceneInput, SubtitleProvider } from '../types';

interface EventSetupModalProps {
  subtitleProvider: SubtitleProvider;
  onSubtitleProviderChange: (value: SubtitleProvider) => void;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    scenes: SceneInput[];
    globalBackground?: string;
    audioFile?: File;
    audioFileName?: string;
  }) => void;
  initialScenes?: SceneInput[];
}

// Helper: Resize and compress image to optimized data URL for fast API transmission
export function resizeImageToDataUrl(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => reject(new Error('Unable to decode image.'));
      img.src = e.target?.result as string || '';
    };
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

// Helper: Parse frame count/number from filename (e.g., 'frame_001.jpg' -> 1, 'scene_05.png' -> 5)
export function parseFrameNumberFromFilename(filename: string): number {
  const matches = filename.match(/\d+/g);
  if (matches && matches.length > 0) {
    return parseInt(matches[matches.length - 1], 10);
  }
  return Infinity;
}

// Sample Tagalog / English Presets
const SAMPLE_PRESETS: { label: string; description: string; scenes: SceneInput[] }[] = [
  {
    label: 'Park & Bicycle Scene (Tagalog Guidance)',
    description: '2 scenes with Tagalog guidance notes and single scene snapshot frames.',
    scenes: [
      {
        id: 'preset-1-scene-1',
        scene_id: 1,
        raw_description: 'May dalawang tao sa parke. Ang lalaki na naka-asul na jacket ay nakatayo sa tabi ng bisikleta habang humahawak ng kape. Pagkatapos ay sumakay siya sa bisikleta at dahan-dahang pumadyak.',
        initial_background: 'Isang bukas na parke na may berdeng puno, sementadong daanan, at kahoy na upuan sa likod.'
      },
      {
        id: 'preset-1-scene-2',
        scene_id: 2,
        raw_description: 'Ang lalaki sa bisikleta ay pumadyak palabas sa gilid ng parke habang ang babae na naka-dilaw na damit ay kumakaway sa kanya.',
        initial_background: 'Sementadong daanan sa parke na may mga puno at ilaw sa kalsada.'
      }
    ]
  },
  {
    label: 'Street Performance & Crowd (Bilingual Guidance)',
    description: '2 scenes detailing character movements, musical instruments, and crowd reactions.',
    scenes: [
      {
        id: 'preset-2-scene-1',
        scene_id: 1,
        raw_description: 'A guitarist in a black jacket plays an acoustic guitar under a stone archway while people gather around.',
        initial_background: 'Cobblestone plaza with historic brick buildings and street lamps.'
      },
      {
        id: 'preset-2-scene-2',
        scene_id: 2,
        raw_description: 'Isang lalaki na may hawak na tamborin ang lumapit at sumabay sa pagtugtog habang ang mga tao ay pumapalakpak.',
        initial_background: 'Cobblestone plaza with spectator crowd gathered in a semi-circle.'
      }
    ]
  }
];

export const EventSetupModal: React.FC<EventSetupModalProps> = ({
  subtitleProvider,
  onSubtitleProviderChange,
  isOpen,
  onClose,
  onSubmit,
  initialScenes
}) => {
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareStep, setPrepareStep] = useState('');
  const [scenes, setScenes] = useState<SceneInput[]>([]);
  const [globalBackground, setGlobalBackground] = useState<string>('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);

  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    setAudioFileName(file.name);
  };

  useEffect(() => {
    if (initialScenes && initialScenes.length > 0) {
      setScenes(initialScenes);
    } else if (scenes.length === 0) {
      setScenes([
        {
          id: 'scene-init-1',
          scene_id: 1,
          raw_description: '',
          initial_background: ''
        }
      ]);
    }
  }, [initialScenes, isOpen]);

  if (!isOpen) return null;

  const handleAddScene = () => {
    const nextId = scenes.length + 1;
    setScenes([
      ...scenes,
      {
        id: `scene-custom-${Date.now()}-${nextId}`,
        scene_id: nextId,
        raw_description: '',
        initial_background: ''
      }
    ]);
  };

  const handleRemoveScene = (id: string) => {
    if (scenes.length <= 1) return;
    const updated = scenes
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, scene_id: idx + 1 }));
    setScenes(updated);
  };

  const handleUpdateScene = (id: string, fields: Partial<SceneInput>) => {
    setScenes(scenes.map((s) => (s.id === id ? { ...s, ...fields } : s)));
  };

  const handleSingleImageFile = async (id: string, file: File) => {
    try {
      const resized = await resizeImageToDataUrl(file, 1024);
      handleUpdateScene(id, { start_image: resized, snapshot_image: resized });
    } catch (err) {
      console.error('Error resizing single image:', err);
    }
  };

  // Mass / Bulk Upload Images with Auto-Sorting from Lower Frame Count to Higher Frame Count
  const handleMassImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Sort files based on lower frame count to higher frame count
    fileArray.sort((a, b) => {
      const frameA = parseFrameNumberFromFilename(a.name);
      const frameB = parseFrameNumberFromFilename(b.name);

      if (frameA !== frameB) {
        return frameA - frameB;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    setIsPreparing(true);
    try {
      const loaded: {file: File; dataUrl: string; frameNum: number}[] = [];
      for (let offset = 0; offset < fileArray.length; offset += 5) {
        setPrepareStep(`Preparing images ${offset + 1}–${Math.min(offset + 5, fileArray.length)} of ${fileArray.length}`);
        const batch = await Promise.all(fileArray.slice(offset, offset + 5).map(async file => ({
          file, dataUrl: await resizeImageToDataUrl(file, 1024), frameNum: parseFrameNumberFromFilename(file.name)
        })));
        loaded.push(...batch);
      }
      // Create new scenes sorted from lower frame count to higher count
      const newScenes: SceneInput[] = loaded.map((item, idx) => {
        const displayFrameText = item.frameNum !== Infinity ? `Frame #${item.frameNum}` : item.file.name;
        return {
          id: `mass-scene-${Date.now()}-${idx + 1}`,
          scene_id: idx + 1,
          start_image: item.dataUrl,
          raw_description: '',
          initial_background: '',
          frame_count: item.frameNum !== Infinity ? item.frameNum : undefined
        };
      });

      setScenes(newScenes);
      setUploadNotice(
        `Successfully arranged ${loaded.length} images into scenes ordered from lower frame count to higher frame count.`
      );

      setTimeout(() => setUploadNotice(null), 6000);
    } catch (err) {
      setUploadNotice('Could not prepare images. Please try again.');
    } finally { setIsPreparing(false); }
  };

  const handleLoadPreset = (presetIdx: number) => {
    const preset = SAMPLE_PRESETS[presetIdx];
    if (preset) {
      setScenes(preset.scenes);
      if (preset.scenes[0]?.initial_background) {
        setGlobalBackground(preset.scenes[0].initial_background);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scenes: scenes.map((sc, idx) => ({ ...sc, scene_id: idx + 1 })),
      globalBackground: globalBackground.trim(),
      audioFile,
      audioFileName
    });
    onClose();
  };

  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="aces-upload-dialog rounded-3xl shadow-2xl bg-zinc-900 border border-zinc-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-8">
      <div className="relative flex justify-center text-center items-center gap-4 mb-6 pr-10 pl-10"><h2 id="upload-title" className="text-2xl font-bold">Upload scene snapshots</h2><button className="absolute right-0 aces-nav-button" aria-label="Close uploads" disabled={isPreparing} onClick={onClose}><X/></button></div>
      {isPreparing ? <ProcessingScreen step={prepareStep} scenes={scenes}/> : <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block text-sm font-semibold">Background or location <span className="font-normal">(optional)</span><input autoFocus value={globalBackground} onChange={e => setGlobalBackground(e.target.value)} placeholder="Where does the video take place?" className="mt-2 w-full border border-zinc-700 p-3"/></label>
        <label className="block rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-6 text-center text-sm font-semibold">Choose snapshots<input type="file" accept="image/*" multiple onChange={e => handleMassImageUpload(e.target.files)} className="block mx-auto mt-4 max-w-full"/></label>
        <p className="text-sm">{scenes.filter(scene => scene.start_image || scene.snapshot_image || scene.raw_description.trim()).length} scenes ready. We prepare and send up to 5 snapshots at a time, then automatically continue with the next batch.</p>
        {uploadNotice && <p role="status" className="text-sm">{uploadNotice}</p>}
        <details><summary className="cursor-pointer text-sm font-semibold">Review scenes & add optional guidance</summary><div className="space-y-4 mt-4">{scenes.map((scene,index) => <div key={scene.id} className="border border-zinc-700 p-4 space-y-3">
          <div className="flex justify-between"><strong>Scene {index + 1}</strong><button type="button" onClick={() => handleRemoveScene(scene.id)} disabled={scenes.length <= 1}>Remove</button></div>
          {scene.start_image && <img src={scene.start_image} alt={`Scene ${index + 1} snapshot`} className="h-24 object-contain mx-auto"/>}
          <label className="block text-sm">Snapshot<input className="block mt-2 max-w-full" type="file" accept="image/*" onChange={e => { if(e.target.files?.[0]) handleSingleImageFile(scene.id,e.target.files[0]); }}/></label>
          <label className="block text-sm">Scene background<input className="block w-full border border-zinc-700 p-2 mt-2" value={scene.initial_background || ''} onChange={e => handleUpdateScene(scene.id,{initial_background:e.target.value})}/></label>
          <label className="block text-sm">Guidance (Tagalog or English)<textarea className="block w-full border border-zinc-700 p-2 mt-2" rows={2} value={scene.raw_description} onChange={e => handleUpdateScene(scene.id,{raw_description:e.target.value})}/></label>
        </div>)}<button className="aces-nav-button" type="button" onClick={handleAddScene}>+ Add scene</button></div></details>
        <details><summary className="cursor-pointer text-sm font-semibold">Include audio for subtitles (optional)</summary><div className="mt-4 space-y-3"><SubtitleProviderSelector value={subtitleProvider} onChange={onSubtitleProviderChange}/><input aria-label="Audio for subtitles" type="file" accept="audio/*" onChange={e => {if(e.target.files?.[0])handleAudioUpload(e.target.files[0]);}}/>{audioFileName && <p>{audioFileName}</p>}</div></details>
        <div className="flex justify-center gap-4 border-t border-zinc-700 pt-5"><button className="aces-secondary" type="button" onClick={onClose}>Cancel</button><button className="aces-primary" type="submit" disabled={!scenes.length || scenes.some(scene => !scene.start_image && !scene.snapshot_image && !scene.raw_description.trim())}>Generate descriptions</button></div>
      </form>}
    </section>
  </div>;
};

