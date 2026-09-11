import React from 'react';
import { Video, Sparkles, Download, FileText, Code2, RefreshCw, Layers, Cpu, ChevronDown } from 'lucide-react';
import { VideoAnnotationResult } from '../types';
import { downloadFile, generateSrtContent, generateVttContent } from '../utils/exportUtils';
import { AVAILABLE_MODELS } from '../data/models';

interface HeaderProps {
  currentTitle: string;
  onRunAgentAnalysis: () => void;
  isAnalyzing: boolean;
  annotationResult: VideoAnnotationResult | null;
  activeTab: 'annotations' | 'timeline' | 'json' | 'workflow';
  setActiveTab: (tab: 'annotations' | 'timeline' | 'json' | 'workflow') => void;
  onResetVideo?: () => void;
  hasVideo: boolean;
  selectedModel?: string;
  onOpenModelSelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTitle,
  onRunAgentAnalysis,
  isAnalyzing,
  annotationResult,
  activeTab,
  setActiveTab,
  onResetVideo,
  hasVideo,
  selectedModel = 'gemini-3.8-flash',
  onOpenModelSelector
}) => {
  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const handleDownloadJson = () => {
    if (!annotationResult) return;
    const jsonStr = JSON.stringify(annotationResult, null, 2);
    downloadFile(jsonStr, 'annotations.json', 'application/json');
  };

  const handleDownloadSrt = () => {
    if (!annotationResult?.subtitles) return;
    const srt = generateSrtContent(annotationResult.subtitles);
    downloadFile(srt, 'subtitles.srt', 'text/plain');
  };

  const handleDownloadVtt = () => {
    if (!annotationResult?.subtitles) return;
    const vtt = generateVttContent(annotationResult.subtitles);
    downloadFile(vtt, 'subtitles.vtt', 'text/vtt');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] text-zinc-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Active Video Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl shadow-lg shadow-blue-500/10 text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">J2 Clips</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full">
                  AI Annotator
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate max-w-[280px] sm:max-w-[360px]">
                {currentTitle || 'Upload a video to begin generation'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Only shown if video is loaded or generated) */}
        {hasVideo && (
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-2xl border border-[#27272a] text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('annotations')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'annotations'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Event Action Descriptions
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Interactive Timeline
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'workflow'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Agent Workflow Log
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'json'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              JSON Output
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {onOpenModelSelector && (
            <button
              onClick={onOpenModelSelector}
              className="text-xs bg-[#18181b] hover:bg-zinc-800 text-zinc-200 hover:text-white px-3 py-2 rounded-2xl border border-[#27272a] hover:border-zinc-700 transition-all font-medium flex items-center gap-2 shadow-sm"
              title="Select AI Model & Provider (Gemini / OpenRouter)"
            >
              <Cpu className={`w-3.5 h-3.5 shrink-0 ${activeModelObj.provider === 'openrouter' ? 'text-cyan-400' : 'text-blue-400'}`} />
              <div className="flex items-center gap-1.5 text-left">
                <span className="hidden sm:inline font-semibold">{activeModelObj.name}</span>
                <span className="sm:hidden font-semibold">Model</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono hidden lg:inline border ${
                  activeModelObj.provider === 'openrouter'
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20'
                    : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                }`}>
                  {activeModelObj.provider === 'openrouter' ? 'OpenRouter' : (activeModelObj.id === 'gemini-3.8-flash' ? 'Default' : activeModelObj.tag)}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
            </button>
          )}

          {onResetVideo && hasVideo && (
            <button
              onClick={onResetVideo}
              className="text-xs bg-[#18181b] hover:bg-zinc-800 text-blue-400 px-3.5 py-2 rounded-2xl border border-[#27272a] transition-colors font-semibold flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              Upload Different Video
            </button>
          )}

          {hasVideo && (
            <button
              onClick={onRunAgentAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-blue-500/20 border border-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run Generation
                </>
              )}
            </button>
          )}

          {/* Export options */}
          {annotationResult && (
            <div className="relative group">
              <button
                className="p-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-2xl border border-[#27272a] transition-colors flex items-center gap-1 text-xs"
                title="Export Annotations"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl py-1 w-40 z-50 text-xs">
                <button
                  onClick={handleDownloadJson}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  JSON (.json)
                </button>
                <button
                  onClick={handleDownloadSrt}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Subtitles (.srt)
                </button>
                <button
                  onClick={handleDownloadVtt}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  WebVTT (.vtt)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
