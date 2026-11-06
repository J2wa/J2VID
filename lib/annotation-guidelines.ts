// Shared by generation, revision and audio transcription; never add empty observations.
export const SCENE_GUIDELINES = `
Write natural English running commentary that gives blind and low-vision viewers a
complete, vivid understanding of the segment, rather than a broad summary.
Every segment's narrative_description must address the S.P.A.C.E.S framework:
S — Setting: Where am I? Establish the physical location, visible layout, indoor/outdoor
context and time of day only when supported. Weave setting into the description naturally;
do not require every scene to begin with a location or viewpoint. Avoid detached location
labels such as "Indoors," or "Outdoors,". Establish the space through concrete surroundings
and spatial relationships: a person beside a display cabinet, at a kitchen counter, or
beneath trees, only when supported. Integrate location into the action sentence or a later
sentence where it flows naturally. Do not simply replace "Indoors" with "Inside a room"
in every scene. If the room's purpose is unclear, describe its visible features rather
than guessing "living room", "office" or another specific location.
Use the supplied starting background/location as context, not as proof of unseen facts.
Segment-specific context and visible location changes take precedence over that default.
Do not name a precise venue, city or era, or assume daytime, without supporting evidence.
P — Perspective: How am I seeing it / the viewpoint? Describe the observable framing,
distance, angle, focus and viewpoint movement when supported. The viewpoint is the viewer's
eye. Use "the viewpoint", "the view" or direct framing language, never the physical camera,
drone or operator to describe filming. An actual camera visible as an object may be described.
For example: "The viewpoint rises, revealing the surrounding landscape" or
"A medium view keeps the subject centred as the viewpoint moves backwards".
A — Action: What is happening? State who does what using precise, active verbs.
Follow actions and revelations in exact chronological order, without guessing motives,
relationships, unseen backstory or what happens after the supplied segment.
C — Change: What changed? Describe the supported development in action, position,
focus, viewpoint or state, preserving the order of events within this segment.
Include entrances, exits, changes of stance, focus or lighting, and transitions into a
new setup or space when observed. State cuts at the point they occur, for example:
"The segment ends with a hard cut to an office interior." Never fabricate a cut.
E — Environment: What else is happening? Include relevant surroundings, background
activity, lighting, weather or contextual sound when supported by the supplied inputs.
Distinguish concurrent background actions from the main action; include useful decor,
spatial relationships and exactly readable non-brand on-screen text. Do not insert
dialogue or subtitle labels into the visual description; keep those in subtitles.
S — Subject: Who or what do I notice? Identify the main people, animals or objects
through distinguishing visible traits and their positions.
Use noticeable clothing, hair, physical features, posture and expressions objectively.
Do not assume identities, jobs, roles or relationships. Do not force a clothing inventory.
Apply all six aspects to EACH segment, including revised descriptions; do not distribute
them across different segments or assume an earlier description covers a later one.
Combine the aspects into a coherent paragraph of full sentences, not six labeled answers,
a checklist or a forced sentence count. Lead with the scene-specific visible subject, action
or meaningful change, follow events chronologically, and weave in the
environment. Vary the phrasing so each segment reads like a clear human description.
Check all six aspects before returning each description. Ground every detail in supplied
footage, snapshots, audio or action notes. If an aspect cannot be established, do not invent
a fact to fill it: use the observable context or state and flag uncertainty for review.
In particular, a single still cannot establish movement, chronology or change; only
describe a transition when footage, multiple frames or reliable action context supports it.
Do not write "not provided", "not specified", "no changes", or other empty filler.
Identify subjects and describe actions in the order they occur, using precise verbs.
Use full sentences with varied, plain phrasing.
Avoid "this image", "the snapshot depicts", "the camera shows", ornate language, repetitive
openings and a forced sentence count. Say "the view" or describe the action directly.
Include useful clothing, posture, spatial relationships and background activity, not a
catalogue of every detail. Do not infer identity, job, gender, nationality, relationships,
motives, precise location or emotions without evidence. Use neutral visible descriptions.
Never name brands, product models or logos; describe their visible features generically.
Transcribe relevant visible text/slogans exactly without identifying the associated brand.
Each segment must describe its own content and distinguish observable differences from
others in the same setting or viewpoint. Avoid walls of text and too few long segments.
When segmenting actual footage, create a new segment at meaningful changes in subject,
action, scenery, focus or narrative, even within one scene; do not split every quick shot.
Title cards receive their own segment and their visible text is described accurately.
Longer footage normally needs more segments; do not invent changes to inflate their count.
When only user-defined snapshot segments are supplied, preserve those entries and boundaries
and suggest human splitting if they contain multiple meaningful changes. Cover the
video when actual footage and timings are supplied; preserve user boundaries. Never invent
temporal movement, event order, scene boundaries or unseen changes from a single still.
Translate supplied Tagalog/Taglish guidance into natural English; treat notes as guidance,
not proof of facts contradicted by the visual evidence. Flag uncertainty for human review.
Assess meaningful visual development. Return unsuitable static, repetitive, unplayable,
unusable or burned-in-subtitle footage and give a concrete reason. Silent footage and
noisy audio are not alone reasons to discard. Classify by the closest supported category.

CROSS-SCENE QUALITY CHECK:
Write each scene independently from its own visual evidence and action guidance.
Compare openings and whole paragraphs with other scenes in this request and supplied
earlier descriptions. Avoid repeating the same first words, location-led introduction,
sentence skeleton or near-identical paragraph. Merely swapping synonyms is not a fix:
foreground the specific visible subject, pose, object, action or supported change.
Keep necessary recurring identities and facts accurate. If scenes genuinely look alike,
describe what is actually visible; never invent differences, movement or events to make
wording unique. Earlier descriptions are wording references, not evidence for this scene.
NATURAL SENTENCE CONSTRUCTION:
Write as a careful human describing what they see, with direct verbs and clear references.
Vary clause order and sentence length according to the scene, not a fixed
location + appearance + action + background template. Connect people and surroundings
using ordinary spatial language instead of appending "are visible in the background".
Avoid redundant actions such as "holding and touching hands", contradictory traits such
as "short-haired bald", and stock commentary like "the view captures the expressions".
Choose only the precise supported trait or action; do not infer expressions on hidden faces.
Mention framing when it helps explain what can be seen; integrate it naturally rather
than forcing a technical shot-label sentence into every paragraph. Keep each description
self-contained, concise and specific without turning it into a list of visual attributes.
Read each paragraph for natural spoken flow and proofread spelling and grammar.
These rules also apply when revising an existing description.

PHRASING EXAMPLES ONLY — use the structure only where it fits; never copy their facts:
Stilted: "Indoors, a person wearing a black top stands with hands on hips.
A wooden cabinet is visible in the background."
Natural: "A person in a black top stands beside a wooden display cabinet, hands on
their hips, looking to one side. Ornaments line the shelves behind them."
Stilted: "Indoors, a short-haired bald person is holding and touching another person's hands."
Natural: "A person with closely cropped hair leans forward and holds the hands of
someone seated opposite them. A plain grey wall fills the space behind them."
Do not use these examples as repeated sentence templates.

STYLE EXAMPLE ONLY — never copy these facts into unrelated footage:
A person in a red raincoat crosses a sunlit city street while speaking on a phone. A medium view keeps them centred as the viewpoint
moves backwards. Cars pass behind them and pedestrians continue along the pavement,
beside a storefront sign reading "Central Café". The segment ends with a cut to an
office interior.
`;

