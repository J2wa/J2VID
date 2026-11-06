import { useRef, useState } from 'react';
import type { VideoAnnotationResult } from '../types';
import { downloadResult, parseResultFile, readResultFile, type ResultFile, type ResultKind } from '../utils/resultFiles';

export function ResultTransfer({ kind, result, disabled = false, onImport }: {
  kind: ResultKind; result: VideoAnnotationResult | null; disabled?: boolean; onImport: (file: ResultFile) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<ResultFile | null>(null);
  const locked = disabled || !!busy;
  const count = result?.[kind].length || 0;
  const load = async (file?: File) => {
    if (!file) return;
    setBusy('Reading results…'); setError(''); setMessage(''); setPending(null);
    try { setPending(await readResultFile(file, kind)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not import this file.'); }
    finally { setBusy(''); if (input.current) input.current.value = ''; }
  };
  const save = async (format: 'json' | 'pdf') => {
    if (!result) return;
    setBusy('Preparing ' + format.toUpperCase() + '…'); setError(''); setMessage('');
    try {
      const file = parseResultFile({ format: 'aces-video-results', version: 1, kind, result }, kind);
      if (format === 'json') downloadResult(JSON.stringify(file,null,2), 'aces-video-' + kind + '.json', 'application/json');
      else {
        const { createResultPdf } = await import('../utils/resultPdf');
        const bytes = await createResultPdf(file);
        downloadResult(new Uint8Array(bytes).buffer, 'aces-video-' + kind + '.pdf', 'application/pdf');
      }
      setMessage(format.toUpperCase() + ' download started.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.'); }
    finally { setBusy(''); }
  };
  return <section className="border border-zinc-700 rounded-xl p-4 space-y-3" aria-label={kind + ' import and export'}>
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-semibold">{kind === 'scenes' ? 'Scene results' : 'Subtitle results'}</span>
      <input ref={input} type="file" accept=".json,.pdf,application/json,application/pdf" hidden onChange={e => void load(e.target.files?.[0])}/>
      <button className="aces-nav-button" disabled={locked} onClick={() => input.current?.click()}>Import JSON / PDF</button>
      <button className="aces-nav-button" disabled={locked || !count} onClick={() => void save('json')}>Export JSON</button>
      <button className="aces-nav-button" disabled={locked || !count} onClick={() => void save('pdf')}>Export PDF</button>
    </div>
    <p className="text-xs">Import ACES Video JSON or PDF exports, up to 50 MB. PDFs retain editable result data; other PDF layouts and scans are not supported. Original video/audio is not included.</p>
    {pending && <div className="border border-blue-500 rounded-lg p-3 space-y-2">
      <p>Ready to import {pending.result[kind].length} {kind}. {count ? 'This replaces the ' + count + ' current ' + kind + '.' : 'This loads results into this workspace.'} Other result types are kept.</p>
      <div className="flex gap-3"><button className="aces-primary" disabled={locked} onClick={() => { onImport(pending); setMessage('Imported ' + pending.result[kind].length + ' ' + kind + '.'); setPending(null); }}>Import results</button><button className="aces-nav-button" disabled={locked} onClick={() => setPending(null)}>Cancel</button></div>
    </div>}
    <p role="status" aria-live="polite" className="text-sm">{busy || message}</p>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
  </section>;
}
