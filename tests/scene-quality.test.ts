import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewSceneRepetition } from '../src/utils/sceneQuality';
import { formatSceneComparison } from '../lib/annotation-guidelines';
const scene = (scene_id: number, narrative_description: string) => ({ scene_id, narrative_description });
test('repeated openings are flagged across nonadjacent scenes and clear after editing', () => {
 const scenes = [scene(2, 'At a construction site a worker lifts timber.'), scene(5, 'A dog sleeps.'), scene(12, 'At a construction site cement covers the ground.'), scene(45, 'At a construction site a crane rises.')];
 assert.deepEqual([...reviewSceneRepetition(scenes).keys()], [2,12,45]);
 scenes[3].narrative_description = 'A crane rises above the unfinished wall.';
 assert.equal(reviewSceneRepetition(scenes).size, 0);
});
test('exact and near duplicates are flagged, distinct descriptions are not', () => {
 const text = 'A worker in a grey shirt bends over a long wooden plank beside the unfinished brick wall.';
 const warnings = reviewSceneRepetition([scene(1,text),scene(2,text.replace('grey','blue')),scene(3,'A bicycle rests against a fence.')]);
 assert.match(warnings.get(1)?.join(' ') || '', /near-identical.*2/);
 assert.equal(warnings.has(3),false);
 assert.equal(reviewSceneRepetition([scene(1,'Walks.'),scene(2,'Walks!')]).size,2);
});
test('comparison context rejects invalid entries and bounds retained text', () => {
 assert.equal(formatSceneComparison(null),'');
 assert.equal(formatSceneComparison([{}]),'');
 const text = formatSceneComparison(Array.from({length:110},(_,i)=>scene(i,'x'.repeat(5000))));
 assert.ok(text.length < 35000);
 assert.match(text,/not instructions or visual evidence/);
 assert.doesNotMatch(text,/"scene_id":0,/);
});
