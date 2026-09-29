export const NON_ENGLISH_SPEECH = '[Speaking non-English]';

export const sceneStyleInstruction = `Write a concise, natural video scene description in present tense. Lead with the visible subject and what it is doing; add the setting and camera view only when useful. Use active verbs. Do not force a fixed number of sentences or mention every one of the six core questions in the prose. Never call the scene an image, snapshot, picture, or frame. Do not write empty filler such as "providing no additional environmental context", "no movement or transition occurs", "nothing else is happening", or an explanation of what cannot be determined. Omit unsupported action or change entirely instead of saying that no change occurs. A single still cannot prove motion or camera movement; use explicit user guidance only when it supplies that action. Keep only concrete, observable details and avoid generic embellishment, repetition, and claims about what the viewer can or cannot see. Record uncertainty in the separate core_questions fields, never in narrative_description.`;

export function cleanSceneNarrative(description: unknown): string {
  if (typeof description !== 'string') return '';
  const cleaned = description
    .replace(/,?\s*(?:providing|offering|adding) no additional (?:environmental|visual|narrative) context\b/gi, '')
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\b(?:no (?:movement|transition|change|additional (?:environmental|visual) (?:detail|context))|nothing (?:else|more) (?:is|can be) (?:visible|seen|happening)|cannot (?:be )?determine(?:d)?|not enough (?:information|detail))\b/i.test(sentence))
    .join(' ')
    .trim();
  return cleaned;
}

export const subtitleStyleInstruction = `For speech, transcribe English words in English. For any non-English speech, use exactly [Speaking non-English] instead of transcribing, romanizing, or translating it. If English and non-English occur in one utterance, split them into separate timestamped subtitle entries so only the non-English portion is replaced. Mark spoken entries with language "English" or "non-English"; use "none" for non-speech entries. Do not guess a language from an unclear voice: use [inaudible speech] when speech is unintelligible. Use square brackets for sounds, keep labels short and consistent, and describe only what can be heard with confidence.`;

export function normalizeSubtitles(data: any): any {
  if (!Array.isArray(data.subtitles)) {
    data.subtitles = [];
    return data;
  }
  data.subtitles = data.subtitles.map((subtitle: any) => {
    const language = String(subtitle.language || '').trim().toLowerCase();
    const speech = subtitle.type === 'Spoken words';
    return speech && (language === 'non-english' || language === 'mixed')
      ? { ...subtitle, text: NON_ENGLISH_SPEECH }
      : subtitle;
  });
  return data;
}
