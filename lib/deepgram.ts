import { getApiKeys, withApiKeyFallback } from './api-keys.js';
import { parseAudioInput, normalizeSubtitles } from './subtitles.js';

interface Word {
  word: string; punctuated_word?: string; start: number; end: number;
  language?: string; speaker?: number;
}

function timestamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
    .map(value => String(value).padStart(2, '0')).join(':') + '.' + String(ms % 1000).padStart(3, '0');
}

// Word boundaries are kept, including overlaps between speakers. Only one provider
// is called; a Deepgram selection never silently falls back to Gemini.
export function deepgramToSubtitles(payload: any) {
  const channels = payload?.results?.channels;
  if (!Array.isArray(channels) || !channels.length) throw new Error('Deepgram returned no audio channels.');
  const subtitles: any[] = [];
  let unknownLanguage = false;
  channels.forEach((channel: any) => {
    const alternative = channel?.alternatives?.[0];
    if (!alternative || !Array.isArray(alternative.words)) throw new Error('Deepgram returned invalid word timestamps.');
    if (!alternative.words.length && alternative.transcript?.trim()) {
      throw new Error('Deepgram returned speech without word timestamps. Please retry.');
    }
    const singleLanguage = alternative.languages?.length === 1 ? alternative.languages[0] : channel.detected_language;
    const groups = new Map<string, Word[]>();
    for (const word of alternative.words as Word[]) {
      if (typeof word.word !== 'string' || !Number.isFinite(word.start) ||
          !Number.isFinite(word.end) || word.start < 0 || word.end <= word.start) {
        throw new Error('Deepgram returned an invalid word range.');
      }
      const speaker = String(word.speaker ?? 'unknown');
      const words = groups.get(speaker) || [];
      words.push({ ...word, language: word.language || singleLanguage });
      groups.set(speaker, words);
    }
    for (const words of groups.values()) {
      let current: Word[] = [];
      let currentKind = '';
      const flush = () => {
        if (!current.length) return;
        subtitles.push({ start_time: timestamp(current[0].start),
          end_time: timestamp(current.at(-1)!.end), type: 'Spoken words',
          text: currentKind === 'english' ? current.map(w => w.punctuated_word || w.word).join(' ')
            : currentKind === 'foreign' ? '[Speaking non-English]' : '[indistinct chatter]' });
        current = [];
      };
      for (const word of words.sort((a, b) => a.start - b.start)) {
        const kind = !word.language ? 'unknown' : /^en(?:-|$)/i.test(word.language) ? 'english' : 'foreign';
        if (kind === 'unknown') unknownLanguage = true;
        const textLength = current.reduce((sum, w) => sum + (w.punctuated_word || w.word).length + 1, 0);
        if (current.length && (kind !== currentKind || word.start - current.at(-1)!.end > 0.8 ||
            word.end - current[0].start > 6 || (kind === 'english' && textLength + word.word.length > 84))) flush();
        currentKind = kind;
        current.push(word);
        if (kind === 'english' && /[.!?]$/.test(word.punctuated_word || '')) flush();
      }
      flush();
    }
  });
  subtitles.sort((a, b) => a.start_time.localeCompare(b.start_time));
  return { subtitles: normalizeSubtitles(subtitles), unknownLanguage };
}

export async function transcribeDeepgram(audioData: unknown, audioMimeType?: string, autoFallback = true) {
  const keys = getApiKeys('deepgram');
  if (!keys.length) throw Object.assign(new Error('Add DEEPGRAM_API_KEY in Vercel Environment Variables to use Deepgram subtitles.'), { status: 503 });
  const audio = parseAudioInput(audioData, audioMimeType);
  const model = process.env.DEEPGRAM_MODEL?.trim() || 'nova-3';
  const query = new URLSearchParams({ model, language: 'multi', punctuate: 'true',
    diarize: 'true', utterances: 'true', filler_words: 'true', profanity_filter: 'true' });
  const payload = await withApiKeyFallback(keys, async key => {
    const response = await fetch('https://api.deepgram.com/v1/listen?' + query, {
      method: 'POST', headers: { Authorization: 'Token ' + key, 'Content-Type': audio.mimeType },
      body: Buffer.from(audio.data, 'base64'), signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) {
      // Do not echo provider bodies that might contain credentials or audio content.
      throw Object.assign(new Error('Deepgram transcription failed (HTTP ' + response.status +
        '). Check your key, credits, model and audio format.'), { status: response.status });
    }
    return response.json();
  }, autoFallback);
  const result = deepgramToSubtitles(payload);
  return { subtitles: result.subtitles, _provider: 'deepgram', _modelUsed: model,
    _warnings: result.unknownLanguage ? ['Some speech lacked language tags and was labeled [indistinct chatter]. Review those ranges.'] : [] };
}
