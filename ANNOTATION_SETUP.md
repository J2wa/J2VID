# Annotation standards and subtitle setup

Generation and revision share the standards from the supplied Annotator Guidelines
and FAQs and Six Questions Video Description Examples. LLM generation remains enabled
at the project owner's explicit request. This is an intentional exception to the
PDF's prohibition on AI-generated descriptions; these outputs should not be represented
as complying with that prohibition.

Descriptions use natural prose, observable details, precise verbs and chronological
events. Every segment applies S.P.A.C.E.S: Setting (where), Perspective (viewpoint),
Action (what happens), Change (what develops), Environment (what else happens) and Subject
(who or what stands out). Generation and revision weave all six into coherent prose,
without labeled answers, a forced sentence count or empty filler. Unsupported details
remain uncertain rather than being invented to complete the framework. Describe logos generically and reproduce relevant visible text exactly.
Never infer unseen movement or transitions from one snapshot. Human review is needed
for factual accuracy, suitability, scene boundaries, sound relevance and timing.

## Starting context and description style

The first question in snapshot setup asks where the video takes place. The optional
answer can include the starting background, indoor/outdoor location and supported
time of day in Tagalog or English. Each segment has an optional location override.
Both Gemini and OpenRouter receive this context; it is retained with the scene and
sent again during revision. Visible changes take precedence over inherited context.

Use viewpoint language rather than a camera, drone or operator for filming perspective.
Include supported framing, angle, movement and focus. Start with the setting, identify
the subject through useful visible traits, and describe actions and revelations in
sequence, weaving in secondary surroundings and observed changes. Keep dialogue and
sound labels in subtitles. Avoid invented identities, relationships, motives or cuts.

The Golden Example calibration adds meaningful segmentation within a scene, distinct
title-card segments, focus and stance changes, and descriptions that distinguish
similar viewpoints. Preserve manually supplied segments and timings; splitting advice
must not fabricate new boundaries from single snapshots.

## Subtitles

English speech is verbatim. Non-English portions use [Speaking non-English], with
English portions kept separate. Silence stays empty. Significant sounds use bracketed
labels; profanity is censored and focused English singing includes lyrics.
Meaningful overlaps remain intact. Review and refine generated timing against audio.

Choose Gemini or Deepgram in the Subtitle provider selector, either during scene
setup or in the subtitle panel. The choice is shared and applies to attached audio
in scene runs as well as standalone subtitle uploads. It is independent of the
scene/vision model. Deepgram is selected by default in the app and for API callers\nthat omit a provider. Gemini remains available as an explicit choice.

Gemini uses a generateContent-compatible audio-understanding model and can include
relevant speech, music and sound cues. Deepgram uses its pre-recorded REST endpoint
with Nova-3 multilingual speech recognition by default. It receives binary audio
and returns word timestamps; the adapter splits English speech into readable timed
ranges, labels non-English runs [Speaking non-English], preserves speaker overlaps
and leaves silence empty. Profanity filtering and filler-word recognition are enabled.

Deepgram handles speech, not the project's music/sound-effect descriptions. Add those
manually or select Gemini. Multilingual recognition supports a limited language set:
review labels carefully, particularly for unsupported languages. Words without reliable
language metadata become [indistinct chatter] with a review warning instead of being
assumed English. No transcript is exposed for non-English runs. Live recognition still
needs verification with the project's actual audio.

The app never silently switches providers. Deepgram key retries follow Auto Fallback,
while a failed Deepgram request returns a clear error. Gemini remains available to select.

Official references:
- https://developers.deepgram.com/docs/pre-recorded-audio
- https://developers.deepgram.com/docs/multilingual-code-switching
- https://developers.deepgram.com/docs/profanity-filter

## Vercel keys

In Project Settings → Environment Variables, choose the intended environments and
save the keys privately. Redeploy for changes to take effect.

| Variable | Purpose |
| --- | --- |
| GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 | Direct Gemini scene generation/revision: primary and two backups |
| OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, OPENROUTER_API_KEY_3 | OpenRouter scene generation/revision: primary and two backups |
| GEMINI_AUDIO_API_KEY, GEMINI_AUDIO_API_KEY_2, GEMINI_AUDIO_API_KEY_3 | Dedicated Gemini subtitle pool: primary and two backups |
| DEEPGRAM_API_KEY, DEEPGRAM_API_KEY_2, DEEPGRAM_API_KEY_3 | Deepgram speech subtitles: primary and two optional backups |
| DEEPGRAM_MODEL | Optional pre-recorded multilingual model; default nova-3 |
| GEMINI_AUDIO_MODEL | Optional compatible audio model; default gemini-3.8-flash |

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

To use Deepgram on Vercel, add DEEPGRAM_API_KEY as a private Secret environment
variable in Project Settings → Environment Variables for the intended deployment
environments. Redeploy after adding it, then select Deepgram in the app. The two
backup keys and DEEPGRAM_MODEL are optional. No key needs to be pasted into the UI.

Do not prefix secrets with VITE_ or commit them to GitHub. The audio key is optional
when GEMINI_API_KEY is already present. OpenRouter alone does not provide audio subtitles; add a Gemini or Deepgram key.

Possible future extensions, pending owner confirmation:

- Six observation textboxes per segment with preservation of manually entered answers.
- Up to four subtitle lanes, time-range editing and loop playback for overlapping speakers.
- Multiple frames per scene to support observable change and reduce still-image inference.

## Validation

Run npm run lint, npm run build, and node --import tsx --test tests/*.test.ts.
Tests include a mocked Gemini SDK HTTP response, wrong-model routing, malformed results,
silence, overlapping ranges and review warnings. Deepgram tests cover binary upload,
backup keys, mixed-language word labels, millisecond rounding and malformed responses.
Authenticated route tests exercise Deepgram uploads and OpenRouter scene runs with
Deepgram audio even when no Gemini key is configured. Live provider transcription and Vercel
deployment still require the configured keys and a representative audio file.

## API catalog update — 2026-10-26

The model picker, server validation and health endpoints share one model catalog.
Direct Gemini offers 3.8 Flash (default), 4 Argon (flagship) and 3.5 Flash-Lite
(fallback). Gemini audio uses these generateContent-compatible models; dedicated
Transcribe, Live, TTS and image-generation models are not sent to that endpoint.
Saved legacy selections are migrated to current supported equivalents.

Gemini calls retain JSON schemas but omit temperature overrides, following Google's
Gemini 3 migration recommendation. Bounded automatic fallback covers quota errors,
missing models and selected temporary service errors; input/schema errors are not
retried as model failures. Auto Fallback can still be disabled. Backup keys remain
server-only, and the health response only indicates configuration, not verified access.

The Google SDK is updated to 2.31.0 (current npm release checked during the update).
Google and OpenRouter calls have 120-second request timeouts. Deepgram still uses
Nova-3 multilingual prerecorded recognition and remains the default subtitle provider.
Existing key environment variable names remain supported. No deployed secret values
were changed. Account-specific access, billing and live output require deployment testing.

Sources reviewed:
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemini-api/docs/gemini-3
- https://openrouter.ai/api/v1/models
- https://developers.deepgram.com/docs/model
