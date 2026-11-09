import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { detectLanguage, normalizeLanguage, languageUrl } from '../dist/i18n.js';
assert.equal(normalizeLanguage('en-US'),'en');
assert.equal(normalizeLanguage('zh-CN'),'zh');
assert.equal(normalizeLanguage('english'),'zh');
assert.equal(detectLanguage('?lang=en','zh'),'en');
assert.equal(detectLanguage('','en'),'en');
assert.equal(detectLanguage('?lang=zh','en'),'zh');
assert.equal(detectLanguage('?lang=unsupported','en'),'zh');
const switched=new URL(languageUrl('en','https://example.com/guide/?x=1#/source/deps'));
assert.equal(switched.searchParams.get('lang'),'en');assert.equal(switched.searchParams.get('x'),'1');assert.equal(switched.hash,'#/source/deps');
const sample=`
 globalThis.location={search:'?lang='+process.argv[1],href:'https://example.com/?lang='+process.argv[1]};
 const modules={
  chapters:['chapters.js',['chapters']],zero:['zero.js',['zeroSteps','zeroSources']],resources:['resources.js',['resources','glossary','lessonTemplate']],
  sourceLessons:['source-lessons.js',['sourceLessons']],sourceDemos:['source-demos.js',['sourceDemos']],courseDemos:['course-demos.js',['zeroDemos','chapterDemos']],
  preprocessDemos:['preprocess-demos.js',['focusDemos']],motionMaps:['motion-map.js',['motionMaps']],generated:['generated-data.js',['sourceMap','labResults','labRegistry']],official:['official-docs.js',['officialSite','coverageLabels','officialGroups']]
 };
 const values={};for(const[domain,[file,names]]of Object.entries(modules)){const m=await import('./dist/'+file);values[domain]=Object.fromEntries(names.map(n=>[n,m[n]]))}
 const {officialPages,officialUrl}=await import('./dist/official-docs.js');
 console.log(JSON.stringify({values,urls:officialPages.map(officialUrl)}));
`;
const load=language=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',sample,language],{encoding:'utf8',maxBuffer:12*1024*1024}));
const zh=load('zh'),en=load('en');const missing=[],changedCode=[];let translated=0;
const protectedLeaf=path=>['id','stage','href','path','url','command','snippet','symbol','evidence','code'].includes(path.at(-1))||(path.at(-1)==='output'&&path[0]!=='sourceLessons')||(path.at(-1)==='text'&&path.at(-2)==='code')||path.includes('evidence');
function compare(a,b,path=[]){
 assert.equal(typeof b,typeof a,path.join('.'));
 if(typeof a==='string'){
  if(protectedLeaf(path)){if(a!==b)changedCode.push(path.join('.'));return}
  if(/[\u3400-\u9fff]/u.test(a)){
   if(a===b||/[\u3400-\u9fff]/u.test(b))missing.push({path:path.join('.'),zh:a,en:b});else translated++;
   assert.ok(b.trim(),path.join('.'));
  }
 }else if(Array.isArray(a)){
  assert.ok(Array.isArray(b));assert.equal(a.length,b.length,path.join('.'));a.forEach((v,i)=>compare(v,b[i],[...path,i]));
 }else if(a&&typeof a==='object'){
  assert.deepEqual(Object.keys(a),Object.keys(b),path.join('.'));for(const[k,v]of Object.entries(a))compare(v,b[k],[...path,k]);
 }else assert.equal(b,a,path.join('.'));
}
compare(zh.values,en.values);
assert.deepEqual(changedCode,[],'Executable examples, evidence, source paths or machine IDs changed during translation');
if(process.env.I18N_REPORT)fs.writeFileSync(process.env.I18N_REPORT,JSON.stringify({translated,missing,changedCode},null,2)+'\n');
assert.equal(missing.length,0,`${missing.length} English narrative leaves are missing or retain Chinese: ${missing.slice(0,5).map(x=>x.path).join(', ')}`);
assert.ok(en.urls.every(url=>url.startsWith('https://alibaba.github.io/loongsuite-go/')&&!url.includes('/zh/')),'English official references must select the upstream English documentation');
console.log(JSON.stringify({i18n:'passed',translatedNarrativeLeaves:translated,codeAndEvidence:'unchanged',shapeAndAnswers:'unchanged',languageSwitch:'route preserved',officialEnglishLinks:en.urls.length}));
