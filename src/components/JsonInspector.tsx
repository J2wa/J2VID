import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { VideoAnnotationResult } from '../types';
import { downloadFile, generateSrtContent, generateVttContent } from '../utils/exportUtils';
import { validateAnnotationResult } from '../utils/validationUtils';

interface JsonInspectorProps {
  annotationResult: VideoAnnotationResult | null;
}

export const JsonInspector: React.FC<JsonInspectorProps> = ({ annotationResult }) => {
  const [copied, setCopied] = useState(false);

  if (!annotationResult) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs italic">
        No JSON output generated yet. Run the Agent Pipeline or select a benchmark video sample.
      </div>
    );
  }

  const jsonString = JSON.stringify(annotationResult, null, 2);
  const validationErrors = validateAnnotationResult(annotationResult);
  const hasErrors = validationErrors.some((e) => e.type === 'error');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    downloadFile(jsonString, 'annotations.json', 'application/json');
  };

  const handleDownloadSrt = () => {
    const srt = generateSrtContent(annotationResult.subtitles || []);
    downloadFile(srt, 'subtitles.srt', 'text/plain');
  };

  const handleDownloadVtt = () => {
    const vtt = generateVttContent(annotationResult.subtitles || []);
    downloadFile(vtt, 'subtitles.vtt', 'text/vtt');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-100">Final Schema Compliant JSON</h2>

          {/* Validation Pill */}
          {!hasErrors ? (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid Output Schema
            </span>
          ) : (
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              {validationErrors.length} Schema Warnings
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied JSON' : 'Copy JSON'}
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-indigo-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            .JSON
          </button>

          <button
            onClick={handleDownloadSrt}
            className="flex items-center gap-1.5 text-xs bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-emerald-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            .SRT
          </button>

          <button
            onClick={handleDownloadVtt}
            className="flex items-center gap-1.5 text-xs bg-amber-600/80 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-md shadow-amber-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            .VTT
          </button>
        </div>
      </div>

      {/* Code Editor Preview Block */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 overflow-x-auto max-h-[550px] font-mono text-xs text-zinc-300 leading-relaxed">
        <pre className="whitespace-pre">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
