import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');
const upstream=path.join(root,'research/loongsuite-go-cac400935add57d8219122ba32857b8f55ac6eb1');
const sourceMap=JSON.parse(fs.readFileSync('content/source-snapshot.json','utf8'));
const raw=JSON.parse(fs.readFileSync('content/lab-verification.json','utf8'));
const results={...raw,upstream:{tag:raw.upstream.tag,sha:raw.upstream.sha,go:raw.upstream.go},scope:'本地教学验证，不代表全部业务路径验收。'};
const status=id=>Object.entries(results.labs).filter(([k])=>k.startsWith(id)).map(([k,v])=>`${k}: ${v.status}`).join(' / ');
const labRegistry=[
 {id:'00-start',title:'从普通函数到手动观察',goal:'只用 Go 标准库，理解返回值和执行记录分别解决什么问题。无需先安装 LoongSuite。',command:'cd labs/00-start\ngo run .',expected:'plain result 与 observed result 都是 3，后者额外有 observe: start / end 和耗时；这里只手写记录，没有 OTel Span。',challenge:'把 main 中两处输入都改成 8，比较两条结果与记录中的 result。',answer:'业务动作仍然调用 addOne；增加的代码负责观察。自动插桩要解决的是把类似观察动作重复接入大量调用的工作。'},
 {id:'01-context',title:'上下文不会自动穿过任务交接',goal:'用标准库 context 中的教学标识，比较显式 ctx、新协程、预创建 worker。此处字符串标识不是 OTel Span，真实 Span 在后续实验中验证。',command:'cd labs/01-context\ngo run .',expected:'显式交接能读取 trace-request；Background 没有该值，打印 <root>。',challenge:'让两个请求并发提交任务，分别保存自己的 ctx，检查有没有串值。',answer:'worker 的创建早于任务。应在任务结构中携带 context，而不是依赖创建时闭包。context 是安全共享接口，但你放进 Value 的可变对象仍需同步。'},
 {id:'02-ast',title:'把“插一行”变成结构化改写',goal:'使用 go/parser、go/ast、go/format 解析并为目标 FuncDecl 插入 defer observe()。这是 AST 机制实验，不是 LoongSuite 的完整 trampoline。',command:'cd labs/02-ast\ngo run .',expected:'输出的 Handle 函数内出现 defer observe()；注释/字符串里的同名文本不会变成目标声明。',challenge:'只对一个指定 receiver 的方法命中；让同名普通函数保持不变。',answer:'读取 FuncDecl.Recv 和名称，再修改 Body.List。正则只认识文本，不能稳定区分注释、字符串与语法节点。'},
 {id:'03-toolexec',title:'亲手包装一次真实 Go 编译',goal:'编译 wrapper，再让 go build 的 compiler/linker 经过它；保留标准输入、输出、错误及退出码。',command:'cd labs/03-toolexec\nmkdir -p .bin\ngo build -o .bin/toolexec ./wrapper\nTOOLEXEC_LOG="$PWD/toolexec.log" go build -toolexec="$PWD/.bin/toolexec" -o .bin/app .\n.bin/app',expected:'程序输出 compiled through -toolexec；toolexec.log 中能看到工具版本探测和编译/链接命令。',challenge:'故意让 wrapper 返回非零，观察 go build 是否正确失败；随后恢复。',answer:'-V=full 是版本探测的一部分，不能乱改 stdout。观测日志写文件或 stderr，真实工具路径与剩余参数原样转发。不默认清空全局 GOCACHE。'},
 {id:'04-custom-hook',title:'从 JSON 规则走到真实 OnEnter / OnExit',goal:'固定上游工具为 net/http 调用插入一个自定义 hook，比较普通二进制和插桩二进制。此实验保留原业务结果，不修改网络环境。',command:'cd labs\n# 按 README 构建固定上游工具，替换下面的绝对路径\nOTEL_TOOL=/ABS/PATH/otel ./run-all.sh --with-otel',expected:'普通版本返回 plain-result 42 status 204；真实插桩额外输出 hook-enter method=GET、hook-exit status=204，原结果保持一致。脚本逐项断言输出，失败以非零退出。完整配置与执行记录在实验包。',challenge:'在复制的实验分支中用 SetParam/SetReturnVal 改结果，再增加断言证明它确实影响调用者；最后恢复只读 hook。',answer:'先跑通规则命中、签名、链接和 enter/exit 生命周期，再改行为。只看到 JSON 解析成功或 plain 输出，不代表自动插桩成功。'},
];
if(Object.keys(results.labs).some(k=>k.startsWith('05-otel')))labRegistry.push({id:'05-otel',title:'把教学标识换成真正的 OTel Span',goal:'用内存 exporter 验证 TraceID、ParentSpanID、上下文与采样，不依赖远端 Collector。',command:'cd labs/05-otel\ngo run .',expected:'显式父 context 的 child 同 Trace，Background 新根；传播 carrier 后消费端保留因果。具体断言见实验源码和执行记录。',challenge:'切换为未采样父上下文，观察有效 TraceID 与已导出 Span 的区别。',answer:'Context 中的 SpanContext、SDK 记录和 exporter 输出是三个独立层次，必须分别断言。'});
if(results.labs['06-propagation'])labRegistry.push({id:'06-propagation',title:'亲自提取 W3C、B3 单头与多头',goal:'使用真实 OTel propagator，固定合法 ID，逐项断言冲突输入和旧单头残留。这里模拟载体，没有连接真实网关。',command:'cd labs/06-propagation\ngo run .',expected:'B3 最后覆盖 W3C；有效 B3 单头优先多头；旧单头未清理时 parent 仍旧，清理后连接新的出站 SpanID。相同 TraceID 不保证父节点正确。',challenge:'把 B3 移到 W3C 前，再让两种格式提供不同 TraceID；比较胜出者。',answer:'组合传播器按顺序更新 context。B3 的注入编码只控制写出格式，不会禁止读取单头，也不会自动删除旧头。实验对每一行同时检查 TraceID、SpanID 和远程标志。'});
for(const l of labRegistry)l.status=status(l.id)||'尚未执行';
for(const l of labRegistry){const records=Object.entries(results.labs).filter(([k])=>k.startsWith(l.id));l.output=records.map(([name,r])=>`${name} [${r.status}]\n${r.evidence.join('\n')}`).join('\n\n');}
fs.writeFileSync(path.join(dist,'generated-data.js'),`export const sourceMap = ${JSON.stringify(sourceMap,null,2)};\nexport const labResults = ${JSON.stringify(results,null,2)};\nexport const labRegistry = ${JSON.stringify(labRegistry,null,2)};\n`);
fs.writeFileSync(path.join(dist,'lab-results.json'),JSON.stringify(results,null,2));
const {chapters}=await import(path.join(dist,'chapters.js')+'?'+Date.now());
const {resources,lessonTemplate}=await import(path.join(dist,'resources.js')+'?'+Date.now());
const {zeroSteps,zeroSources}=await import(path.join(dist,'zero.js')+'?'+Date.now());
const {sourceLessons}=await import(path.join(dist,'source-lessons.js')+'?'+Date.now());
const {lessonDemos}=await import(path.join(dist,'lesson-demo.js')+'?'+Date.now());
fs.writeFileSync(path.join(dist,'chapter-template.md'),lessonTemplate+'\n');
fs.writeFileSync(path.join(dist,'guide-authoring-resources.md'),[
 '# 编写学习指南：skill、方法与模板\n\n核对日期：2026-10-27。选择围绕 LoongSuite Go 源码学习目标，未全局安装第三方 skill。\n',
 ...resources.map(r=>`## ${r.name}\n\n类型：${r.kind}\n\n[官方项目](${r.url}) · [原始说明](${r.docs})\n\n适合：${r.fit}\n\n局限：${r.limit}\n\n本指南借鉴：${r.adopt}\n${r.install?'\n可选安装：\n\n```sh\n'+r.install+'\n```\n':''}`),
 '\n## 可复用章节模板\n\n'+lessonTemplate
].join('\n\n'));
const missing=[];if(fs.existsSync(upstream))for(const c of chapters)for(const w of c.walkthrough)if(!fs.existsSync(path.join(upstream,w.file)))missing.push(w.file);
if(missing.length)throw Error('Missing walkthrough files: '+missing.join(','));
const md=['# LoongSuite Go：从原理到二开\n\n基于 v1.15.0 / cac400935add57d8219122ba32857b8f55ac6eb1。网页含交互图解；本文是便于离线检索的正文。\n'];
for(const [i,s]of zeroSteps.entries()){md.push(`\n# 从零 ${i+1}：${s.title}\n\n## ${s.question}\n\n${s.paragraphs.join('\n\n')}\n\n${s.terms.map(t=>'- **'+t.term+'**：'+t.meaning).join('\n')}\n\n### ${s.before.label}\n\n`+'```'+(s.before.language||'go')+'\n'+s.before.code+'\n```\n\n'+`### ${s.after.label}\n\n`+'```'+(s.after.language||'go')+'\n'+s.after.code+'\n```\n\n'+s.caption+`\n\n自问：${s.check.question}\n\n参考解释：${s.check.answer}\n\n带走一句话：${s.takeaway}\n`);}
md.push('\n入门来源：\n'+zeroSources.map(s=>'- ['+s.title+']('+s.url+')').join('\n'));
for(const c of chapters){md.push(`\n# ${c.title}\n\n${c.subtitle}\n\n建议时间：${c.minutes} 分钟\n\n## 学习目标\n${c.outcomes.map(x=>'- '+x).join('\n')}\n`);if(c.bridge)md.push(`\n## 为什么学这一章\n\n你已经知道：${c.bridge.known}\n\n遇到的问题：${c.bridge.problem}\n\n本章的办法：${c.bridge.idea}\n\n${c.bridge.terms.map(t=>'- **'+t.term+'**：'+t.meaning).join('\n')}\n\n${c.bridge.takeaway}\n`);for(const s of c.sections)md.push(`\n## ${s.title}\n\n${s.paragraphs.join('\n\n')}\n${s.code?'\n```'+s.language+'\n'+s.code+'\n```\n':''}${s.note?'\n说明：'+s.note+'\n':''}`);md.push('\n## 源码阅读\n\n'+c.walkthrough.map(w=>`- [${w.file}](${w.url})：${w.task}`).join('\n'));md.push(`\n\n## 练习：${c.lab.title}\n\n${c.lab.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n\`\`\`sh\n${c.lab.command}\n\`\`\`\n\n预期：${c.lab.expected}\n\n挑战：${c.lab.challenge}\n`);for(const q of c.quiz)md.push(`\n问题：${q.q}\n\n${q.options.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n参考答案：${q.answer+1}。${q.explanation}\n`);}
for(const n of sourceMap){const l=sourceLessons[n.id];md.push(`\n# 源码讲解：${l.title}\n\n${l.plain}\n\n为什么需要它：${l.why}\n\n## 本页名词\n\n${l.terms.map(t=>'- **'+t.term+'**：'+t.meaning).join('\n')}\n\n输入：${l.input}\n\n输出：${l.output}\n`);for(const step of l.steps)md.push(`\n## ${step.title}\n\n${step.explanation}\n`+(step.code?'\n```'+(step.language||'text')+'\n'+step.code+'\n```\n':''));md.push('\n## 对应源码\n\n'+l.sourceNotes.map(note=>'`'+note.code+'`：'+note.explanation).join('\n\n')+'\n\n[固定版本源码]('+n.url+')\n\n'+l.pitfalls.map(t=>'- '+t).join('\n')+`\n\n自问：${l.check.question}\n\n参考解释：${l.check.answer}\n`);}
md.push('\n# 每篇文章的动画实例：逐帧文字版\n\n以下是网页教学模拟的可检索记录；不是实际执行 Go 的输出。\n');
for(const [kind,demos]of Object.entries(lessonDemos))for(const [id,demo]of Object.entries(demos)){
 md.push(`\n## ${kind}/${id} · ${demo.title}\n\n${demo.scenario}\n\n${demo.scope}\n`);
 for(const sample of demo.cases){md.push(`\n### 情况：${sample.label}\n\n${sample.summary}\n`);for(const [i,frame]of sample.frames.entries())md.push(`\n#### 画面 ${i+1}：${frame.title}\n\n${frame.explain}\n\n为什么：${frame.why}\n\n${frame.code.label}\n\n`+'```'+frame.code.language+'\n'+frame.code.text+'\n```\n\n'+`现在得到：${frame.result}\n`);md.push('\n'+sample.verdict+'\n');}
}
fs.writeFileSync(path.join(dist,'guide.md'),md.join('\n'));
const moduleFiles=['chapters.js','visuals.js','resources.js','generated-data.js','zero.js','source-lessons.js','source-demos.js','course-demos.js','preprocess-demos.js','motion-map.js','dependency-lesson.js','motion-scene.js','lesson-demo.js','beginner-ui.js','app.js'];
const scripts=moduleFiles.map(f=>fs.readFileSync(path.join(dist,f),'utf8').replace(/^import .*?;\n/gm,'').replace(/^export /gm,'')).join('\n');
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="./style.css">',`<style>${fs.readFileSync(path.join(dist,'style.css'),'utf8').replace(/^@import[^;]+;\n/,'')}</style>`).replace('<script type="module" src="./app.js"></script>',`<script type="module">${scripts.replaceAll('</script>','<\\/script>')}</script>`);
fs.writeFileSync(path.join(dist,'offline.html'),html);
console.log(JSON.stringify({chapters:chapters.length,sourceNodes:sourceMap.length,labs:labRegistry.length,offlineBytes:Buffer.byteLength(html),walkthroughMissing:missing.length}));