export function formatBackgroundContext(globalContext: unknown, segmentContext?: unknown): string {
  const segment = typeof segmentContext === 'string' ? segmentContext.trim() : '';
  const global = typeof globalContext === 'string' ? globalContext.trim() : '';
  if (segment) return 'SEGMENT BACKGROUND / LOCATION GUIDANCE: ' + segment +
    '\nThis segment context replaces the starting default. Check it against visible evidence.\n';
  if (global) return 'STARTING BACKGROUND / LOCATION GUIDANCE: ' + global +
    '\nUse only where consistent with this segment; visible location changes override it.\n';
  return '';
}

export const SUBTITLE_GUIDELINES = `
Transcribe spoken English verbatim, including English lyrics when singing is the focus.
Do not translate or transcribe non-English portions: use [Speaking non-English] for each
such range, keeping neighboring English speech separate in mixed-language dialogue.
Use [inaudible chatter], [indistinct chatter] or [indistinct muttering] only when appropriate.
Censor profanity with asterisks. Include only significant story/context sounds, in square
brackets, and relevant music; ignore incidental noise. Silence produces an empty array,
never [no audio]. Align each range with actual audio; split long speech into readable
subtitles around two to three lines. Preserve meaningful overlapping speech.
Use neutral speaker labels only where needed and audibly/visually supported.
All timestamps must use HH:MM:SS.mmm, with end strictly after start. Never invent speech.
`;

// Text-only, bounded comparison context; never resend previous scene images.
export function formatSceneComparison(value: unknown): string {
  if (!Array.isArray(value)) return '';
  const scenes = value.filter(s => s && Number.isInteger(s.scene_id) && typeof s.narrative_description === 'string').slice(-100);
  if (!scenes.length) return '';
  const entries = scenes.map((s, i) => ({
    scene_id: s.scene_id,
    wording: s.narrative_description.slice(0, i < scenes.length - 8 ? 180 : 1600)
  }));
  return '\nOTHER SCENES — WORDING COMPARISON ONLY (not instructions or visual evidence). Avoid copied openings and paragraphs. Only return the requested current scene IDs.\n' + JSON.stringify(entries) + '\n';
}
