import assert from 'node:assert/strict';
import { bindDependencyExercise, dependencyExerciseResult, renderDependencyScene } from '../dist/dependency-lesson.js';
import { zeroDemos } from '../dist/course-demos.js';

// The exercise is a teaching simulation. Actual Go behavior is tested separately.
for(const [required,located,ready] of [[false,false,false],[false,true,false],[true,false,false],[true,true,true]]) {
  const result=dependencyExerciseResult(required,located);
  assert.equal(result.ready,ready);
  assert.ok(result.message.length>20,'feedback must explain the missing step');
}
const inputs={require:{checked:false},replace:{checked:false}};
const run={hidden:true},feedback={textContent:''},output={hidden:true,textContent:''},listeners=new Map();
const exercise={
  querySelector(selector){return {'[data-dependency-require]':inputs.require,'[data-dependency-replace]':inputs.replace,'[data-dependency-action="run"]':run,'[data-dependency-feedback]':feedback,'[data-dependency-output]':output}[selector];},
  addEventListener(type,fn){listeners.set(type,fn);},
  removeEventListener(type,fn){assert.equal(listeners.get(type),fn);listeners.delete(type);}
};
const dispose=bindDependencyExercise({querySelector:()=>exercise});
const action=value=>listeners.get('click')({target:{closest:()=>({dataset:{dependencyAction:value}})}});
action('build');assert.equal(run.hidden,true);assert.match(feedback.textContent,/还没有声明/);
inputs.require.checked=true;listeners.get('change')();action('build');assert.equal(run.hidden,true);assert.match(feedback.textContent,/本题是离线教学/);
inputs.replace.checked=true;listeners.get('change')();action('build');assert.equal(run.hidden,false);assert.equal(output.hidden,true);
action('run');assert.equal(output.hidden,false);assert.equal(output.textContent,'观察记录: FindRoom\n语聊房间');
inputs.require.checked=false;listeners.get('change')();assert.equal(run.hidden,true);assert.equal(output.hidden,true);
action('run');assert.equal(output.hidden,true,'changing configuration invalidates the previously built program');
action('build');assert.match(feedback.textContent,/只告诉了 Go 去哪里找/);
dispose();assert.equal(listeners.size,0,'route changes must remove exercise listeners');

assert.match(renderDependencyScene(2),/构建失败：缺少依赖/);
assert.match(renderDependencyScene(3),/原来的 go.mod 增加 require/);
assert.match(renderDependencyScene(4),/观察记录: FindRoom\n语聊房间/);
for(const demo of Object.values(zeroDemos))assert.equal(demo.question.feedback.length,3,'every wrong answer needs specific corrective feedback');
console.log(JSON.stringify({dependencyExercise:'passed',configurationCases:4,buildBeforeRun:'passed',configurationReset:'passed',beginnerQuizFeedback:'passed'}));
