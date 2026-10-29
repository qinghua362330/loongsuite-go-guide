import { motionMaps } from './motion-map.js';
import { renderDependencyScene } from './dependency-lesson.js';

const motionEsc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prepMotion={mode:'modules',nodes:[
  {id:'room',label:'room.FindRoom(42)',detail:'原来的业务包',x:115,y:65},
  {id:'recorder',label:'room-recorder',detail:'查房间的记录代码',x:340,y:65},
  {id:'cache',label:'cache.Hit',detail:'记录包又调用了它',x:565,y:65},
  {id:'base',label:'基础 OTel 库',detail:'第一次先接入',x:115,y:255},
  {id:'match',label:'规则匹配器',detail:'查看参与构建的包',x:340,y:255},
  {id:'cacheRecorder',label:'cache-recorder',detail:'第二次才选中它',x:565,y:255}
],edges:[
  {from:'room',to:'base',label:'基础 import'},
  {from:'room',to:'match',label:'扫描 room'},
  {from:'match',to:'recorder',label:'B1 选中'},
  {from:'room',to:'recorder',label:'新 import'},
  {from:'recorder',to:'cache',label:'带来 cache'},
  {from:'cache',to:'match',label:'重新扫描'},
  {from:'match',to:'cacheRecorder',label:'B2 的新需求'},
  {from:'cache',to:'cacheRecorder',label:'补齐记录包'}
],stages:[
  {visible:['room'],active:['room'],moving:[],note:'先只有查房间的业务代码。虚线框里的记录包还没有接入。'},
  {visible:['room','base'],active:['base'],moving:[0],note:'准备①：基础 OTel 库进入构建；业务规则清单仍为空。'},
  {visible:['room','base','match'],active:['match'],moving:[1,2],note:'匹配①选中 room 规则，得到 B1；记录包还没有接入。'},
  {visible:['room','base','match','recorder','cache'],active:['recorder','cache'],moving:[3,4],note:'准备②接入 room-recorder。它的 import 又把 cache 带了进来。'},
  {visible:['room','base','match','recorder','cache'],active:['cache','match'],moving:[5,6],note:'匹配②现在看见 cache，又选出 cache 规则；新需求进入 B2。'},
  {visible:['room','base','match','recorder','cache','cacheRecorder'],active:['cacheRecorder'],moving:[6,7],note:'准备③按 B2 接入 cache-recorder；最终记录代码都能找到。'},
  {visible:['room','base','match','recorder','cache','cacheRecorder'],active:['room','recorder','cache','cacheRecorder'],moving:[3,7],note:'正式构建：按规则加工目标函数，再把所有配套代码编进业务产物。'},
  {visible:['room','base','match','recorder','cache','cacheRecorder'],active:['room','recorder','cache','cacheRecorder'],moving:[3,4,7],note:'启动后调用 FindRoom(42)，观察动作才随业务执行。'}
]};
const depsMotion={mode:'modules',nodes:[
 {id:'main',label:'FindRoom(42)',detail:'原来能编译的业务',x:115,y:70},
 {id:'import',label:'otel.runtime.go',detail:'新增记录包 import',x:340,y:70},
 {id:'recorder',label:'room-recorder',detail:'记录函数实际的代码',x:565,y:70},
 {id:'gomod',label:'go.mod',detail:'require + replace',x:340,y:255},
 {id:'local',label:'../room-recorder',detail:'本地源码目录',x:565,y:255}
],edges:[{from:'main',to:'import',label:'新增观察动作'},{from:'import',to:'recorder',label:'import 包名'},{from:'import',to:'gomod',label:'解析模块'},{from:'gomod',to:'local',label:'定位代码'},{from:'local',to:'recorder',label:'参与构建'}],stages:[
 {visible:['main'],active:['main'],moving:[],note:'原来的构建只需要业务包。'},
 {visible:['main','recorder'],active:['recorder'],moving:[0],note:'想新增记录动作，但业务构建还不知道去哪找这个包。'},
 {visible:['main','import','recorder'],active:['import'],moving:[0,1,2],note:'import 写出要哪个包；接下来按 go.mod 解析它的模块。'},
 {visible:['main','import','recorder','gomod','local'],active:['gomod','local'],moving:[2,3],note:'require 登记模块，replace 把它指向真实的本地代码。'},
 {visible:['main','import','recorder','gomod','local'],active:['recorder','main'],moving:[3,4],note:'Go 可以找到配套代码，后续才有条件编译新增的观察动作。'}
]};

