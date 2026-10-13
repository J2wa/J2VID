import React, { useId } from 'react';
import { SubtitleProvider } from '../types';

interface Props {
  value: SubtitleProvider;
  onChange: (value: SubtitleProvider) => void;
  disabled?: boolean;
}

export function SubtitleProviderSelector({ value, onChange, disabled }: Props) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-zinc-200">Subtitle provider</label>
      <select id={id} value={value} disabled={disabled}
        onChange={event => onChange(event.target.value as SubtitleProvider)}
        aria-describedby={id + '-help'}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none disabled:opacity-50">
        <option value="gemini">Gemini — speech and relevant sound cues</option>
        <option value="deepgram">Deepgram — speech transcription</option>
      </select>
      <p id={id + '-help'} className="text-[11px] leading-relaxed text-zinc-400">
        {value === 'deepgram'
          ? 'Uses your Deepgram key. Add music and sound cues manually. Review language labels; use Gemini for languages Deepgram does not support.'
          : 'Uses your Gemini audio key and includes relevant music and sound cues. Review the wording and timing.'}
      </p>
    </div>
  );
}
