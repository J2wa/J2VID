import React from 'react';
import { Film, Clock, Activity, MapPin } from 'lucide-react';
import { VideoAnnotationResult } from '../types';
import { parseTimestampToSeconds, formatSecondsToTimestamp } from '../utils/timeUtils';

interface TimelineTrackProps {
  annotationResult: VideoAnnotationResult | null;
  duration: number;
  currentTime: number;
  onJumpToTime: (seconds: number) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  annotationResult,
  duration,
  currentTime,
  onJumpToTime
}) => {
  const totalDuration = duration || parseTimestampToSeconds(annotationResult?.video_duration || '00:00:30.000') || 30;
  const currentPercent = (currentTime / totalDuration) * 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Interactive Scene Sequence Timeline</h2>
        </div>
        <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
          <span>Scenes: <strong className="text-indigo-400">{annotationResult?.scenes?.length || 0}</strong></span>
        </div>
      </div>

      {/* Main Timeline Canvas Wrapper */}
      <div className="relative space-y-6 pt-2 pb-4">
        {/* Scene Segments Track */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-300">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>Action Scenes Track</span>
          </div>

          <div className="relative min-h-16 bg-zinc-950 rounded-xl border border-zinc-800/80 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {annotationResult?.scenes && annotationResult.scenes.length > 0 ? (
              annotationResult.scenes.map((scene, idx) => {
                const sTime = scene.start_time || `Scene ${idx + 1}`;
                const eTime = scene.end_time || '';

                return (
                  <div
                    key={scene.scene_id}
                    className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-left flex flex-col justify-between gap-1 group hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-tight">
                      <span className="text-indigo-300">Scene #{scene.scene_id}</span>
                      {eTime && <span className="text-[10px] font-mono text-zinc-500">{sTime.substring(3, 8)} - {eTime.substring(3, 8)}</span>}
                    </div>
                    <p className="text-[10px] text-zinc-300 font-sans line-clamp-2 leading-relaxed">
                      {scene.narrative_description}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="w-full flex items-center justify-center text-xs text-zinc-500 italic py-4">
                No action scenes configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
