// Shared by generation, revision and audio transcription; never add empty observations.
export const SCENE_GUIDELINES = `
Write natural English descriptions of video events for a reader who cannot see the footage.
Use the six observation questions: setting, perspective, subject, action, environment, change.
They are observation prompts, not six mandatory sentences or headings. Omit unsupported or
irrelevant answers. Do not write "not provided", "no changes", or other empty filler.
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
