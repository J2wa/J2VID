// Shared by generation, revision and audio transcription; never add empty observations.
export const SCENE_GUIDELINES = `
Write natural English descriptions of video events for a reader who cannot see the footage.
Every segment's narrative_description must address the S.P.A.C.E.S framework:
S — Setting: Where am I? Establish the visible place, layout and spatial context.
P — Perspective: How am I seeing it / the viewpoint? Describe the observable framing,
distance, angle and viewpoint movement when supported.
A — Action: What is happening? State who does what using precise, active verbs.
C — Change: What changed? Describe the supported development in action, position,
focus, viewpoint or state, preserving the order of events within this segment.
E — Environment: What else is happening? Include relevant surroundings, background
activity, lighting, weather or contextual sound when supported by the supplied inputs.
S — Subject: Who or what do I notice? Identify the main people, animals or objects
through distinguishing visible traits and their positions.
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
Each scene must describe its own content. Group coherent actions rather than every shot.
Split at meaningful changes of setting, action, central subject or narrative. Cover the
video when actual footage and timings are supplied; preserve user boundaries. Never invent
temporal movement, event order, scene boundaries or unseen changes from a single still.
Translate supplied Tagalog/Taglish guidance into natural English; treat notes as guidance,
not proof of facts contradicted by the visual evidence. Flag uncertainty for human review.
Assess meaningful visual development. Return unsuitable static, repetitive, unplayable,
unusable or burned-in-subtitle footage and give a concrete reason. Silent footage and
noisy audio are not alone reasons to discard. Classify by the closest supported category.
`;

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
