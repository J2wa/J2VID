import type { SceneAnnotation } from '../types';

type Description = Pick<SceneAnnotation, 'scene_id' | 'narrative_description'>;
export function reviewSceneRepetition(scenes: Description[]): Map<number, string[]> {
  const warnings = new Map<number, string[]>();
  const tokens = scenes.map(s => s.narrative_description.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const add = (index: number, message: string) => warnings.set(scenes[index].scene_id, [...(warnings.get(scenes[index].scene_id) || []), message]);
  const openings = new Map<string, number[]>();
  tokens.forEach((words, i) => {
    if (words.length < 4) return;
    const key = words.slice(0, 4).join(' ');
    openings.set(key, [...(openings.get(key) || []), i]);
  });
  for (const [opening, indexes] of openings) {
    if (indexes.length < 3) continue;
    for (const i of indexes) add(i, `Repeated opening “${opening}” across scenes ${indexes.map(n => scenes[n].scene_id).join(', ')}. Lead with this scene’s visible subject, action or change.`);
  }
  const grams = tokens.map(words => new Set(words.slice(2).map((_, i) => words.slice(i, i + 3).join(' '))));
  for (let i = 0; i < scenes.length; i++) {
    const matches: number[] = [];
    for (let j = 0; j < scenes.length; j++) {
      if (i === j || !tokens[i].length || !tokens[j].length) continue;
      const exact = tokens[i].join(' ') === tokens[j].join(' ');
      const overlap = [...grams[i]].filter(g => grams[j].has(g)).length;
      if (exact || (Math.min(tokens[i].length, tokens[j].length) >= 12 && 2 * overlap / (grams[i].size + grams[j].size) >= 0.8)) matches.push(scenes[j].scene_id);
    }
    if (matches.length) add(i, `Possible copied or near-identical description with scenes ${matches.join(', ')}. Check the snapshot and describe this scene’s own details; do not invent differences.`);
  }
  return warnings;
}
