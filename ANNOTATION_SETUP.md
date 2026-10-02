# Annotation standards and subtitle setup

Generation and revision share the standards from the supplied Annotator Guidelines
and FAQs and Six Questions Video Description Examples. LLM generation remains enabled
at the project owner's explicit request. This is an intentional exception to the
PDF's prohibition on AI-generated descriptions; these outputs should not be represented
as complying with that prohibition.

Descriptions use natural prose, observable details, precise verbs and chronological
events. The six questions guide observation without forcing headings, six sentences or
empty answers. Describe logos generically and reproduce relevant visible text exactly.
Never infer unseen movement or transitions from one snapshot. Human review is needed
for factual accuracy, suitability, scene boundaries, sound relevance and timing.

## Subtitles

English speech is verbatim. Non-English portions use [Speaking non-English], with
English portions kept separate. Silence stays empty. Significant sounds use bracketed
labels; profanity is censored and focused English singing includes lyrics.
Meaningful overlaps remain intact. Review and refine generated timing against audio.

The audio endpoint uses Gemini generateContent with a compatible audio-understanding
model. It does not send an OpenRouter vision ID or the Interactions-only
gemini-3.5-transcribe model to that API. Scene runs with attached audio use the same
audio service regardless of their scene provider.

## Vercel keys

In Project Settings → Environment Variables, choose the intended environments and
save the keys privately. Redeploy for changes to take effect.

| Variable | Purpose |
| --- | --- |
| GEMINI_API_KEY | Direct Gemini scene generation and default audio key |
| OPENROUTER_API_KEY | OpenRouter scene generation and revision |
| GEMINI_AUDIO_API_KEY | Optional dedicated Gemini subtitle key; otherwise uses GEMINI_API_KEY |
| GEMINI_AUDIO_MODEL | Optional compatible audio model; default gemini-flash-latest |

Do not prefix secrets with VITE_ or commit them to GitHub. The audio key is optional
when GEMINI_API_KEY is already present. OpenRouter alone does not provide subtitles
through the current audio service.

Possible future extensions, pending owner confirmation:

- Backup-key pool with bounded retries for transient/quota failures, without exposing keys.
- A dedicated speech-to-text provider with a separate key and measured timestamp accuracy.
- Six observation textboxes per segment with preservation of manually entered answers.
- Up to four subtitle lanes, time-range editing and loop playback for overlapping speakers.
- Multiple frames per scene to support observable change and reduce still-image inference.

## Validation

Run npm run lint, npm run build, and node --import tsx --test tests/*.test.ts.
Tests include a mocked Gemini SDK HTTP response, wrong-model routing, malformed results,
silence, overlapping ranges and review warnings. Live provider transcription and Vercel
deployment still require the configured keys and a representative audio file.
