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
| GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 | Direct Gemini scene generation/revision: primary and two backups |
| OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, OPENROUTER_API_KEY_3 | OpenRouter scene generation/revision: primary and two backups |
| GEMINI_AUDIO_API_KEY, GEMINI_AUDIO_API_KEY_2, GEMINI_AUDIO_API_KEY_3 | Dedicated Gemini subtitle pool: primary and two backups |
| GEMINI_AUDIO_MODEL | Optional compatible audio model; default gemini-flash-latest |

Each pool accepts up to three ordered keys. The unsuffixed name is key 1; an _1
suffix is also accepted as an alias. Empty values are skipped and duplicate values
are used once. If no dedicated audio keys are configured, subtitles inherit the
Gemini scene pool. If any dedicated audio key exists, subtitles use that pool only.

With Auto Fallback enabled, authentication, quota, billing and selected temporary
server errors try key 2 and then key 3. Bad input/model errors do not consume backup
attempts. After the pool is exhausted, existing model/provider fallback applies
where supported. Disabling Auto Fallback uses only the first configured key.
No key values are exposed in the browser or health response.

Gemini rate limits apply per project, not per key: three keys from one project
share its quota. See https://ai.google.dev/gemini-api/docs/rate-limits.

Do not prefix secrets with VITE_ or commit them to GitHub. The audio key is optional
when GEMINI_API_KEY is already present. OpenRouter alone does not provide subtitles
through the current audio service.

Possible future extensions, pending owner confirmation:

- A dedicated speech-to-text provider with a separate key and measured timestamp accuracy.
- Six observation textboxes per segment with preservation of manually entered answers.
- Up to four subtitle lanes, time-range editing and loop playback for overlapping speakers.
- Multiple frames per scene to support observable change and reduce still-image inference.

## Validation

Run npm run lint, npm run build, and node --import tsx --test tests/*.test.ts.
Tests include a mocked Gemini SDK HTTP response, wrong-model routing, malformed results,
silence, overlapping ranges and review warnings. Live provider transcription and Vercel
deployment still require the configured keys and a representative audio file.
