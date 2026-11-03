import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSceneBatches } from '../src/utils/sceneBatches';
const inputs = (count: number) => Array.from({length:count},(_,i)=>({id:String(i),scene_id:i+1,start_image:`image-${i}`,raw_description:`draft-${i}`}));
for (const count of [1,5,6,11]) test(`${count} snapshots are requested sequentially in batches of five`,async()=>{
  const sizes:number[]=[];let active=0; const progress:string[]=[];
  const request:typeof fetch=async(_url,init)=>{
    assert.equal(active++,0); const {scenesInput,initialBackground}=JSON.parse(String(init?.body));
    sizes.push(scenesInput.length);assert.equal(initialBackground,'Park');
    await new Promise(resolve=>setTimeout(resolve,2));active--;
    return Response.json({suitability:{status:'suitable'},scenes:scenesInput.map((s:any)=>({scene_id:s.scene_id,narrative_description:'Walks.'})).reverse()});
  };
  const result=await generateSceneBatches(inputs(count),{initialBackground:'Park',durationSeconds:count*15},s=>progress.push(s),request);
  assert.deepEqual(sizes,Array.from({length:Math.ceil(count/5)},(_,i)=>Math.min(5,count-i*5)));
  assert.deepEqual(result.scenes.map(s=>s.scene_id),inputs(count).map(s=>s.scene_id));
  assert.equal(result.scenes[count-1].start_image,`image-${count-1}`);
  assert.match(progress[0],/Batch 1 of/);
});
test('failed batch stops further requests',async()=>{
 let calls=0;await assert.rejects(generateSceneBatches(inputs(11),{},()=>{},async(_url,init)=>{
  calls++;const {scenesInput}=JSON.parse(String(init?.body));
  return calls===2?Response.json({error:'Rate limit'},{status:429}):Response.json({suitability:{status:'suitable'},scenes:scenesInput.map((s:any)=>({...s,narrative_description:'Walks.'}))});
 }),/Batch 2 of 3 failed: Rate limit/);assert.equal(calls,2);
});
test('incomplete or renumbered batch is rejected',async()=>{
 await assert.rejects(generateSceneBatches(inputs(6),{},()=>{},async()=>Response.json({suitability:{status:'suitable'},scenes:[]})),/incomplete/);
});
