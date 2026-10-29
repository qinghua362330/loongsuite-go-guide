import assert from 'node:assert/strict';
import {lessonDemos,renderLessonDemo,renderDemoFrame} from '../dist/lesson-demo.js';
import {getMotionMap,renderMotionScene} from '../dist/motion-scene.js';
import {sourceMap} from '../dist/generated-data.js';
import {zeroSteps} from '../dist/zero.js';
import {chapters} from '../dist/chapters.js';

const expected={source:sourceMap.map(s=>s.id),zero:zeroSteps.map(s=>s.id),chapter:chapters.map(c=>c.id)};
let demoCount=0,frameCount=0,caseCount=0;
for(const [kind,ids]of Object.entries(expected)){
  assert.deepEqual(Object.keys(lessonDemos[kind]).sort(),[...ids].sort(),`${kind}: missing or unexpected example`);
  for(const id of ids){
    const demo=lessonDemos[kind][id];demoCount++;
    assert.ok(demo.title&&demo.scenario&&demo.scope&&demo.terms.length>=2,`${kind}/${id}: lacks concrete setup`);
    assert.ok(demo.lanes.length>=3&&demo.cases.length>=1);
    assert.equal(new Set(demo.cases.map(c=>c.id)).size,demo.cases.length);
    assert.equal(demo.question.options.length,3);
    assert.ok(Number.isInteger(demo.question.answer)&&demo.question.answer>=0&&demo.question.answer<3);
    for(const [caseIndex,sample]of demo.cases.entries()){
      caseCount++;
      assert.ok(sample.frames.length>=4&&sample.summary&&sample.verdict);

      for(const [i,frame]of sample.frames.entries()){
        frameCount++;
        assert.ok(frame.title&&frame.explain&&frame.why&&frame.result,`${id}: empty explanation`);
        assert.ok(Number.isInteger(frame.focus)&&frame.focus>=0&&frame.focus<demo.lanes.length,`${id}: invalid lane`);
        assert.ok(frame.code.text&&frame.code.label&&frame.panels.length>=1,`${id}: no visible example`);
        const lines=frame.code.text.split('\n').length;
        assert.ok(frame.code.highlight.length>0&&frame.code.highlight.every(n=>Number.isInteger(n)&&n>=1&&n<=lines),`${id}: line highlight outside example`);
        for(const panel of frame.panels)for(const item of panel.items)assert.ok(['new','active','muted','error','ok'].includes(item.state));
        if(i)assert.notEqual(frame.code.text,sample.frames[i-1].code.text,`${id}: static code disguised as next step`);
        assert.ok(renderDemoFrame(demo,{caseIndex,frameIndex:i}).includes('story-code'));
        const map=getMotionMap(kind,id,caseIndex,i);
        assert.ok(map?.current?.note,`${kind}/${id}: missing illustrated step ${i}`);
        const nodeIds=new Set(map.nodes.map(n=>n.id));
        assert.equal(nodeIds.size,map.nodes.length);
        for(const node of map.nodes)assert.ok(node.x>=76&&node.x<=604&&node.y>=33&&node.y<=307,`${id}: diagram node outside picture`);
        for(const edge of map.edges)assert.ok(nodeIds.has(edge.from)&&nodeIds.has(edge.to));
        for(const key of [...map.current.visible,...map.current.active])assert.ok(nodeIds.has(key),`${id}: unknown active object`);
        for(const edge of [...map.current.moving,...(map.current.broken||[]),...(map.current.skipped||[])])assert.ok(map.edges[edge],`${id}: unknown animated transfer`);
        const picture=renderMotionScene(kind,id,caseIndex,i);
        assert.ok(picture.includes('<svg')&&picture.includes('<desc'),`${id}: missing actual illustration`);
        if(map.current.moving.length&&map.mode!=='version'&&!((map.current.broken?.length||0)+(map.current.skipped?.length||0)===map.current.moving.length))assert.ok(picture.includes('animateMotion'),`${id}: no moving object in active scene`);
      }

    }
    const html=renderLessonDemo(kind,id);
    assert.ok(!html.includes('data-demo-action')&&!html.includes('自动播放'),'player controls must not replace explanation');
    assert.ok(html.includes(`data-lesson-demo="${kind}:${id}"`)&&html.includes('data-story-feedback')&&html.includes('data-motion-scene')&&html.includes('data-story-step'));
  }
}
assert.ok(lessonDemos.source.preprocess.cases.length===3,'Preprocess needs one/two/three-round comparison');
// Prevent regressions in teaching claims identified by the independent source review.
assert.ok(!JSON.stringify(lessonDemos).includes('call.Return('));
assert.ok(lessonDemos.source['go-mod'].cases[0].frames[2].code.text.includes('replace github.com/alibaba/loongsuite-go/pkg/rules/http =>'));
assert.ok(lessonDemos.chapter.compatibility.cases[0].frames[1].code.text.includes('isSameOtelhttpClientOperation'));
console.log(JSON.stringify({interactiveExamples:demoCount,cases:caseCount,frames:frameCount,animatedDiagrams:'passed',narrativeRendering:'passed'}));
