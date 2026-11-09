import fs from 'node:fs';
// A separate process evaluates content modules in English without changing the Chinese build.
globalThis.location = { search: '?lang=en', href: 'https://example.com/?lang=en' };
const { chapters } = await import('../dist/chapters.js');
const { zeroSteps, zeroSources } = await import('../dist/zero.js');
const { sourceLessons } = await import('../dist/source-lessons.js');
const { sourceMap, labRegistry } = await import('../dist/generated-data.js');
const { lessonDemos } = await import('../dist/lesson-demo.js');
const { officialGroups, officialUrl, coverageLabels } = await import('../dist/official-docs.js');
const { resources, lessonTemplate } = await import('../dist/resources.js');
const fence=(text,language='text')=>'\n```'+language+'\n'+text+'\n```\n';
const md=['# LoongSuite Go: from fundamentals to custom instrumentation\n\nIndependent, community-maintained optional learning material. The official documentation is the authority for current usage and compatibility. Source walkthroughs and recorded evidence use the pinned v1.15.0 / cac400935add57d8219122ba32857b8f55ac6eb1 snapshot; these versions are not universal requirements. Original code snippets and captured outputs keep their source text.\n'];
for(const[i,s]of zeroSteps.entries())md.push(`\n# Step ${i+1}: ${s.title}\n\n${s.goal}\n\n${s.beforeYouRead}\n\n## ${s.question}\n\n${s.paragraphs.join('\n\n')}\n\n${s.terms.map(t=>'- **'+t.term+'**: '+t.meaning).join('\n')}\n\n### ${s.before.label}\n${fence(s.before.code,s.before.language||'go')}\n### ${s.after.label}\n${fence(s.after.code,s.after.language||'go')}\n${s.caption}\n\nCheck: ${s.check.question}\n\nExplanation: ${s.check.answer}\n\nTakeaway: ${s.takeaway}\n`);
md.push('\n# Read alongside the official documentation\n');
for(const g of officialGroups)for(const p of g.pages)md.push(`\n## ${g.title}: ${p.title}\n\n[Official page](${officialUrl(p)}) · ${coverageLabels[p.coverage][0]}\n\n${p.says}\n\nWhere beginners get stuck: ${p.gap}\n\nContinue reading: ${p.read.map(([label])=>label).join(' → ')}\n\nCheck: ${p.question}\n\nExplanation: ${p.answer}\n`);
md.push('\nIntroductory sources:\n'+zeroSources.map(s=>'- ['+s.title+']('+s.url+')').join('\n'));
for(const c of chapters){
 md.push(`\n# ${c.title}\n\n${c.subtitle}\n\nSuggested time: ${c.minutes} minutes\n\n## Learning goals\n${c.outcomes.map(x=>'- '+x).join('\n')}\n`);
 if(c.bridge)md.push(`\n## Why this chapter\n\nAlready familiar: ${c.bridge.known}\n\nProblem: ${c.bridge.problem}\n\nApproach: ${c.bridge.idea}\n\n${c.bridge.terms.map(t=>'- **'+t.term+'**: '+t.meaning).join('\n')}\n\n${c.bridge.takeaway}\n`);
 for(const s of c.sections)md.push(`\n## ${s.title}\n\n${s.paragraphs.join('\n\n')}\n${s.code?fence(s.code,s.language):''}${s.note?'\nNote: '+s.note+'\n':''}`);
 md.push('\n## Source walkthrough\n\n'+c.walkthrough.map(w=>`- [${w.file}](${w.url}): ${w.task}`).join('\n'));
 md.push(`\n## Lab: ${c.lab.title}\n\n${c.lab.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n${fence(c.lab.command,'sh')}\nExpected: ${c.lab.expected}\n\nChallenge: ${c.lab.challenge}\n`);
 for(const q of c.quiz)md.push(`\nQuestion: ${q.q}\n\n${q.options.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nAnswer: ${q.answer+1}. ${q.explanation}\n`);
}
for(const n of sourceMap){const l=sourceLessons[n.id];md.push(`\n# Source: ${l.title}\n\n${l.plain}\n\nWhy: ${l.why}\n\n## Terms\n\n${l.terms.map(t=>'- **'+t.term+'**: '+t.meaning).join('\n')}\n\nInput: ${l.input}\n\nOutput: ${l.output}\n`);for(const step of l.steps)md.push(`\n## ${step.title}\n\n${step.explanation}\n`+(step.code?fence(step.code,step.language):''));md.push('\n## Match the source\n\n'+l.sourceNotes.map(note=>'`'+note.code+'`: '+note.explanation).join('\n\n')+'\n\n[Pinned source]('+n.url+')\n\n'+l.pitfalls.map(x=>'- '+x).join('\n')+`\n\nCheck: ${l.check.question}\n\nExplanation: ${l.check.answer}\n`);}
md.push('\n# Frame-by-frame teaching examples\n\nThese examples are teaching models; the browser does not execute Go.\n');
for(const[kind,demos]of Object.entries(lessonDemos))for(const[id,demo]of Object.entries(demos)){
 md.push(`\n## ${kind}/${id}: ${demo.title}\n\n${demo.scenario}\n\n${demo.scope}\n`);
 for(const sample of demo.cases){md.push(`\n### Case: ${sample.label}\n\n${sample.summary}\n`);for(const[i,frame]of sample.frames.entries())md.push(`\n#### Frame ${i+1}: ${frame.title}\n\n${frame.explain}\n\nWhy: ${frame.why}\n\n${frame.code.label}\n${fence(frame.code.text,frame.code.language)}\nResult: ${frame.result}\n`);md.push('\n'+sample.verdict+'\n');}
}
md.push('\n# Runnable labs\n');for(const lab of labRegistry)md.push(`\n## ${lab.title}\n\n${lab.goal}\n${fence(lab.command,'sh')}\nExpected: ${lab.expected}\n\nChallenge: ${lab.challenge}\n\nExplanation: ${lab.answer}\n`);
fs.writeFileSync('dist/guide.en.md',md.join('\n'));
fs.writeFileSync('dist/chapter-template.en.md',lessonTemplate.trimEnd()+'\n');
fs.writeFileSync('dist/guide-authoring-resources.en.md','# Guide authoring resources\n\n'+resources.map(r=>`## ${r.name}\n\n[Project](${r.url}) · [Documentation](${r.docs})\n\nFit: ${r.fit}\n\nLimits: ${r.limit}\n\nApproach adopted: ${r.adopt}\n`).join('\n'));
console.log(JSON.stringify({englishGuide:'generated',introductorySteps:zeroSteps.length,chapters:chapters.length,sourceLessons:sourceMap.length,labs:labRegistry.length}));
