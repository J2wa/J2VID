export const AUDIO_MODEL = 'gemini-flash-latest';

// Vision model selection must not route an OpenRouter ID or Interactions-only model
// through Gemini generateContent.
export function selectAudioModel(requested?: string): string {
  return ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest',
    'gemini-3.1-pro-preview'].includes(requested || '') ? requested! : AUDIO_MODEL;
}

export function parseAudioInput(audioData: unknown, mime = 'audio/mpeg') {
  if (typeof audioData !== 'string' || !audioData.trim()) {
    throw new Error('Choose a non-empty audio file before generating subtitles.');
  }
  let data = audioData.trim();
  if (data.startsWith('data:')) {
    const match = data.match(/^data:([^;,]+);base64,([\s\S]+)$/);
    if (!match) throw new Error('Invalid audio data URL.');
    mime = match[1];
    data = match[2];
  }
  if (mime === 'audio/mp3') mime = 'audio/mpeg';
  if (!mime.startsWith('audio/') || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new Error('Invalid audio format or base64 data.');
  }
  return { mimeType: mime, data };
}

const timestamp = /^(\d{2,}):([0-5]\d):([0-5]\d)\.(\d{3})$/;
function seconds(value: unknown) {
  const match = typeof value === 'string' ? value.match(timestamp) : null;
  if (!match) throw new Error('Subtitle timestamp must use HH:MM:SS.mmm.');
  return +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000;
}

export function normalizeSubtitles(value: unknown) {
  if (!Array.isArray(value)) throw new Error('The audio provider returned no subtitle array. Please retry.');
  const types = ['Spoken words', 'Music', 'Sound effect', 'Ambient sound', 'Vocal sound', 'Other'];
  return value.map((sub, index) => {
    if (!sub || typeof sub.text !== 'string' || !sub.text.trim() ||
        !types.includes(sub.type) || seconds(sub.end_time) <= seconds(sub.start_time)) {
      throw new Error('The audio provider returned an invalid subtitle range. Please retry.');
    }
    return { subtitle_id: index + 1, start_time: sub.start_time, end_time: sub.end_time,
      type: sub.type, text: sub.text.trim().replace(/\[(?:non[- ]English speech|speaking (?:in )?(?:other|foreign) language|speaking non[- ]English)\]/gi, '[Speaking non-English]') };
  });
}
