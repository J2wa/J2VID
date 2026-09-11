import React, { useState } from 'react';
import { MessageSquare, Play, Edit3, Plus, Trash2, Search, Volume2, Music, Mic, Radio, Bell, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { SubtitleAnnotation, SubtitleType } from '../types';
import { parseTimestampToSeconds } from '../utils/timeUtils';

interface SubtitleListProps {
  subtitles: SubtitleAnnotation[];
  currentTime: number;
  onJumpToTime: (seconds: number) => void;
  onEditSubtitle: (sub: SubtitleAnnotation) => void;
  onAddSubtitle: () => void;
  onDeleteSubtitle: (subId: number) => void;
  onSubtitlesGenerated?: (newSubtitles: SubtitleAnnotation[]) => void;
  selectedModel?: string;
  autoFallback?: boolean;
}

export const SubtitleList: React.FC<SubtitleListProps> = ({
  subtitles,
  currentTime,
  onJumpToTime,
  onEditSubtitle,
  onAddSubtitle,
  onDeleteSubtitle,
  onSubtitlesGenerated,
  selectedModel,
  autoFallback
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);

  const handleMp3FileUpload = async (file: File) => {
    try {
      setIsTranscribing(true);
      setTranscribeNotice(`Uploading ${file.name} and generating timed subtitles with Gemini AI...`);

      const audioObjectUrl = URL.createObjectURL(file);
      setUploadedAudioUrl(audioObjectUrl);
      setUploadedAudioName(file.name);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: dataUrl,
              audioMimeType: file.type || 'audio/mp3',
              fileName: file.name,
              model: selectedModel,
              autoFallback
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Transcription failed');
          }

          const data = await res.json();
          if (data.subtitles && Array.isArray(data.subtitles) && onSubtitlesGenerated) {
            onSubtitlesGenerated(data.subtitles);
            setTranscribeNotice(`Successfully transcribed ${data.subtitles.length} subtitle entries from ${file.name}!`);
          } else {
            setTranscribeNotice('Subtitles generated successfully!');
          }
        } catch (err: any) {
          console.error('Error transcribing audio:', err);
          setTranscribeNotice(`Error: ${err.message || 'Failed to transcribe audio'}`);
        } finally {
          setIsTranscribing(false);
          setTimeout(() => setTranscribeNotice(null), 6000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error reading MP3 file:', err);
      setIsTranscribing(false);
      setTranscribeNotice('Failed to read MP3 file');
    }
  };

  const filteredSubtitles = subtitles.filter((sub) => {
    const matchesSearch =
      sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.start_time.includes(searchTerm) ||
      sub.end_time.includes(searchTerm);

    const matchesType = selectedType === 'all' || sub.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getTypeBadgeStyle = (type: SubtitleType) => {
    switch (type) {
      case 'Spoken words':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Music':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Sound effect':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'Ambient sound':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Vocal sound':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getTypeIcon = (type: SubtitleType) => {
    switch (type) {
      case 'Spoken words': return <Mic className="w-3 h-3 text-amber-400" />;
      case 'Music': return <Music className="w-3 h-3 text-purple-400" />;
      case 'Sound effect': return <Bell className="w-3 h-3 text-cyan-400" />;
      case 'Ambient sound': return <Radio className="w-3 h-3 text-emerald-400" />;
      case 'Vocal sound': return <Volume2 className="w-3 h-3 text-rose-400" />;
      default: return <Volume2 className="w-3 h-3 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-zinc-100">Subtitle & Dialogue Timestamps</h2>
          <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">
            {subtitles.length} Entries
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Pill Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Audio Types</option>
            <option value="Spoken words">Spoken words</option>
            <option value="Music">Music</option>
            <option value="Sound effect">Sound effect</option>
            <option value="Ambient sound">Ambient sound</option>
            <option value="Vocal sound">Vocal sound</option>
            <option value="Other">Other</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search transcript & audio cues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 transition-colors w-full sm:w-48"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload MP3</span>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleMp3FileUpload(f);
              }}
            />
          </label>

          <button
            onClick={onAddSubtitle}
            className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Subtitle
          </button>
        </div>
      </div>

      {/* Transcription Notice / Loading Banner */}
      {transcribeNotice && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 ${
          isTranscribing 
            ? 'bg-indigo-950/70 border border-indigo-500/50 text-indigo-200' 
            : transcribeNotice.startsWith('Error')
            ? 'bg-rose-950/70 border border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{transcribeNotice}</span>
          </div>
          {uploadedAudioUrl && (
            <audio controls src={uploadedAudioUrl} className="h-8 max-w-[220px] rounded-lg border border-zinc-700" />
          )}
        </div>
      )}

      {/* Subtitles Items Container */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredSubtitles.length > 0 ? (
          filteredSubtitles.map((sub) => {
            const startSec = parseTimestampToSeconds(sub.start_time);
            const endSec = parseTimestampToSeconds(sub.end_time);
            const isActive = currentTime >= startSec && currentTime <= endSec;

            return (
              <div
                key={sub.subtitle_id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{sub.subtitle_id}
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getTypeBadgeStyle(sub.type)}`}>
                        {getTypeIcon(sub.type)}
                        {sub.type}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                        <span className="text-amber-400 font-semibold">{sub.start_time}</span>
                        <span>→</span>
                        <span className="text-amber-400 font-semibold">{sub.end_time}</span>
                      </div>
                    </div>

                    <p className={`text-xs font-medium ${sub.type === 'Spoken words' ? 'text-zinc-100 font-sans' : 'text-amber-200/90 italic font-mono'}`}>
                      {sub.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onJumpToTime(startSec)}
                    className="flex items-center gap-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-700 transition-colors font-medium"
                  >
                    <Play className="w-3 h-3 fill-current text-amber-400" />
                    Seek
                  </button>

                  <button
                    onClick={() => onEditSubtitle(sub)}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                    title="Edit Subtitle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteSubtitle(sub.subtitle_id)}
                    className="p-1.5 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete Subtitle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-zinc-500 text-xs italic bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
            No subtitles match your filter or search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
