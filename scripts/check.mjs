import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { chapters } from '../dist/chapters.js';
import { sourceMap, labRegistry, labResults } from '../dist/generated-data.js';
import { zeroSteps } from '../dist/zero.js';
import { sourceLessons } from '../dist/source-lessons.js';
import { renderZeroPage, renderSourcePage, renderChapterBridge } from '../dist/beginner-ui.js';
const sha='cac400935add57d8219122ba32857b8f55ac6eb1';
const ids=new Set(chapters.map(c=>c.id));
assert.equal(ids.size,chapters.length,'duplicate chapter id');
for(const c of chapters){
 assert.equal(c.quiz.length,2,`${c.id}: expected two questions`);
 assert.equal(c.checkpoint.length,3,`${c.id}: expected three capability checks`);
 assert.ok(c.sections.length>=4,`${c.id}: missing explanations`);
 assert.ok(c.bridge?.problem && c.bridge?.idea && c.bridge.terms.length>=3,`${c.id}: missing beginner bridge`);
 for(const q of c.quiz){assert.equal(q.options.length,3);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3);}
 for(const w of c.walkthrough)assert.ok(w.url.includes(sha),`${c.id}: source link not pinned`);
 for(const p of c.prerequisites)if(ids.has(p))assert.ok(chapters.findIndex(x=>x.id===p)<chapters.indexOf(c),`${c.id}: forward prerequisite ${p}`);
}
assert.equal(sourceMap.length,20);
for(const s of sourceMap){assert.ok(s.url.includes(sha));assert.ok(s.snippet.length>0);assert.ok(s.line>0);}
for(const name of ['app','chapters','visuals','resources','generated-data','zero','source-lessons','source-demos','course-demos','preprocess-demos','motion-map','dependency-lesson','motion-scene','lesson-demo','beginner-ui'])execFileSync(process.execPath,['--check',`dist/${name}.js`]);
for(const file of ['offline.html','guide.md','assets/labs.zip','chapter-template.md','guide-authoring-resources.md'])assert.ok(fs.statSync(`dist/${file}`).size>0,file);
assert.ok(!fs.readFileSync('dist/offline.html','utf8').includes('src="./app.js"'),'offline page has module dependency');
// The offline concatenation must also parse as one module (individual checks miss duplicate names).
const offline=fs.readFileSync('dist/offline.html','utf8');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'loongsuite-offline-check-'));
try{const js=path.join(temp,'offline.mjs');fs.writeFileSync(js,offline.match(/<script type="module">([\s\S]*?)<\/script>/)[1]);execFileSync(process.execPath,['--check',js]);}finally{fs.rmSync(temp,{recursive:true,force:true});}
assert.equal(zeroSteps.length,7);
const validRoute=url=>/^#\/start\/[1-7]$/.test(url)||sourceMap.some(n=>url===`#/source/${n.id}`)||chapters.some(c=>url===`#/learn/${c.id}`)||url==='#/labs';
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const helpers={escape:esc,inline:esc,codeBlock:s=>`<pre>${esc(s)}</pre>`};
for(const [i,s]of zeroSteps.entries()){
 assert.ok(s.paragraphs.length>=2 && s.check?.answer);
 assert.ok(s.goal&&s.beforeYouRead,`missing learning goal or starting point ${i+1}`);
 if(s.destination)assert.ok(validRoute(s.destination.href),s.destination.href);
 assert.ok(renderZeroPage(String(i+1),helpers).includes(esc(s.question)),`missing zero step ${i+1}`);
 assert.ok(renderZeroPage(String(i+1),helpers).includes(esc(s.goal)),`missing visible learning goal ${i+1}`);
}
for(const n of sourceMap){const l=sourceLessons[n.id];assert.ok(l,`missing source lesson ${n.id}`);assert.ok(l.steps.length>=3 && l.sourceNotes.length>=2 && l.terms.length>=3);for(const link of [...l.prerequisites,l.next])assert.ok(validRoute(link.href),`broken learning route ${link.href}`);const html=renderSourcePage(n,l,sourceMap,helpers);assert.ok(html.includes('class="raw-source"'),`missing source disclosure ${n.id}`);assert.ok(!html.includes('class="raw-source" open'),'raw source should not overwhelm the default reading');}
for(const c of chapters)assert.ok(renderChapterBridge(c,helpers).includes(esc(c.bridge.problem)));
assert.ok(fs.readFileSync('dist/style.css','utf8').includes('[hidden]{display:none!important}'),'hidden controls may render');
for(const [id,r]of Object.entries(labResults.labs))assert.equal(r.status,'passed',`${id}: unresolved lab status`);
console.log(JSON.stringify({beginnerSteps:zeroSteps.length,chapterBridges:chapters.length,questions:chapters.reduce((n,c)=>n+c.quiz.length,0),sourceLessons:sourceMap.length,labs:labRegistry.length,offlineModule:'passed',checks:'passed'}));

await import('./check-demos.mjs');
await import('./check-scroll.mjs');
await import('./check-dependency-exercise.mjs');

await import('./check-teaching-deps.mjs');
