// A concrete teaching model, not LoongSuite's generated hook implementation.
const dependencySceneStates=[
  {status:'原程序可以运行',config:'go.mod：只有原来的项目说明',command:'./demo',output:'语聊房间',note:'只调用 FindRoom，不需要 observer。'},
  {status:'新增了一行调用',config:'go.mod：尚未声明需要 observer',command:'下一步：试着执行 go build',output:'新调用需要 observer.Record 的实现。',note:'代码里出现一个新名字，不代表 Go 已经找得到它。'},
  {status:'构建失败：缺少依赖',config:'go.mod：尚未声明需要 observer',command:'go build -o demo .',output:'no required module provides package\nexample.com/observer',note:'错误停在编译阶段，程序还没有运行。'},
  {status:'补齐依赖后构建成功',config:'原来的 go.mod 增加 require + 本地 replace',command:'go build -o demo .',output:'构建成功；此时还没有观察记录。',note:'找到外部代码后，才能把它一起编进程序。'},
  {status:'运行时才出现记录',config:'业务代码 + observer 代码已经一起构建',command:'./demo',output:'观察记录: FindRoom\n语聊房间',note:'原房间名仍然返回，额外增加了一条执行记录。'}
];
const dependencyEsc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderDependencyScene(index) {
  const state=dependencySceneStates[index],added=index>0,ready=index>=3,failed=index===2;
  const uid='dependency-teaching';
  const path=index===4?'M 160 24 L 520 24':'M 520 24 L 160 24';
  return `<div class="dependency-scene" data-dependency-stage="${index}"><div class="dependency-status ${failed?'failed':ready?'ready':''}">${dependencyEsc(state.status)}</div><div class="dependency-files"><section><h4>业务 main.go · 节选</h4><pre><code>func FindRoom(id int) string {
<span class="dependency-new ${added?'added':''}">${added?'  observer.Record("FindRoom")':'  // 这里原来没有记录调用'}</span>
  return "语聊房间"
}</code></pre></section><section class="dependency-library ${added?'needed':''}"><h4>外部库 observer</h4><pre><code>func Record(name string) {
  fmt.Println("观察记录:", name)
}</code></pre><span>${ready?'✓ 构建已能找到它':added?'代码已提供，业务尚未接入':'这份库原来没有被使用'}</span></section></div><svg class="dependency-bridge" viewBox="0 0 680 58" role="img" aria-labelledby="${uid}-title ${uid}-desc"><title id="${uid}-title">${dependencyEsc(state.status)}</title><desc id="${uid}-desc">${dependencyEsc(state.note)}</desc><defs><marker id="${uid}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="${failed?'#a7442e':'#638448'}"/></marker></defs><path d="${path}" class="dependency-route ${added?'shown':''} ${ready?'ready':''} ${failed?'failed':''}" marker-end="url(#${uid}-arrow)"/>${added&&!ready?'<circle cx="340" cy="24" r="12" class="dependency-stop"/><text x="340" y="29" text-anchor="middle" class="dependency-stop-label">?</text>':''}${ready?`<g class="motion-carrier"><rect x="-54" y="-11" width="108" height="22" rx="5"/><text text-anchor="middle" y="4">${index===4?'调用 Record':'Record 的实现'}</text><animateMotion path="${path}" dur="1.6s" repeatCount="2"/></g>`:''}<text x="340" y="53" text-anchor="middle" class="dependency-arrow-note">${index===4?'FindRoom 先调用 Record，再返回房间名':ready?'这份代码现在能一起参与构建':added?'新调用需要这份代码，但还没有接通':'先看业务；下一段会增加记录调用'}</text></svg><div class="dependency-config">${dependencyEsc(state.config)}</div><div class="dependency-terminal ${failed?'failed':''}"><div>$ ${dependencyEsc(state.command)}</div><pre>${dependencyEsc(state.output)}</pre></div></div>`;
}

export function dependencyExerciseResult(required,located) {
  if(!required)return {ready:false,message:located?'你只告诉了 Go 去哪里找 observer，却没声明项目需要它。勾选 require，再检查。':'业务已经 import observer，但 go.mod 还没有声明这个依赖。先勾选 require。'};
  if(!located)return {ready:false,message:'require 已经声明需要谁。本题是离线教学，observer 的源码已放在相邻目录，还要用 replace 指向那份代码。'};
  return {ready:true,message:'教学推演：构建成功，尚未运行。两项分别补上了“需要谁”和“到哪里找”。现在再运行程序，观察输出。'};
}

export function renderDependencyExercise() {
  return `<section class="dependency-exercise" data-dependency-exercise><div class="eyebrow">轮到你：修复同一个小程序</div><h3>代码已经 import observer，怎样让离线构建通过？</h3><p>本题已在业务项目外准备好 observer 源码。你只需补充<strong>业务原来的那份 go.mod</strong>。这里是浏览器里的教学推演，不会执行 Go。</p><label><input type="checkbox" data-dependency-require> 声明需要它：<code>require example.com/observer v0.0.0</code></label><label><input type="checkbox" data-dependency-replace> 指向现成源码：<code>replace example.com/observer =&gt; ../observer</code></label><div class="dependency-actions"><button type="button" data-dependency-action="build">检查构建</button><button type="button" data-dependency-action="run" hidden>运行生成的程序</button></div><p data-dependency-feedback role="status">先选你认为缺少的内容，再检查构建。</p><pre data-dependency-output hidden></pre><details><summary>对照真实 Go 实验结果</summary><p>同一组教学代码已在本机真实验证：缺依赖时构建失败；补齐后构建成功；执行生成的程序才输出下面两行。此实验未运行 LoongSuite，也未请求 业务项目。</p><pre>观察记录: FindRoom
语聊房间</pre></details></section>`;
}

export function bindDependencyExercise(element) {
  const exercise=element.querySelector('[data-dependency-exercise]');
  if(!exercise)return ()=>{};
  let built=false;
  const run=exercise.querySelector('[data-dependency-action="run"]'),feedback=exercise.querySelector('[data-dependency-feedback]'),output=exercise.querySelector('[data-dependency-output]');
  const reset=()=>{built=false;run.hidden=true;output.hidden=true;feedback.textContent='配置已改变。重新检查这次构建是否具备所需代码。';};
  const click=event=>{
    const action=event.target.closest('[data-dependency-action]')?.dataset.dependencyAction;
    if(action==='build'){
      const result=dependencyExerciseResult(exercise.querySelector('[data-dependency-require]').checked,exercise.querySelector('[data-dependency-replace]').checked);
      built=result.ready;run.hidden=!built;output.hidden=true;feedback.textContent=result.message;
    }
    if(action==='run'&&built){output.hidden=false;output.textContent='观察记录: FindRoom\n语聊房间';feedback.textContent='运行后才产生记录；语聊房间仍是原来的业务结果。你修复的是编译依赖，没有把查询执行两遍。';}
  };
  exercise.addEventListener('change',reset);exercise.addEventListener('click',click);
  return ()=>{exercise.removeEventListener('change',reset);exercise.removeEventListener('click',click);};
}
