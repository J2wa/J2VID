import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseResultFile, mergeImportedResult, emptyResult, readResultFile } from '../src/utils/resultFiles';
import { createResultPdf, readResultPdf } from '../src/utils/resultPdf';
const scenes = { ...emptyResult(), scenes: [{scene_id:7,narrative_description:'José holds a sign reading “Café”.',raw_description:'Original guidance',initial_background:'Kitchen',revision_history:['Earlier draft']}] };
const subtitles = { ...emptyResult(), subtitles: [{subtitle_id:2,start_time:'00:02:05.406',end_time:'00:02:11.695',type:'Spoken words',text:'Hello — kumusta?'}] };
test('legacy JSON, scoped exports and arrays import without losing scene details', () => {
 const file = parseResultFile(scenes,'scenes');
 assert.deepEqual(parseResultFile(file,'scenes'),file);
 assert.deepEqual(parseResultFile(scenes.scenes,'scenes').result.scenes,scenes.scenes);
 assert.deepEqual(file.result.scenes,scenes.scenes);
});
test('import replaces selected result type and preserves other work', () => {
 const old = { ...scenes, subtitles: parseResultFile(subtitles,'subtitles').result.subtitles };
 const imported = parseResultFile([{scene_id:12,narrative_description:'A new scene.'}],'scenes');
 const merged = mergeImportedResult(old,imported);
 assert.deepEqual(merged.subtitles,old.subtitles);
 assert.equal(merged.scenes[0].scene_id,12);
 assert.equal(old.scenes[0].scene_id,7);
});
test('rejects wrong kind, duplicate IDs, bad timings and unsafe images', () => {
 assert.throws(()=>parseResultFile(parseResultFile(scenes,'scenes'),'subtitles'),/workspace/);
 assert.throws(()=>parseResultFile([...scenes.scenes,...scenes.scenes],'scenes'),/unique/);
 assert.throws(()=>parseResultFile([{...subtitles.subtitles[0],end_time:'00:00:00.000'}],'subtitles'),/after/);
 assert.throws(()=>parseResultFile([{...subtitles.subtitles[0],start_time:'00:80:00.000'}],'subtitles'),/Invalid/);
 assert.throws(()=>parseResultFile([{...scenes.scenes[0],start_image:'https://example.com/image.png'}],'scenes'),/embedded/);
});
test('PDF and JSON round trips preserve exact scene and subtitle data', async () => {
 const font = new Uint8Array(await readFile('public/fonts/DejaVuSans.ttf'));
 await mkdir('/tmp/aces-result-tests',{recursive:true});
 for (const [kind,result] of [['scenes',scenes],['subtitles',subtitles]] as const) {
   const file = parseResultFile(result,kind);
   const bytes = await createResultPdf(file,font);
   assert.deepEqual(parseResultFile(await readResultPdf(bytes),kind),file);
   assert.deepEqual(await readResultFile(new File([JSON.stringify(file)],'test.json'),kind),file);
   assert.deepEqual(await readResultFile(new File([bytes],'test.pdf'),kind),file);
   await writeFile('/tmp/aces-result-tests/'+kind+'.pdf',bytes);
 }
 const long = parseResultFile([{scene_id:1,narrative_description:'Long description with useful details. '.repeat(700)}],'scenes');
 await writeFile('/tmp/aces-result-tests/long.pdf',await createResultPdf(long,font));
});
test('malformed and unrelated imports report an error', async () => {
 await assert.rejects(readResultFile(new File(['broken'],'bad.json'),'scenes'),/valid JSON/);
 await assert.rejects(readResultPdf(new Uint8Array([0,1])),/damaged/);
});
