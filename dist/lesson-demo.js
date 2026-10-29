import { sourceDemos } from './source-demos.js';
import { zeroDemos, chapterDemos } from './course-demos.js';
import { focusDemos } from './preprocess-demos.js';
import { getMotionMap, renderMotionScene } from './motion-scene.js';
import { renderDependencyExercise, bindDependencyExercise } from './dependency-lesson.js';

export const lessonDemos={source:{...sourceDemos,...focusDemos},zero:zeroDemos,chapter:chapterDemos};
const demoEsc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderDemoFrame(demo,state) {
  const frame=demo.cases[state.caseIndex].frames[state.frameIndex],marks=new Set(frame.code.highlight||[]);
  return `<p class="story-explain">${demoEsc(frame.explain)}</p><div class="story-code"><div>${demoEsc(frame.code.label)}</div><pre tabindex="0"><code>${frame.code.text.split('\n').map((line,i)=>`<span class="story-code-line ${marks.has(i+1)?'changed':''}"><span class="story-line-no" aria-hidden="true">${i+1}</span>${demoEsc(line)||' '}</span>`).join('')}</code></pre></div><p class="story-why"><b>为什么：</b>${demoEsc(frame.why)}</p><p class="story-result"><b>所以：</b>${demoEsc(frame.result)}</p>`;
}