export function getMotionMap(kind,id,caseIndex=0,frameIndex=0) {
  const original=kind==='source'&&id==='preprocess'?prepMotion:kind==='source'&&id==='deps'?depsMotion:motionMaps[kind]?.[id];
  if(!original)return null;
  let stage=original.stages[Math.min(frameIndex,original.stages.length-1)];
  if(kind==='source'&&id==='preprocess'&&caseIndex===1&&frameIndex===3)stage={...prepMotion.stages[2],moving:[2],broken:[2],note:'只准备一轮：选中 B1 以后就停了，room-recorder 仍是虚线，缺少下一次准备。'};
  if(kind==='source'&&id==='preprocess'&&caseIndex===2&&frameIndex===5)stage={...prepMotion.stages[4],moving:[6],broken:[6],note:'只准备两轮：刚选中的 cache-recorder 还没有接入，缺少第三次准备。'};
  return {...original,current:stage};
}

function motionEdgePath(a,b) {
  const dx=b.x-a.x,dy=b.y-a.y;
  if(Math.abs(dy)<50){const direction=dx>0?1:-1;return `M ${a.x+76*direction} ${a.y} C ${(a.x+b.x)/2} ${a.y}, ${(a.x+b.x)/2} ${b.y}, ${b.x-76*direction} ${b.y}`;}
  const direction=dy>0?1:-1;
  return `M ${a.x} ${a.y+33*direction} C ${a.x} ${(a.y+b.y)/2}, ${b.x} ${(a.y+b.y)/2}, ${b.x} ${b.y-33*direction}`;
}

function motionVersionScene(uid,stage,index) {
  const compared=index>=2;
  return `<svg viewBox="0 0 680 360" role="img" aria-labelledby="${uid}-svg-title ${uid}-svg-desc"><title id="${uid}-svg-title">GORM 版本 1.25.12 落在允许区间右边</title><desc id="${uid}-svg-desc">绿色区间包含 1.22.0，不包含 1.25.10；实际版本 1.25.12 超出上界，规则跳过。</desc><text x="32" y="38" class="motion-svg-kicker">把版本放到区间上比较</text><rect x="30" y="60" width="620" height="245" rx="14" class="motion-range-bg"/><text x="58" y="100" class="motion-svg-label">规则允许的范围</text><line x1="100" y1="180" x2="590" y2="180" class="motion-axis"/><line x1="130" y1="180" x2="440" y2="180" class="motion-range ${index>=1?'lit':''}"/><circle cx="130" cy="180" r="7" class="motion-bound closed"/><circle cx="440" cy="180" r="7" class="motion-bound open"/><text x="130" y="220" text-anchor="middle" class="motion-svg-detail">1.22.0 · 包含</text><text x="440" y="220" text-anchor="middle" class="motion-svg-detail">1.25.10 · 不包含</text><g class="motion-version-pointer"><path d="M 560 132 L 552 145 L 568 145 Z"/><circle cx="560" cy="180" r="9" class="motion-version-dot"/><circle cx="560" cy="180" r="16" class="motion-version-ring"/><text x="560" y="120" text-anchor="middle" class="motion-svg-label">实际 1.25.12</text></g><text x="340" y="275" text-anchor="middle" class="motion-svg-result">${compared?'! 超出范围 → 不接入这一条 GORM 规则':'先找到真实版本，再拿规则范围比较'}</text></svg>`;
}

