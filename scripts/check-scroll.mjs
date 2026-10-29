import assert from 'node:assert/strict';
import { bindLessonDemos, storyFrameAtReadingLine } from '../dist/lesson-demo.js';

// The selector is deliberately independent of IntersectionObserver.  It receives
// every paragraph's current viewport top and returns the paragraph whose heading
// has crossed the reading line.  This makes upward scrolling deterministic too.
const pick=(tops,line)=>storyFrameAtReadingLine(tops,line);

assert.equal(pick([240,620,1010],100),0,'above the first heading clamps to frame 0');
assert.equal(pick([240,620,1010],239),0,'just before the first heading remains on frame 0');
assert.equal(pick([240,620,1010],240),0,'the first heading is active at its boundary');
assert.equal(pick([240,620,1010],619),0,'the previous frame remains active in the gap');
assert.equal(pick([240,620,1010],620),1,'the second heading becomes active exactly at its boundary');
assert.equal(pick([240,620,1010],800),1,'forward scrolling selects the latest crossed heading');
assert.equal(pick([240,620,1010],1009),1,'just before the third heading remains on frame 1');
assert.equal(pick([240,620,1010],1010),2,'the last heading is active at its boundary');
assert.equal(pick([240,620,1010],5000),2,'below the lesson clamps to the final frame');

// A large jump must not depend on which IntersectionObserver entries changed.
assert.deepEqual(
  [100,700,1300,1900].map(line=>pick([240-line,620-line,1010-line],110)),
  [0,1,2,2],
  'large downward jumps select the frame crossed by the reading line',
);
assert.deepEqual(
  [1900,1300,700,100].map(line=>pick([240-line,620-line,1010-line],110)),
  [2,2,1,0],
  'large upward jumps walk back to the first frame and reset at the top',
);

console.log(JSON.stringify({scrollSelector:'passed',cases:13}));

// A small DOM/event harness exercises the binding itself without a browser or
// a dependency. It catches the original bug: clicking a later frame used to
// leave the observer in a manual state, so returning to the top did not reset it.
const makeBindingFixture=()=>{
  const frameCount=4, tops=[400,800,1200,1600], windowListeners=new Map(), elementListeners=new Map();
  let nextFrame=1, pending=new Map(), cancelled=[], sceneWrites=0;
  const listen=(map,type,fn)=>{if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);};
  const unlisten=(map,type,fn)=>map.get(type)?.delete(fn);
  const dispatch=(map,type,event={})=>{for(const fn of map.get(type)||[])fn(event);};
  const scene={set innerHTML(value){sceneWrites++;this.value=value;},value:''};
  const caption={textContent:''};
  const picture={getBoundingClientRect:()=>({left:0,height:373})};
  const paragraphs={getBoundingClientRect:()=>({left:0})};
  const steps=Array.from({length:frameCount},(_,i)=>({dataset:{storyStep:String(i)},getBoundingClientRect:()=>({top:tops[i]}),classList:{toggle(){}}}));
  const buttons=Array.from({length:frameCount},(_,i)=>({dataset:{storySelect:String(i)},setAttribute(){},removeAttribute(){},closest(){return this;}}));
  const feedback={hidden:true};
  const element={dataset:{lessonDemo:'zero:observe'},querySelector(selector){return ({'.story-picture':picture,'.story-paragraphs':paragraphs,'[data-motion-scene]':scene,'[data-motion-caption]':caption,'[data-story-feedback]':feedback})[selector];},querySelectorAll(selector){if(selector==='[data-story-step]')return steps;if(selector==='[data-story-select]')return buttons;return [];},addEventListener(type,fn){listen(elementListeners,type,fn);},removeEventListener(type,fn){unlisten(elementListeners,type,fn);},contains(){return true;}};
  const root={querySelectorAll:()=>[element]};
  const fakeWindow={innerHeight:763,addEventListener(type,fn){listen(windowListeners,type,fn);},removeEventListener(type,fn){unlisten(windowListeners,type,fn);}};
  globalThis.window=fakeWindow;
  globalThis.getComputedStyle=()=>({top:'64px'});
  globalThis.requestAnimationFrame=fn=>{const id=nextFrame++;pending.set(id,fn);return id;};
  globalThis.cancelAnimationFrame=id=>{cancelled.push(id);pending.delete(id);};
  const flush=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn());};
  const scroll=()=>dispatch(windowListeners,'scroll');
  const click=index=>dispatch(elementListeners,'click',{target:buttons[index]});
  const dispose=bindLessonDemos(root);
  return {tops,windowListeners,elementListeners,flush,scroll,click,dispose,get sceneWrites(){return sceneWrites;},get pendingCount(){return pending.size;},cancelled};
};

const fixture=makeBindingFixture();
fixture.flush(); // initial frame 0 measurement
fixture.click(1);
assert.equal(fixture.sceneWrites,1,'clicking a frame replays its scene');
fixture.tops.splice(0,4,400,800,1200,1600);
fixture.scroll();fixture.flush();
assert.equal(fixture.sceneWrites,2,'a real scroll after a click resumes follow mode and returns to frame 0');
fixture.scroll();fixture.flush();
assert.equal(fixture.sceneWrites,2,'scrolling within the same paragraph does not redraw the SVG');
fixture.tops.splice(0,4,200,400,900,1250);
fixture.scroll();fixture.scroll();
assert.equal(fixture.pendingCount,1,'multiple scroll events coalesce into one animation frame');
fixture.flush();
assert.equal(fixture.sceneWrites,3,'the coalesced scroll advances to the next crossed paragraph');
fixture.scroll();
assert.equal(fixture.pendingCount,1,'a pending frame exists before disposal');
fixture.dispose();
assert.equal(fixture.pendingCount,0,'disposal cancels a pending animation frame');
assert.ok(fixture.cancelled.length>0,'disposal calls cancelAnimationFrame');
assert.equal(fixture.windowListeners.get('scroll')?.size||0,0,'disposal removes the scroll listener');
assert.equal(fixture.windowListeners.get('resize')?.size||0,0,'disposal removes the resize listener');

console.log(JSON.stringify({binding:'passed',clickScrollReset:'passed',rafCoalescing:'passed',cleanup:'passed'}));
