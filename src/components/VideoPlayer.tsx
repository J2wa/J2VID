import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, FastForward, Film } from 'lucide-react';
import { VideoAnnotationResult, SceneAnnotation } from '../types';
import { parseTimestampToSeconds, formatSecondsToTimestamp } from '../utils/timeUtils';

interface VideoPlayerProps {
  videoUrl: string;
  annotationResult: VideoAnnotationResult | null;
  currentTime: number;
  onTimeUpdate: (seconds: number) => void;
  onDurationChange: (seconds: number) => void;
  seekToTime: number | null;
  onSeekComplete: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  annotationResult,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  seekToTime,
  onSeekComplete
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);

  // Synchronized active scene calculation
  const [activeScene, setActiveScene] = useState<SceneAnnotation | null>(null);

  // Handle external seek requests
  useEffect(() => {
    if (seekToTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekToTime;
      onSeekComplete();
    }
  }, [seekToTime, onSeekComplete]);

  // Sync active scene with current time
  useEffect(() => {
    if (!annotationResult) {
      setActiveScene(null);
      return;
    }

    // Find active scene
    if (annotationResult.scenes && annotationResult.scenes.length > 0) {
      const matchScene = annotationResult.scenes.find((s) => {
        const start = parseTimestampToSeconds(s.start_time);
        const end = parseTimestampToSeconds(s.end_time);
        return currentTime >= start && currentTime <= end;
      });
      setActiveScene(matchScene || null);
    } else {
      setActiveScene(null);
    }
  }, [currentTime, annotationResult]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    onTimeUpdate(newTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      onDurationChange(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const stepTime = (delta: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = target;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Main Video Viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          crossOrigin="anonymous"
        />

        {/* Video Overlay Control Button on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            className="p-4 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full shadow-2xl backdrop-blur-md transform transition scale-90 group-hover:scale-100 pointer-events-auto"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
          </button>
        </div>

        {/* Top Floating Badge showing Current Scene ID */}
        {activeScene && (
          <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-700/80 backdrop-blur-md text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 z-20 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">Scene #{activeScene.scene_id}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">{activeScene.start_time} - {activeScene.end_time}</span>
          </div>
        )}
      </div>

      {/* Scrubbing Timeline & Playback Bar */}
      <div className="p-3 bg-zinc-900/95 border-t border-zinc-800 flex flex-col gap-2">
        {/* Seekbar Slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>

        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 font-mono">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-indigo-400" /> : <Play className="w-4 h-4 text-indigo-400" />}
            </button>

            <button
              onClick={() => stepTime(-1)}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              title="Back 1 sec"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => stepTime(1)}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              title="Forward 1 sec"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
            </button>

            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <span className="text-indigo-400">{formatSecondsToTimestamp(currentTime)}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{formatSecondsToTimestamp(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60">
              {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              onClick={handleFullscreen}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Scene Narrative Live Box */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800/80">
        <div className="flex items-center gap-2 mb-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Live Synchronized Narrative Description
          </h3>
        </div>

        {activeScene ? (
          <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
            {activeScene.narrative_description}
          </p>
        ) : (
          <p className="text-xs text-zinc-500 italic bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/40">
            {annotationResult?.suitability?.status === 'discarded'
              ? 'Video was discarded by suitability assessment. No narrative available.'
              : 'Scrub or play video to synchronize scene description narratives...'}
          </p>
        )}
      </div>
    </div>
  );
};
