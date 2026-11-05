import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAudioFilename, orderAudioFiles, transcribeAudioFiles} from '../src/utils/audioFiles';

test('suggested filename extracts clip number and original time range',()=>{
 assert.deepEqual(parseAudioFilename('2-00h02m00s-00h04m00s.mp3'), {name:'2-00h02m00s-00h04m00s.mp3',number:2,start:120,end:240});
 assert.equal(parseAudioFilename('part_3-00_04_00-00_06_00.wav').start,240);
 assert.equal(parseAudioFilename('00h02m00s-00h04m00s.mp3').number,null);
});
test('alternate names sort numerically and unnumbered names sort last',()=>{
 const names=['clip-10.wav','zebra.mp3','part_2.mp3','1-00h00m00s-00h02m00s.mp3','alpha.ogg'];
 assert.deepEqual(orderAudioFiles(names.map(name=>({name}))).map(x=>x.file.name),[names[3],names[2],names[0],names[4],names[1]]);
});
test('invalid or incomplete ranges reject before transcription',()=>{
 for(const name of ['1-00h02m00s-00h01m00s.mp3','1-00h70m00s-02h00m00s.mp3','1-00h02m00s.mp3']) assert.throws(()=>parseAudioFilename(name));
});
const fake=async(file:File)=>({subtitles:[{subtitle_id:1,start_time:'00:00:00.500',end_time:'00:00:01.000',type:'Spoken words' as const,text:file.name}],duration:120,parts:2,warnings:[]});
test('sorted clips merge with explicit offsets and unique IDs',async()=>{
 const files=['2-00h02m00s-00h04m00s.mp3','1-00h00m00s-00h02m00s.mp3'].map(name=>new File([],name));
 const result=await transcribeAudioFiles(files,{subtitleProvider:'deepgram'},fake);
 assert.equal(result.subtitles[0].start_time,'00:00:00.500');
 assert.equal(result.subtitles[1].start_time,'00:02:00.500');
 assert.deepEqual(result.subtitles.map(s=>s.subtitle_id),[1,2]);
 assert.equal(result.duration,240);
});
test('untimed clips follow actual durations and explicit gaps are preserved',async()=>{
 const files=['part_3.mp3','2-00h03m00s-00h05m00s.mp3','part_1.mp3'].map(name=>new File([],name));
 const result=await transcribeAudioFiles(files,{subtitleProvider:'deepgram'},fake);
 assert.deepEqual(result.subtitles.map(s=>s.start_time),['00:00:00.500','00:03:00.500','00:05:00.500']);
});
test('overlap stops before submitting conflicting audio',async()=>{
 let calls=0;
 await assert.rejects(transcribeAudioFiles(['1-00h00m00s-00h02m00s.mp3','2-00h01m00s-00h03m00s.mp3'].map(name=>new File([],name)),{subtitleProvider:'deepgram'},async f=>{calls++;return fake(f)}),/starts before/);
 assert.equal(calls,1);
});
test('single timestamped clip receives its original offset and duration mismatch warning',async()=>{
 const result=await transcribeAudioFiles([new File([],'4-01h00m00s-01h03m00s.mp3')],{subtitleProvider:'deepgram'},fake);
 assert.equal(result.subtitles[0].start_time,'01:00:00.500');
 assert.equal(result.warnings.length,1);
});
