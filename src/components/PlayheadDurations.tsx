import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { parseTimestampToSeconds } from '../utils/timeUtils';

export function PlayheadDurations({ subtitleId, start, end }: {
  subtitleId: number; start: string; end: string;
}) {
  const [feedback, setFeedback] = useState({ key: '', message: '', success: false });
  const values = [
    { label: 'Start (seconds)', value: parseTimestampToSeconds(start).toFixed(3), field: 'start' },
    { label: 'End (seconds)', value: parseTimestampToSeconds(end).toFixed(3), field: 'end' }
  ];
  const copy = async (field: string, value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ key, message: `${field === 'start' ? 'Start' : 'End'} copied: ${value}`, success: true });
    } catch {
      setFeedback({ key, message: 'Could not copy. Select the seconds value and copy it manually.', success: false });
    }
  };
  const currentFeedback = values.some(item => `${subtitleId}:${item.field}:${item.value}` === feedback.key);
  return <fieldset className="border border-zinc-700 rounded-lg px-3 py-2 my-2 min-w-0">
    <legend className="px-1 text-xs font-semibold text-zinc-200">Playhead durations</legend>
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      {values.map(({ label, value, field }) => {
        const key = `${subtitleId}:${field}:${value}`;
        const copied = feedback.key === key && feedback.success;
        return <div key={field} className="flex items-center gap-2">
          <label className="text-xs text-zinc-300 flex items-center gap-2">{label}
            <input readOnly value={value} aria-label={`Subtitle ${subtitleId} ${label}`} onFocus={event => event.currentTarget.select()}
              className="w-24 min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100" />
          </label>
          <button type="button" onClick={() => copy(field, value, key)} aria-label={`Copy subtitle ${subtitleId} ${field} seconds`} title={`Copy ${field} seconds`}
            className="p-2 rounded border border-zinc-700 text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2">
            {copied ? <Check size={14} aria-hidden="true"/> : <Copy size={14} aria-hidden="true"/>}
          </button>
        </div>;
      })}
    </div>
    <p role="status" aria-live="polite" className="text-xs text-zinc-400 mt-1">{currentFeedback ? feedback.message : ''}</p>
  </fieldset>;
}