export function renderMotionScene(kind,id,caseIndex,frameIndex) {
  if(kind==='zero'&&id==='deps')return renderDependencyScene(frameIndex);
  const map=getMotionMap(kind,id,caseIndex,frameIndex);
  if(!map)return '';
  const stage=map.current,uid=`motion-${kind}-${id}`,visible=new Set(stage.visible),active=new Set(stage.active),moving=new Set(stage.moving),broken=new Set(stage.broken||[]),skipped=new Set(stage.skipped||[]),byId=Object.fromEntries(map.nodes.map(n=>[n.id,n]));
  if(map.mode==='version')return motionVersionScene(uid,stage,frameIndex);
  const edgeMarkup=map.edges.map((edge,i)=>{
    const a=byId[edge.from],b=byId[edge.to],path=motionEdgePath(a,b),isMoving=moving.has(i),isBroken=broken.has(i),isSkipped=skipped.has(i),show=visible.has(edge.from)&&visible.has(edge.to)||isMoving;
    if(!show)return '';
    const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    return `<g class="motion-edge ${isMoving&&!isSkipped?'flowing':''} ${isBroken?'broken':''} ${isSkipped?'skipped':''}"><path d="${path}" marker-end="url(#${uid}-${isBroken?'error':'arrow'})"/><text x="${midpoint.x}" y="${midpoint.y-10}" text-anchor="middle" class="motion-edge-label">${motionEsc(edge.label)}</text>${isSkipped?`<text x="${midpoint.x}" y="${midpoint.y+15}" text-anchor="middle" class="motion-skip">✓ 避免重复创建</text>`:isBroken?`<text x="${midpoint.x}" y="${midpoint.y+15}" text-anchor="middle" class="motion-break">× 缺少交接 / 准备</text>`:isMoving?`<g class="motion-carrier"><rect x="-24" y="-10" width="48" height="20" rx="5"/><text text-anchor="middle" y="4">${map.mode==='tree'?'ctx':map.mode==='call'?'状态':map.mode==='modules'?'代码':'动作'}</text><animateMotion path="${path}" dur="2s" repeatCount="2" rotate="0"/></g>`:''}</g>`;
  }).join('');
  const nodeMarkup=map.nodes.map(node=>{
    const exists=visible.has(node.id),lit=active.has(node.id),x=node.x-76,y=node.y-33;
    const shape=map.mode==='modules'||map.mode==='build'?`<path d="M ${x} ${y+9} L ${x} ${y} L ${x+49} ${y} L ${x+61} ${y+9} L ${x+152} ${y+9} L ${x+152} ${y+66} L ${x} ${y+66} Z"/>`:`<rect x="${x}" y="${y}" width="152" height="66" rx="${map.mode==='tree'?16:8}"/>`;
    return `<g class="motion-node ${exists?'present':'future'} ${lit?'lit':''}">${shape}<text x="${node.x}" y="${node.y-1}" text-anchor="middle" class="motion-svg-label">${motionEsc(node.label)}</text><text x="${node.x}" y="${node.y+19}" text-anchor="middle" class="motion-svg-detail">${motionEsc(map.mode==='dedup'&&node.id==='duplicate'&&!exists?'已跳过：不再创建':exists?node.detail:'尚未接入 / 之后再看')}</text>${lit?`<circle cx="${node.x-62}" cy="${node.y-23}" r="4" class="motion-live-dot"/>`:''}</g>`;
  }).join('');
  return `<svg viewBox="0 0 680 340" role="img" aria-labelledby="${uid}-svg-title ${uid}-svg-desc"><title id="${uid}-svg-title">${motionEsc(stage.note)}</title><desc id="${uid}-svg-desc">高亮节点：${motionEsc(stage.active.map(n=>byId[n]?.label).join('、'))}。${motionEsc(stage.note)}</desc><defs><marker id="${uid}-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#5c8b42"/></marker><marker id="${uid}-error" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#b55b40"/></marker></defs>${edgeMarkup}${nodeMarkup}</svg>`;
}
