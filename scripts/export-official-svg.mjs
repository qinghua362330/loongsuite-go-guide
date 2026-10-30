// 把“从零开始”的图解导出为可独立播放的 SVG，供 LoongSuite Go 官方文档的新手指南嵌入。
// 位置、连线和每一步的可见/高亮/流动关系复用 dist/motion-map.js；文字按官方新手页重写为中英文。
// 用法：node scripts/export-official-svg.mjs <输出目录> [--check]
import fs from 'node:fs';
import path from 'node:path';
import { motionMaps } from '../dist/motion-map.js';

const out = process.argv[2];
const check = process.argv.includes('--check');
if (!out || out.startsWith('--')) throw Error('usage: node scripts/export-official-svg.mjs <output-dir> [--check]');
if (!check) fs.mkdirSync(out, { recursive: true });

const STEP = 5.5; // 留出读完说明文字的时间

// 官方页的动画是独立图片。局部调整布局，避免沿用网页布局时的交叉线，
// 并明确普通构建与插桩构建是两种选择，后者不接收前者的产物。
const maps = structuredClone(motionMaps.zero);
maps.observe.nodes.find(n => n.id === 'many').y = 65;
maps.observe.stages.forEach((stage, i) => { stage.edges = [[0], [1, 2], [1, 2, 3], [4, 5]][i]; });
maps.observe.edges[4].labelAt = { x: 260, y: 155 };
maps.observe.edges[5].labelAt = { x: 495, y: 195 };
maps.build.edges[1].from = 'n0';
maps.deps.stages.forEach((stage, i) => {
  // 原项目从第一步起就有 go.mod；改变的是清单内容，不是新建文件。
  if (!stage.visible.includes('config')) stage.visible.push('config');
  stage.edges = [[], [0], [0], [1], [0]][i];
});

