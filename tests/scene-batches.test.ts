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


test('preview progress only marks validated batches ready, retaining failed scenes as active', async () => {
 const states: unknown[] = [];
 let calls = 0;
 await assert.rejects(generateSceneBatches(inputs(6), {}, () => {}, async (_url, init) => {
   calls++;
   const { scenesInput } = JSON.parse(String(init?.body));
   if (calls === 2) return Response.json({ suitability: { status: 'suitable' }, scenes: [] });
   return Response.json({ suitability: { status: 'suitable' }, scenes: scenesInput.map((s: any) => ({ ...s, narrative_description: 'Walks.' })) });
 }, state => states.push(state)), /incomplete/);
 assert.deepEqual(states, [
   { completed: 0, activeStart: 0, activeEnd: 5, total: 6 },
   { completed: 5, activeStart: 5, activeEnd: 5, total: 6 },
   { completed: 5, activeStart: 5, activeEnd: 6, total: 6 }
 ]);
});

test('completed descriptions are published before the next batch resolves and survive a later failure', async () => {
  const published: any[] = [];
  let calls = 0;
  let release!: () => void;
  let entered!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const secondStarted = new Promise<void>(resolve => { entered = resolve; });
  const generation = generateSceneBatches(inputs(11), {durationSeconds:165}, () => {}, async (_url, init) => {
    calls++;
    if(calls === 2) { entered(); await pending; return Response.json({error:'Rate limit'}, {status:429}); }
    const {scenesInput} = JSON.parse(String(init?.body));
    return Response.json({suitability:{status:'suitable'}, scenes:scenesInput.map((s:any)=>({scene_id:s.scene_id,narrative_description:`Description ${s.scene_id}`}))});
  }, undefined, result => published.push(result));
  await secondStarted;
  assert.equal(published.length, 1);
  assert.deepEqual(published[0].scenes.map((s:any)=>s.scene_id), [1,2,3,4,5]);
  assert.equal(published[0].scenes[0].narrative_description, 'Description 1');
  assert.equal(published[0].scenes[0].start_image, 'image-0');
  release();
  await assert.rejects(generation, /Batch 2 of 3 failed/);
  assert.equal(calls, 2);
  assert.equal(published[0].scenes.length, 5);
});

test('batch snapshots are cumulative and earlier snapshots stay unchanged', async () => {
  const published: any[] = [];
  const result = await generateSceneBatches(inputs(6), {}, () => {}, async (_url, init) => {
    const {scenesInput} = JSON.parse(String(init?.body));
    return Response.json({suitability:{status:'suitable'},scenes:scenesInput.map((s:any)=>({...s,narrative_description:'Ready'}))});
  }, undefined, result => published.push(result));
  assert.deepEqual(published.map(p=>p.scenes.length), [5,6]);
  assert.deepEqual(published[1].scenes, result.scenes);
});

test('later batches receive previous descriptions without previous images', async () => {
 let calls = 0;
 await generateSceneBatches(inputs(6), {}, () => {}, async (_url, init) => {
   const body = JSON.parse(String(init?.body));
   assert.equal(body.previousSceneDescriptions.length, calls++ === 0 ? 0 : 5);
   for (const previous of body.previousSceneDescriptions) {
     assert.deepEqual(Object.keys(previous).sort(), ['narrative_description','scene_id']);
     assert.equal(previous.narrative_description, 'Visible action ' + previous.scene_id);
   }
   return Response.json({suitability:{status:'suitable'},scenes:body.scenesInput.map((s:any)=>({scene_id:s.scene_id,narrative_description:'Visible action '+s.scene_id}))});
 });
});
