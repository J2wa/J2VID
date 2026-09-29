export const NON_ENGLISH_SPEECH = '[Speaking non-English]';

export const sceneStyleInstruction = `Write each narrative as a video scene, not as a description of a still image. Start with the setting, then the subject and their action; follow with camera perspective, secondary activity and the visible change or transition. Use active verbs and present tense. Never write "this image", "the image shows", "the snapshot", "the frame captures", or "pictured" in the narrative. A snapshot is evidence for the scene, not the subject of the sentence. Ground actions in visible evidence or explicit user guidance; do not invent motion, camera movement, or changes that one still cannot establish. If a change is unknown, omit it from the narrative and state the uncertainty in core_questions.change. Describe only details you can identify confidently.`;

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