// 每个图解的中英文文字：nodes[id] = [标签, 说明]，edges 与 notes 按原数据顺序。
const texts = {
  observe: {
    zh: {
      title: '给 FindRoom 加上前后观察动作',
      nodes: { caller: ['调用者', '想知道结果与耗时'], fn: ['FindRoom(42)', '原函数只调用一次'], start: ['time.Now()', '新增：记下开始时间'], end: ['Since(start)', '新增：计算并输出耗时'], many: ['otel 工具', '构建时接入观察动作'] },
      edges: ['原调用', '调用前', '继续原函数', '返回后', '自动接入进入动作', '自动接入退出动作'],
      notes: ['最初只能得到返回值 room-42，没有耗时记录。', '调用前用 time.Now() 记下开始时间，再执行一次原函数。', '函数返回后计算 time.Since(start)，输出耗时。', '工具要把类似的前后动作，自动接到很多目标函数上。']
    },
    en: {
      title: 'Adding observation around FindRoom',
      nodes: { caller: ['Caller', 'wants result + duration'], fn: ['FindRoom(42)', 'still called once'], start: ['time.Now()', 'new: record start'], end: ['Since(start)', 'new: compute + print'], many: ['otel tool', 'wires hooks at build time'] },
      edges: ['original call', 'before', 'continue', 'after return', 'auto: on enter', 'auto: on exit'],
      notes: ['At first you only get the return value room-42, with no timing.', 'Record the start time with time.Now(), then run the original function once.', 'After it returns, compute time.Since(start) and print the duration.', 'The tool wires the same before/after actions into many target functions.']
    }
  },
  packages: {
    zh: {
      title: 'import 写的是路径，Go 怎样找到 room 目录',
      nodes: { module: ['go.mod', '路径前缀 → demo/'], main: ['main.go', 'package main'], room: ['room/find.go', 'package room'], call: ['room.Find(42)', '返回房间名'] },
      edges: ['定位 room/', 'import', '调用'],
      notes: ['磁盘上有 main.go 和 room/find.go；先分清真实位置与 import 路径。', 'package room 给代码分组，但还没说明 example.com/demo 对应哪里。', 'go.mod 声明 example.com/demo 对应 demo/；加上 /room 就找到 demo/room/。', 'main 的 import 找到本地 room 包，调用 room.Find(42)。']
    },
    en: {
      title: 'An import is a path: how Go finds room/',
      nodes: { module: ['go.mod', 'prefix → demo/'], main: ['main.go', 'package main'], room: ['room/find.go', 'package room'], call: ['room.Find(42)', 'returns the room name'] },
      edges: ['locate room/', 'import', 'call'],
      notes: ['On disk there are main.go and room/find.go. A folder is not yet an import path.', 'package room groups the code, but nothing says where example.com/demo lives.', 'go.mod maps example.com/demo to demo/; adding /room gives demo/room/.', 'The import in main resolves to the local room package and calls room.Find(42).']
    }
  },
  gomod: {
    zh: {
      title: '同一份 go.mod：我是谁，我需要谁',
      nodes: { project: ['demo/go.mod', '当前项目的一份文件'], identity: ['module', '我是谁'], require: ['require', '我需要谁'], code: ['main.go', '实际 import 与调用'] },
      edges: ['声明自己', '需要外部模块', '同一份文件'],
      notes: ['module 行声明当前模块的路径，也就是“我是谁”。', '源码要使用另一个模块的代码，这才形成依赖。', 'require 把外部依赖写进同一份 go.mod。', 'require 只是声明，不是函数调用；运行时才执行源码里的调用。']
    },
    en: {
      title: 'One go.mod: who I am, what I need',
      nodes: { project: ['demo/go.mod', "this project's file"], identity: ['module', 'who I am'], require: ['require', 'what I need'], code: ['main.go', 'the actual import + call'] },
      edges: ['declares itself', 'needs a module', 'same file'],
      notes: ['The module line declares the path of the current module: "who I am".', 'The source code uses code from another module; that creates a dependency.', 'require records the external dependency in the same go.mod.', 'require is a declaration, not a call. Calls in the code run at run time.']
    }
  },
  build: {
    zh: {
      title: '两段时间：构建与运行',
      nodes: { n0: ['main.go', 'FindRoom 源码'], n1: ['go build', '普通构建作对照'], n2: ['otel go build', '准备依赖、加工输入'], n3: ['./demo', '请求到来才执行观察'] },
      edges: ['普通构建', '插桩构建对照', '运行请求'],
      notes: ['源码只是文件里的文字。', '普通 go build 生成原来的程序。', 'otel go build 在编译前准备依赖，并加入观察代码。', '启动插桩后的程序，请求到来时才执行观察动作。']
    },
    en: {
      title: 'Two moments: build time and run time',
      nodes: { n0: ['main.go', 'FindRoom source'], n1: ['go build', 'plain build to compare'], n2: ['otel go build', 'prepare deps, rewrite'], n3: ['./demo', 'observes on requests'] },
      edges: ['plain build', 'instrumented build', 'handle requests'],
      notes: ['Source code is just text in files.', 'A plain go build produces the original program.', 'otel go build prepares dependencies and adds observation code before compiling.', 'Start the instrumented program; observation runs only when requests arrive.']
    }
  },
  hooks: {
    zh: {
      title: '规则找位置，hook 做动作',
      nodes: { rule: ['规则', '找谁：RoundTrip'], enter: ['OnEnter hook', '进入时执行'], fn: ['RoundTrip(req)', '执行原函数体'], exit: ['OnExit hook', '返回时执行'] },
      edges: ['命中后绑定', '先执行', '再执行'],
      notes: ['规则告诉工具：找到本页示例中的 RoundTrip 方法。', '调用目标方法时，先执行 OnEnter hook。', '然后执行原来的函数体。', '函数返回时，再执行 OnExit hook；本例只观察，不改返回值。']
    },
    en: {
      title: 'The rule finds the place; hooks do the work',
      nodes: { rule: ['Rule', 'what: RoundTrip'], enter: ['OnEnter hook', 'runs on entry'], fn: ['RoundTrip(req)', 'original function body'], exit: ['OnExit hook', 'runs on return'] },
      edges: ['bind on match', 'first', 'then'],
      notes: ['The rule finds the RoundTrip method used in this page.', 'When the target is called, the OnEnter hook runs first.', 'Then the original function body runs.', 'On return, the OnExit hook runs. This example observes without changing the result.']
    }
  },
  deps: {
    zh: {
      title: '多了一行调用，为什么编译不过',
      nodes: { business: ['FindRoom', 'demo 的业务代码'], observer: ['observer.Record', 'demo 外的模块'], config: ['demo/go.mod', '补上 require + replace'] },
      detailsByStage: { config: ['原文件，未声明 observer', '原文件，未声明 observer', '原文件，未声明 observer', '补上 require + replace', '仍是同一份 go.mod'] },
      edges: ['新调用需要它', '定位依赖'],
      notes: ['原来只需要 demo 自己的代码，输出 room-42。', 'FindRoom 里新增 observer.Record 调用，但 go.mod 还没有声明这个依赖。', 'go build 报错：no required module provides package example.com/observer', '在同一份 go.mod 补上 require 和 replace，Go 找到了 observer。', '运行新程序：先打印 observed: FindRoom，再输出 room-42。']
    },
    en: {
      title: 'One more call: why the build breaks',
      nodes: { business: ['FindRoom', "demo's own code"], observer: ['observer.Record', 'module outside demo'], config: ['demo/go.mod', 'add require + replace'] },
      detailsByStage: { config: ['existing; no observer', 'existing; no observer', 'existing; no observer', 'add require + replace', 'still the same go.mod'] },
      edges: ['new call needs it', 'locate module'],
      notes: ["At first only demo's own code is needed; it prints room-42.", 'FindRoom now calls observer.Record, but go.mod does not declare that dependency.', 'go build fails: no required module provides package example.com/observer', 'Add require and replace to the same go.mod; Go can now find observer.', 'Run the new program: it prints observed: FindRoom, then room-42.']
    }
  },
  trace: {
    zh: {
      title: '把同一次请求的记录连成调用树',
      nodes: { up: ['Trace A', '同一次请求'], server: ['Span 01', 'HTTP 请求入口'], fn: ['Span 02', '查房间 · Parent=01'], db: ['Span 03', '数据库 · Parent=02'] },
      edges: ['同一条 Trace', '01 调用 02', '02 调用 03'],
      notes: ['Trace A：先确定哪些记录属于同一次请求。', '入口操作：Trace=A，Span=01。', '查房间：Trace=A，Span=02，Parent=01。', '数据库查询：Trace=A，Span=03，Parent=02。沿 Parent 连成树。']
    },
    en: {
      title: 'Linking records of one request into a tree',
      nodes: { up: ['Trace A', 'one request'], server: ['Span 01', 'HTTP entry'], fn: ['Span 02', 'find room · Parent=01'], db: ['Span 03', 'DB query · Parent=02'] },
      edges: ['same trace', '01 calls 02', '02 calls 03'],
      notes: ['Trace A: first decide which records belong to the same request.', 'Entry operation: Trace=A, Span=01.', 'Find room: Trace=A, Span=02, Parent=01.', 'DB query: Trace=A, Span=03, Parent=02. Follow Parent to build the tree.']
    }
  }
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 与 motion-scene.js 的 motionEdgePath 一致，保证线形相同。
function edgePath(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dy) < 50) { const d = dx > 0 ? 1 : -1; return `M ${a.x + 76 * d} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x - 76 * d} ${b.y}`; }
  const d = dy > 0 ? 1 : -1;
  return `M ${a.x} ${a.y + 33 * d} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y - 33 * d}`;
}

