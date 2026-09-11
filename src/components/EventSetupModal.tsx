import React, { useState, useEffect } from 'react';
import { X, MapPin, Sparkles, Plus, Trash2, Upload, Image as ImageIcon, Globe, Play, ArrowUpDown, Layers, CheckCircle2, Music } from 'lucide-react';
import { SceneInput } from '../types';

interface EventSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    scenes: SceneInput[];
    globalBackground?: string;
    audioData?: string;
    audioFileName?: string;
  }) => void;
  initialScenes?: SceneInput[];
}

// Helper: Resize and compress image to optimized data URL for fast API transmission
export function resizeImageToDataUrl(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve) => {
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
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string || '';
    };
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
  isOpen,
  onClose,
  onSubmit,
  initialScenes
}) => {
  const [scenes, setScenes] = useState<SceneInput[]>([]);
  const [globalBackground, setGlobalBackground] = useState<string>('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);

  const handleAudioUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAudioData(e.target.result as string);
        setAudioFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
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

    // Read and compress files concurrently
    const readPromises = fileArray.map((file) => {
      return new Promise<{ file: File; dataUrl: string; frameNum: number }>(async (resolve) => {
        try {
          const resized = await resizeImageToDataUrl(file, 1024);
          resolve({
            file,
            dataUrl: resized,
            frameNum: parseFrameNumberFromFilename(file.name)
          });
        } catch {
          resolve({
            file,
            dataUrl: '',
            frameNum: parseFrameNumberFromFilename(file.name)
          });
        }
      });
    });

    try {
      const loaded = await Promise.all(readPromises);

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
      console.error('Error during mass image upload:', err);
    }
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
      audioData,
      audioFileName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  STAGE 1: SNAPSHOTS & GUIDANCE
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                Configure Scenes, Snapshots & Guidance
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Mass Upload Banner Section */}
          <div className="bg-gradient-to-r from-indigo-950/70 via-zinc-900 to-indigo-950/70 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-200 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-indigo-400" />
                  Mass Upload Images & Auto-Arrange by Frame Count
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Select multiple frame snapshot images at once. The system automatically sorts them from lower frame count to higher frame count (e.g. <span className="font-mono text-indigo-300">frame_001.jpg</span> → <span className="font-mono text-indigo-300">frame_010.jpg</span>) and assigns 1 snapshot per scene.
                </p>
              </div>

              <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-2 text-xs shrink-0 self-start sm:self-center">
                <Upload className="w-4 h-4" />
                <span>Mass Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleMassImageUpload(e.target.files)}
                />
              </label>
            </div>

            {uploadNotice && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-[11px] font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}
          </div>

          {/* Preset Quick Load Bar */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Quick Test Presets
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Load pre-filled Tagalog or English guidance notes to test Gemini translation & guidelines compliance.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadPreset(idx)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-all"
                >
                  {p.label.split(' ')[0]} Preset
                </button>
              ))}
            </div>
          </div>

          {/* Global Background Setting (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> Global Scene Background & Context (Optional)
            </label>
            <input
              type="text"
              value={globalBackground}
              onChange={(e) => setGlobalBackground(e.target.value)}
              placeholder="e.g. Isang bukas na parke na may sementadong daanan at mga puno"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-zinc-100 text-xs focus:outline-none transition-all"
            />
          </div>

          {/* Optional MP3 Audio Upload */}
          <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-400" />
                  Upload MP3 Audio for Automatic Subtitles (Optional)
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Upload an MP3/audio track. Gemini will automatically transcribe spoken dialogue, vocals, and sound cues into timecoded subtitles.
                </p>
              </div>

              {audioFileName ? (
                <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0">
                  <Music className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold truncate max-w-[180px]">{audioFileName}</span>
                  <button
                    type="button"
                    onClick={() => { setAudioData(undefined); setAudioFileName(undefined); }}
                    className="text-zinc-400 hover:text-rose-400 text-xs font-bold ml-1 p-0.5 rounded hover:bg-zinc-800"
                    title="Remove audio file"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center gap-2 shrink-0 shadow-md shadow-amber-600/30">
                  <Upload className="w-4 h-4" />
                  <span>Upload MP3 Audio</span>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAudioUpload(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Scenes Input List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Configured Scenes ({scenes.length})
              </span>
              <button
                type="button"
                onClick={handleAddScene}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Single Scene
              </button>
            </div>

            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-4 relative group hover:border-zinc-700 transition-all"
              >
                {/* Scene Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold font-mono text-xs flex items-center justify-center border border-indigo-500/30">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-zinc-100 text-xs">Scene #{idx + 1}</h3>
                    {scene.frame_count !== undefined && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Frame #{scene.frame_count}
                      </span>
                    )}
                  </div>

                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScene(scene.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                {/* Single Snapshot Image Uploader */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Scene Snapshot Frame Image
                  </label>

                  {scene.start_image ? (
                    <div className="relative rounded-xl overflow-hidden border border-indigo-500/50 aspect-video group/img bg-zinc-900 max-w-md">
                      <img src={scene.start_image} alt={`Scene #${idx + 1} snapshot`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateScene(scene.id, { start_image: undefined })}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] rounded-lg font-semibold transition-colors"
                        >
                          Replace / Remove
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[10px] text-indigo-300 font-mono rounded border border-indigo-500/30">
                        Scene #{idx + 1} Snapshot
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 rounded-xl p-4 bg-zinc-900/60 cursor-pointer transition-colors aspect-video max-w-md text-center group/btn">
                      <Upload className="w-6 h-6 text-zinc-500 group-hover/btn:text-indigo-400 mb-1 transition-colors" />
                      <span className="text-[11px] font-semibold text-zinc-300 group-hover/btn:text-white">
                        Upload Scene Snapshot
                      </span>
                      <span className="text-[10px] text-zinc-500">JPG, PNG, WebP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSingleImageFile(scene.id, f);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Textbox for Action Guidance (Tagalog or English) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      Scene Action Guidance (Tagalog or English)
                    </label>
                    <span className="text-[10px] text-amber-300/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ✨ Tagalog Translated to English
                    </span>
                  </div>
                  <textarea
                    value={scene.raw_description}
                    onChange={(e) => handleUpdateScene(scene.id, { raw_description: e.target.value })}
                    rows={3}
                    placeholder="Describe actions happening in this scene in Tagalog or English (e.g., 'May dalawang tao sa parke. Ang lalaki ay nakatayo sa tabi ng bisikleta.')"
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Tagalog input will be translated to English and formatted strictly according to non-speculative factual video annotation guidelines.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            {scenes.length} Scene {scenes.length === 1 ? 'Entry' : 'Entries'} Ready
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 text-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              Stage 2: Run Generation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
