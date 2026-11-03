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

  return <header className="aces-header">
    <button className="aces-brand" onClick={onResetVideo} disabled={isAnalyzing} aria-label="ACES Video home">aces<span> video</span></button>
    {hasVideo && <nav className="flex flex-wrap gap-3 items-center" aria-label="Workspace">
      {hasVideo && <button className="aces-nav-button" disabled={isAnalyzing} onClick={onResetVideo}>Home</button>}
      {annotationResult && !isAnalyzing && <details className="relative"><summary className="aces-nav-button cursor-pointer">Export</summary><div className="aces-export">
        <button onClick={handleDownloadJson}>Download JSON</button>
        {!!annotationResult.subtitles?.length && <><button onClick={handleDownloadSrt}>Download SRT</button><button onClick={handleDownloadVtt}>Download VTT</button></>}
      </div></details>}
    </nav>}
  </header>;
};