function storyBody(kind,id,demo,caseIndex) {
  const sample=demo.cases[caseIndex],map=getMotionMap(kind,id,caseIndex,0);
  // Reserve the tallest caption so changing scenes cannot move the reading line.
  const captionReserve=sample.frames.map((_,i)=>`<span class="story-caption-reserve" aria-hidden="true">${demoEsc(getMotionMap(kind,id,caseIndex,i).current.note)}</span>`).join('');
  return `<div class="story-layout"><figure class="story-picture"><div class="story-picture-label"><span class="story-live-symbol" aria-hidden="true">●</span>跟着例子看变化</div><div data-motion-scene>${renderMotionScene(kind,id,caseIndex,0)}</div><figcaption><span data-motion-caption>${demoEsc(map.current.note)}</span>${captionReserve}</figcaption>${kind==='zero'&&id==='deps'?'':'<p class="story-legend">实线框：已接入　虚线框：尚未接入<br>移动的小块：本步的代码、上下文或动作正在交接</p>'}<p class="story-follow">向下阅读，图会跟随段落变化。也可点击段落标题。</p></figure><div class="story-paragraphs">${sample.frames.map((frame,i)=>`<section class="story-step ${i===0?'current':''}" data-story-step="${i}"><h3><button type="button" data-story-select="${i}" ${i===0?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${demoEsc(frame.title)}</button></h3>${renderDemoFrame(demo,{caseIndex,frameIndex:i})}</section>`).join('')}</div></div><p class="story-verdict">${demoEsc(sample.verdict)}</p>`;
}

export function renderLessonDemo(kind,id) {
  const demo=lessonDemos[kind]?.[id];if(!demo)return '';
  const uid=`lesson-demo-${kind}-${id}`;
  const dependencyLesson=kind==='zero'&&id==='deps';
  return `<section class="lesson-demo ${dependencyLesson?'lesson-demo-dependency':''}" id="${uid}" data-lesson-demo="${demoEsc(kind+':'+id)}" aria-labelledby="${uid}-title"><header class="story-header"><div class="eyebrow">一个实例，一边看图，一边讲清楚</div><h2 id="${uid}-title">${demoEsc(demo.title)}</h2><p>${demoEsc(demo.scenario.replace('先选“完整三轮”，每次点下一步，关注黄色标出的新增内容。','下面一边读，一边看包和规则怎样沿箭头交接。'))}</p></header><details class="story-vocabulary" ${kind==='zero'?'':'open'}><summary>${kind==='zero'?'遇到不认识的词，再展开这里':'先认识例子里的几个东西'}</summary><dl>${demo.terms.map(t=>`<div><dt>${demoEsc(t.term)}</dt><dd>${demoEsc(t.meaning)}</dd></div>`).join('')}</dl></details>${demo.cases.length>1?`<div class="story-cases" role="group" aria-label="对比另一种情况">${demo.cases.map((c,i)=>`<button type="button" data-story-case="${i}" aria-pressed="${i===0}">${demoEsc(c.label)}</button>`).join('')}</div>`:''}<div data-story-body>${storyBody(kind,id,demo,0)}</div>${dependencyLesson?renderDependencyExercise():''}<fieldset class="story-question"><legend>${demoEsc(demo.question.prompt)}</legend>${demo.question.options.map((o,i)=>`<label><input type="radio" name="${uid}-answer" value="${i}" data-story-answer>${demoEsc(o)}</label>`).join('')}<p data-story-feedback hidden role="status"></p></fieldset><p class="story-scope">${demoEsc(demo.scope)} 图中使用教学模拟，网页不执行 Go。</p></section>`;
}

// Choose the paragraph at the reading line, using all positions in either direction.
export function storyFrameAtReadingLine(tops,readingTop) {
  let index=0;
  for(let i=1;i<tops.length;i++){
    if(tops[i]>readingTop)break;
    index=i;
  }
  return index;
}

export function bindLessonDemos(root) {
  const cleanups=[];
  root.querySelectorAll('[data-lesson-demo]').forEach(element=>{
    const [kind,id]=element.dataset.lessonDemo.split(':'),demo=lessonDemos[kind]?.[id];if(!demo)return;
    let caseIndex=0,frameIndex=0,pendingFrame=0,disposed=false;
    let resizeObserver=null;
    const select=(index,replay=false)=>{
      if(!demo.cases[caseIndex].frames[index]||(!replay&&index===frameIndex))return;
      frameIndex=index;
      element.querySelector('[data-motion-scene]').innerHTML=renderMotionScene(kind,id,caseIndex,index);
      element.querySelector('[data-motion-caption]').textContent=getMotionMap(kind,id,caseIndex,index).current.note;
      element.querySelectorAll('[data-story-step]').forEach(node=>node.classList.toggle('current',Number(node.dataset.storyStep)===index));
      element.querySelectorAll('[data-story-select]').forEach(button=>{if(Number(button.dataset.storySelect)===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    };
    const followScroll=()=>{
      pendingFrame=0;
      if(disposed)return;
      const picture=element.querySelector('.story-picture'),paragraphs=element.querySelector('.story-paragraphs');
      const pictureRect=picture.getBoundingClientRect(),paragraphRect=paragraphs.getBoundingClientRect();
      const stacked=Math.abs(pictureRect.left-paragraphRect.left)<15;
      const pictureStyle=getComputedStyle(picture);
      const stickyTop=parseFloat(pictureStyle.top)||0;
      const readingTop=Math.min(window.innerHeight-48,pictureStyle.position==='static'?110:stickyTop+(stacked?pictureRect.height:0)+24);
      const tops=Array.from(element.querySelectorAll('[data-story-step]'),node=>node.getBoundingClientRect().top);
      select(storyFrameAtReadingLine(tops,readingTop));
    };
    const scheduleFollowing=()=>{
      if(!disposed&&!pendingFrame)pendingFrame=requestAnimationFrame(followScroll);
    };
    const watchLayout=()=>{
      resizeObserver?.disconnect();
      if(typeof ResizeObserver!=='undefined'){
        resizeObserver=new ResizeObserver(scheduleFollowing);
        resizeObserver.observe(element);
        resizeObserver.observe(element.querySelector('.story-picture'));
      }
      scheduleFollowing();
    };
    const click=event=>{
      const button=event.target.closest('button');if(!button||!element.contains(button))return;
      if(button.dataset.storySelect!==undefined){
        // A click replays this scene; the next actual scroll resumes following.
        cancelAnimationFrame(pendingFrame);pendingFrame=0;
        select(Number(button.dataset.storySelect),true);
      }
      if(button.dataset.storyCase!==undefined){
        const index=Number(button.dataset.storyCase);if(!demo.cases[index])return;
        caseIndex=index;frameIndex=0;
        element.querySelector('[data-story-body]').innerHTML=storyBody(kind,id,demo,index);
        element.querySelectorAll('[data-story-case]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.storyCase)===index)));
        element.querySelectorAll('[data-story-answer]').forEach(input=>input.checked=false);
        element.querySelector('[data-story-feedback]').hidden=true;watchLayout();
      }
    };
    const change=event=>{
      if(!event.target.matches('[data-story-answer]'))return;
      const answer=Number(event.target.value),feedback=element.querySelector('[data-story-feedback]');
      feedback.hidden=false;feedback.textContent=`${answer===demo.question.answer?'✓ 判断正确。':'这里还差一步。'} ${demo.question.feedback?.[answer]||demo.question.explanation}`;
    };
    element.addEventListener('click',click);element.addEventListener('change',change);watchLayout();
    cleanups.push(bindDependencyExercise(element));
    window.addEventListener('scroll',scheduleFollowing,{passive:true});
    window.addEventListener('resize',scheduleFollowing);
    cleanups.push(()=>{
      disposed=true;cancelAnimationFrame(pendingFrame);resizeObserver?.disconnect();
      element.removeEventListener('click',click);element.removeEventListener('change',change);
      window.removeEventListener('scroll',scheduleFollowing);window.removeEventListener('resize',scheduleFollowing);
    });
  });
  return ()=>cleanups.forEach(clean=>clean());
}
