// Shared by generation, revision and audio transcription; never add empty observations.
export const SCENE_GUIDELINES = `
Write natural English running commentary that gives blind and low-vision viewers a
complete, vivid understanding of the segment, rather than a broad summary.
Every segment's narrative_description must address the S.P.A.C.E.S framework:
S — Setting: Where am I? Establish the physical location, visible layout, indoor/outdoor
context and time of day only when supported. Begin with a concise setting anchor such as
"Outside on a city street in daylight" or "Inside a warehouse under overhead lights".
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
a checklist or a forced sentence count. Start with setting and perspective where natural,
identify the subject, follow its action and changes chronologically, and weave in the
environment. Vary the phrasing so each segment reads like a clear human description.
Check all six aspects before returning each description. Ground every detail in supplied
footage, snapshots, audio or action notes. If an aspect cannot be established, do not invent
a fact to fill it: use the observable context or state and flag uncertainty for review.
In particular, a single still cannot establish movement, chronology or change; only
describe a transition when footage, multiple frames or reliable action context supports it.
Do not write "not provided", "not specified", "no changes", or other empty filler.
Start with the relevant setting/viewpoint; identify subjects and describe actions in the
order they occur, using precise verbs. Use full sentences with varied, plain phrasing.
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

STYLE EXAMPLE ONLY — never copy these facts into unrelated footage:
In daylight on a city street, a person in a red raincoat walks across a pedestrian
crossing while speaking on a phone. A medium view keeps them centred as the viewpoint
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