// 按字数粗略折行：中文按字符，英文按单词。
function wrap(text, lang) {
  const max = lang === 'zh' ? 44 : 84;
  if (lang === 'zh') {
    if (text.length <= max) return [text];
    // 在最接近中间的逗号、分号、冒号或空格后断开，避免切断代码名
    const mid = text.length / 2;
    let cut = -1;
    for (let i = 1; i < text.length - 1; i++) if ('，；：。 '.includes(text[i]) && i + 1 <= max && text.length - i - 1 <= max && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    if (cut < 0) cut = Math.ceil(mid) - 1;
    return [text.slice(0, cut + 1).trim(), text.slice(cut + 1).trim()];
  }
  const lines = [''];
  for (const w of text.split(' ')) { if ((lines.at(-1) + ' ' + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim(); }
  return lines;
}

function renderFrame(map, t, stage, i, uid, lang) {
  const byId = Object.fromEntries(map.nodes.map(n => [n.id, n]));
  const visible = new Set(stage.visible), active = new Set(stage.active), moving = new Set(stage.moving), broken = new Set(stage.broken || []);
  const edges = map.edges.map((e, k) => {
    if (stage.edges && !stage.edges.includes(k)) return '';
    const a = byId[e.from], b = byId[e.to];
    if (!(visible.has(e.from) && visible.has(e.to)) && !moving.has(k)) return '';
    const p = edgePath(a, b), cls = broken.has(k) ? 'broken' : moving.has(k) ? 'flowing' : '';
    const mid = e.labelAt || { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const carrier = moving.has(k) && !broken.has(k) ? `<circle r="5" class="dot"><animateMotion path="${p}" dur="1.6s" repeatCount="indefinite"/></circle>` : '';
    const mark = broken.has(k) ? `<text x="${mid.x}" y="${mid.y + 16}" class="break">${lang === 'zh' ? '× 找不到' : '× not found'}</text>` : '';
    return `<g class="edge ${cls}"><path d="${p}" marker-end="url(#${uid}-${broken.has(k) ? 'err' : 'arr'})"/><text x="${mid.x}" y="${mid.y - 9}" class="elabel">${esc(t.edges[k])}</text>${mark}${carrier}</g>`;
  }).join('');
  const nodes = map.nodes.map(n => {
    const [label, baseDetail] = t.nodes[n.id], detail = t.detailsByStage?.[n.id]?.[i] ?? baseDetail;
    const x = n.x - 76, y = n.y - 33, on = visible.has(n.id), lit = active.has(n.id);
    const shape = map.mode === 'modules' || map.mode === 'build'
      ? `<path d="M ${x} ${y + 9} L ${x} ${y} L ${x + 49} ${y} L ${x + 61} ${y + 9} L ${x + 152} ${y + 9} L ${x + 152} ${y + 66} L ${x} ${y + 66} Z"/>`
      : `<rect x="${x}" y="${y}" width="152" height="66" rx="${map.mode === 'tree' ? 16 : 8}"/>`;
    return `<g class="node ${on ? '' : 'future'} ${lit ? 'lit' : ''}">${shape}<text x="${n.x}" y="${n.y - 1}" class="nlabel">${esc(label)}</text><text x="${n.x}" y="${n.y + 18}" class="ndetail">${esc(on ? detail : (lang === 'zh' ? '本步未涉及' : 'not involved yet'))}</text></g>`;
  }).join('');
  const lines = wrap(t.notes[i], lang);
  const note = `<text x="340" y="${lines.length > 1 ? 347 : 356}" class="note">${lines.map((l, j) => `<tspan x="340" dy="${j ? 19 : 0}">${esc(l)}</tspan>`).join('')}</text>`;
  return `<g class="frame f${i}">${edges}${nodes}${note}<text x="630" y="394" class="counter">${i + 1} / ${map.stages.length}</text></g>`;
}

function renderSvg(id, lang) {
  const map = maps[id], t = texts[id][lang], n = map.stages.length, total = n * STEP, uid = `ls-${id}-${lang}`;
  const slot = 100 / n;
  // 第 i 帧只在自己的时间段内显示；淡入淡出各占时间段的 4%。
  const keyframes = map.stages.map((_, i) => {
    const s = i * slot, e = (i + 1) * slot, f = Math.min(slot * 0.06, 1.5);
    const parts = [];
    if (s > 0) parts.push(`0%,${(s - 0.01).toFixed(2)}%{opacity:0}`);
    parts.push(`${s.toFixed(2)}%{opacity:${s > 0 ? 0 : 1}}`, `${(s + f).toFixed(2)}%,${(e - f).toFixed(2)}%{opacity:1}`, `${e.toFixed(2)}%{opacity:${i === n - 1 ? 1 : 0}}`);
    if (e < 100) parts.push(`100%{opacity:0}`);
    return `@keyframes ${uid}-f${i}{${parts.join('')}}.f${i}{animation:${uid}-f${i} ${total}s linear infinite}`;
  }).join('');
  const pipX = i => 340 - (n - 1) * 9 + i * 18;
  const progress = map.stages.map((_, i) => `<circle cx="${pipX(i)}" cy="400" r="4" class="pip"/>`).join('') + map.stages.map((_, i) => `<circle cx="${pipX(i)}" cy="400" r="4" class="pip-on p${i}"/>`).join('');
  const pipKeys = map.stages.map((_, i) => `.p${i}{animation:${uid}-f${i} ${total}s linear infinite}`).join('');
  const css = `
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;text-anchor:middle}
.bg{fill:#f7f9f2;stroke:#d6e0cc}
.title{font-size:15px;font-weight:600;fill:#2c4933}
.node>rect,.node>path{fill:#fff;stroke:#a4b793;stroke-width:1.5}
.node.lit>rect,.node.lit>path{fill:#e3ecc7;stroke:#658b3c;stroke-width:2.2}
.node.future>rect,.node.future>path{fill:#f7f9f1;stroke:#bcc6b1;stroke-dasharray:6 5}
.node.future text{fill:#9aa38f}
.nlabel{font-size:13px;font-weight:600;fill:#2c4933}
.ndetail{font-size:10px;fill:#637859}
.edge>path{fill:none;stroke:#b6c8a4;stroke-width:1.7}
.edge.flowing>path{stroke:#7e9f4e;stroke-width:2.3;stroke-dasharray:7 5;animation:${uid}-flow 1s linear infinite}
.edge.broken>path{stroke:#b55b40;stroke-dasharray:5 5}
.elabel{font-size:10px;fill:#4f6e3c;paint-order:stroke;stroke:#f7f9f2;stroke-width:4px;stroke-linejoin:round}
.break{font-size:11px;font-weight:600;fill:#a7442e;paint-order:stroke;stroke:#f7f9f2;stroke-width:4px}
.dot{fill:#d9b44a;stroke:#7d6a24;stroke-width:1}
.note{font-size:14px;fill:#2f4a33}
.counter{font-size:12px;fill:#637859}
.notebg{fill:#edf3e4}
.pip{fill:#cdd8c3}
.pip-on{fill:#5c8b42;opacity:0}
.frame{opacity:0}
.f0{opacity:1}
@keyframes ${uid}-flow{to{stroke-dashoffset:-24}}
${keyframes}${pipKeys}
@media (prefers-reduced-motion:reduce),print{.frame,.pip-on{animation:none!important;opacity:0}.f${n - 1},.p${n - 1}{opacity:1}.edge.flowing>path{animation:none}.dot{display:none}}`;
  const desc = t.notes.map((s, i) => `${i + 1}. ${s}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="420" viewBox="0 0 680 420" role="img" aria-labelledby="${uid}-t ${uid}-d">
<title id="${uid}-t">${esc(t.title)}</title>
<desc id="${uid}-d">${esc(desc)}</desc>
<!-- Generated from the community LoongSuite Go Guide: scripts/export-official-svg.mjs (Apache-2.0). -->
<style>${css}</style>
<defs><marker id="${uid}-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#5c8b42"/></marker><marker id="${uid}-err" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#b55b40"/></marker></defs>
<rect x="1" y="1" width="678" height="418" rx="14" class="bg"/>
<text x="340" y="22" class="title">${esc(t.title)}</text>
<g transform="translate(0 6)">
<rect x="20" y="322" width="640" height="56" rx="8" class="notebg" transform="translate(0 -6)"/>
${map.stages.map((s, i) => renderFrame(map, t, s, i, uid, lang)).join('\n')}
</g>
${progress}
</svg>
`;
}

const written = [];
for (const id of Object.keys(texts)) for (const lang of ['zh', 'en']) {
  const map = maps[id], t = texts[id][lang];
  if (!map) throw Error(`missing motion map ${id}`);
  if (t.notes.length !== map.stages.length) throw Error(`${id}/${lang}: ${t.notes.length} notes for ${map.stages.length} stages`);
  if (t.edges.length !== map.edges.length) throw Error(`${id}/${lang}: edge label count`);
  for (const n of map.nodes) if (!t.nodes[n.id]) throw Error(`${id}/${lang}: missing node ${n.id}`);
  const file = path.join(out, `${id}-${lang}.svg`);
  const svg = renderSvg(id, lang);
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== svg) throw Error(`stale or missing SVG: ${file}`);
  } else fs.writeFileSync(file, svg);
  written.push(path.basename(file));
}
console.log(JSON.stringify({ [check ? 'checked' : 'written']: written.length, files: written }));
