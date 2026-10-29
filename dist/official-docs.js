// 对照官方文档阅读：顺序与标题跟随 https://alibaba.github.io/loongsuite-go/ 的中文侧栏。
// 摘要用本指南自己的话写，不复制官方正文；官方页面才是用法与参数的权威来源。

export const officialSite = {
  base: 'https://alibaba.github.io/loongsuite-go/',
  checked: '2026-10-29',
  mainCommit: '9576e3840ff9cbf58f593fef8dd01a3439d61cc8',
  diffNote: '核对日 `main` 与固定版本 v1.15.0 的 `docs/` 只有一处差异：支持库表中 zap 的仓库链接写法。工具行为仍以固定版本源码为准。'
};

export const coverageLabels = {
  deep: ['本指南详细展开', '有动画、源码定位和实验'],
  partial: ['本指南部分覆盖', '讲了原理，参数与清单以官方为准'],
  official: ['以官方为准', '本指南只给阅读提示，尚未展开']
};

export const officialGroups = [
  {id: 'user', title: '用户指南', en: 'User Guide', pages: [
    {id: 'user-index', title: '概述与快速开始', path: 'zh/', coverage: 'deep',
      says: '安装 `otel` 工具，在 `go build` 前加上 `otel` 前缀即可构建出带 OpenTelemetry 观察能力的程序；官方附有 demo、nethttp、kafka 等示例。',
      gap: '“目标应用无需改代码”容易被理解成“什么代码都没加”。实际上源码文件不改，观察代码是在**构建期间**被加入的，所以要先分清编译时和运行时。',
      read: [['从零 1 · 先有一个普通函数', '#/start/1'], ['从零 4 · 编译时和运行时是两段时间', '#/start/4'], ['从零 5 · 工具怎样替我加上前后动作', '#/start/5'], ['从 otel go build 到目标二进制', '#/learn/build']],
      question: '源码一行没改，新加的观察动作是在哪个阶段出现的？',
      answer: '在构建阶段：工具先准备规则和依赖，再让编译器处理改写后的代码。运行时执行的是这份加工后的二进制。'},
    {id: 'user-config', title: '命令行参考', path: 'zh/user/config.html', coverage: 'partial',
      says: '`otel set` 设置调试、详细日志、自定义规则、禁用默认规则与 Go 缓存目录，同名配置也可用 `OTELTOOL_` 前缀的环境变量临时覆盖；`otel go build` 接收原有构建参数。',
      gap: '`-rule` 与 `-disable` 改变的是**哪些规则进入匹配**，而不是运行时开关。读懂规则文件如何加载，才能判断“设置了却没生效”时该查哪一层。',
      read: [['otel 命令入口', '#/source/cli'], ['规则加载：JSON 先变成具体 Go 类型', '#/source/rule-load'], ['规则系统：版本范围不是装饰', '#/learn/rules'], ['实验 04：用 -disable= 与 -rule 跑真实 hook', '#/labs']],
      question: '执行 `otel set -disable=all -rule=custom.json` 后，官方说哪个规则文件仍然会启用？',
      answer: '`base.json`。即使禁用全部默认规则，它也会保留；排查规则来源时要把它算进去。'},
    {id: 'user-compilation-time', title: '编译时间', path: 'zh/user/compilation-time.html', coverage: 'deep',
      says: '使用工具后编译明显变慢：要引入新依赖并整理模块，还因为向标准库注入了代码而每次强制完整重编译。官方给出的增幅约为 92.8%。',
      gap: '为什么“加观察代码”会牵出新依赖，以及新依赖又可能命中新规则，是理解耗时的关键。',
      read: [['从零 6 · 为什么还要“补上依赖”', '#/start/6'], ['Preprocess：为什么找两次规则，要准备三次？', '#/source/preprocess'], ['为观察代码补依赖', '#/source/deps'], ['从 otel go build 到目标二进制', '#/learn/build']],
      question: '官方建议用哪个配置减少重复构建的时间？',
      answer: '`otel set -gocache=<目录>`（或 `OTELTOOL_GO_CACHE`）指定可复用的 Go 缓存目录，避免每次使用临时缓存。'},
    {id: 'user-experimental', title: '实验性功能', path: 'zh/user/experimental-feature.html', coverage: 'official',
      says: '列出 kratos、nacos、数据库与 Sentinel 的实验性采集开关，均为默认关闭的环境变量。',
      gap: '这些是**运行时**读取的环境变量：改动后不需要重新插桩构建，但要在启动程序的环境里设置。',
      read: [['从零 4 · 编译时和运行时是两段时间', '#/start/4'], ['OpenTelemetry 运行时：Span 从哪里来、到哪里去', '#/learn/otel']],
      question: '设置 `OTEL_INSTRUMENTATION_DB_EXPERIMENTAL_ENABLE=true` 后，需要重新执行 `otel go build` 吗？',
      answer: '按官方说明它是程序运行时读取的开关，在启动环境中设置即可；不确定时以新进程的实际输出为准。'},
    {id: 'user-compatibility', title: '兼容性', path: 'zh/user/compatibility.html', coverage: 'deep',
      says: '跟随 Go 官方的版本支持策略；当前最低 Go 1.25，因为注入的 OTel 模块要求 1.25；并列出经过测试的操作系统、Go 版本与架构。',
      gap: '“兼容”不只有 Go 版本一个数字，还包括目标库的版本区间和 runtime 内部结构。三者要一起看。',
      read: [['兼容性边界：三种版本要一起看', '#/source/version-boundary'], ['版本与多 module', '#/source/go-mod'], ['运行时上下文：GLS、newproc 与真实限制', '#/learn/runtime']],
      question: 'Go 1.24 在默认设置下为什么还能构建？',
      answer: '默认 `GOTOOLCHAIN=auto` 会自动下载 1.25 工具链；改成 `GOTOOLCHAIN=local` 就会失败。'},
    {id: 'user-manual', title: '手动埋点', path: 'zh/user/manual-instrument.html', coverage: 'deep',
      says: '在自动埋点之外，用 `otel.Tracer(...).Start(r.Context(), ...)` 手动创建 Span，它会出现在自动生成的 HTTP Span 之下。',
      gap: '手动 Span 能挂在正确父节点下，前提是传入了携带父 Span 的 context；已有 OTel 服务还要考虑重复埋点。',
      read: [['从零 7 · 从一条耗时记录，到一整条请求', '#/start/7'], ['OpenTelemetry 运行时：Span 从哪里来、到哪里去', '#/learn/otel'], ['兼容已有 OTel：去重、入口和消息边界', '#/learn/compatibility'], ['实验 05：真实 TraceID 与父 Span', '#/labs']],
      question: '把示例里的 `r.Context()` 换成 `context.Background()`，手动 Span 会怎样？',
      answer: '它通常不再以 HTTP Span 为父节点，而是开始一条新的链路（LoongSuite 的 GLS 可能补救部分场景，见“上下文传播”）。'},
    {id: 'user-context', title: '上下文传播', path: 'zh/user/context-propagation.html', coverage: 'deep',
      says: '借鉴 SkyWalking Go：创建 Span 时同时存入协程结构（GLS），创建新协程时复制这份数据；context 没传好时，从 GLS 找最近的 Span 作父节点，baggage 同理。',
      gap: 'GLS 是补救手段，不等于可以不传 context。预创建的 worker、消息队列等交接点仍可能接错父节点。',
      read: [['Context 与传播：一条链怎样跨 goroutine 和进程', '#/learn/context'], ['GLS：工具提供的协程上下文桥', '#/source/gls'], ['运行时上下文：GLS、newproc 与真实限制', '#/learn/runtime'], ['实验 01 与 06：任务交接与传播头', '#/labs']],
      question: 'GLS 在“新协程创建时复制”数据。为什么提前创建好的 worker 处理新任务时仍可能拿错父节点？',
      answer: 'worker 协程在任务到来之前就创建了，复制发生在那时；之后的任务要靠显式携带 context 才能交接正确的父 Span。'},
    {id: 'user-sdk', title: 'OpenTelemetry 配置', path: 'zh/user/sdk-config.html', coverage: 'partial',
      says: '工具会注入 SDK 初始化代码，通过标准 `OTEL_*` 环境变量配置服务名、导出器、OTLP 端点与协议、采样器和 HTTP 排除路径。',
      gap: '采样有两个变量：私有的 `OTEL_TRACE_SAMPLER` 优先级更高且基于父级；标准的 `OTEL_TRACES_SAMPLER=traceidratio` 不基于父级。名字只差一个 S，行为不同。',
      read: [['OpenTelemetry 运行时：Span 从哪里来、到哪里去', '#/learn/otel'], ['创建与抑制 Span 的运行时入口', '#/source/otel-runtime'], ['实验 05：采样与内存 exporter', '#/labs']],
      question: '想保持“基于父级、50% 比例”的旧行为，并改用标准变量，应该怎么写？',
      answer: '`OTEL_TRACES_SAMPLER=parentbased_traceidratio` 配合 `OTEL_TRACES_SAMPLER_ARG=0.5`。'},
    {id: 'user-libraries', title: '支持的库', path: 'zh/user/supported-libraries.html', coverage: 'partial',
      says: '列出已有规则的库，以及每个库支持的最低、最高版本。',
      gap: '表格里的范围最终落在规则 JSON 的 `Version` 字段，通常是左闭右开区间；依赖版本落在区间外时，规则不会命中，也不会报错。',
      read: [['规则系统：版本范围不是装饰', '#/learn/rules'], ['规则 JSON', '#/source/rule-json'], ['编译 action 匹配', '#/source/match']],
      question: '规则写 `[1.3.0,1.7.4)`，项目使用 1.7.4，会发生什么？',
      answer: '右端点不包含，规则不命中。构建可以成功，但不会出现这条规则对应的观察数据。'}
  ]},
  {id: 'dev', title: '开发者指南', en: 'Developer Guide', pages: [
    {id: 'dev-overview', title: '概述', path: 'zh/dev/overview.html', coverage: 'deep',
      says: '目标库不在支持列表中时，可以自己写规则和 hook 注入观察代码，既能本地使用，也能贡献到仓库。',
      gap: '一次可靠的二开要同时交付规则、hook、原版与插桩的对照输出，以及兼容性说明。',
      read: [['Hook 与 linkname：如何接入而不破坏调用约定', '#/learn/hooks'], ['毕业项目：为已有 OTel 服务新增一个安全规则', '#/learn/capstone'], ['实验 04：自定义 hook', '#/labs']],
      question: '开发一个新插件，至少要写哪两样东西？',
      answer: '一条注册规则（说明目标函数、版本和 hook 位置）和一段 hook 代码（实际的观察逻辑）。'},
    {id: 'dev-register', title: '注册 Hook 规则', path: 'zh/dev/register.html', coverage: 'deep',
      says: '在 `tool/data/rules` 下增加 JSON 文件，写明版本区间、导入路径、目标函数、OnEnter 名称和 hook 代码路径。',
      gap: 'JSON 只是声明。它先被解析成具体的规则类型，再在编译动作里和真实包、函数匹配。',
      read: [['规则 JSON', '#/source/rule-json'], ['规则加载：JSON 先变成具体 Go 类型', '#/source/rule-load'], ['规则数据模型', '#/source/rule-model'], ['实验 04：JSON 规则到真实 hook', '#/labs']],
      question: '官方 mux 示例里，`Path` 字段指向什么？',
      answer: '存放 hook 代码的包路径（`pkg/rules/mux`）。它可以是模块路径，也可以是本地目录。'},
    {id: 'dev-hook', title: '编写 Hook 代码', path: 'zh/dev/hook.html', coverage: 'deep',
      says: 'hook 是普通 Go 函数，但必须用 `go:linkname` 标注；第一个参数是 `api.CallContext`，OnEnter 其余参数对应目标函数参数，OnExit 对应返回值；可用 `SetParam` / `SetReturnVal` 修改。',
      gap: '签名不匹配或链接名写错时，问题会出现在编译或链接阶段，而且报错不一定直接指向 hook。',
      read: [['自定义 Hook：普通 Go 函数也要遵守连接约定', '#/source/hook-rule'], ['CallContext API', '#/source/call-context'], ['跨包符号桥', '#/source/linkname'], ['Hook 与 linkname', '#/learn/hooks']],
      question: '目标函数是 `func foo(a int) (string, error)`，OnExit hook 的参数是什么？',
      answer: '`(call api.CallContext, s string, err error)`：第一个参数是 CallContext，其余对应返回值。'},
    {id: 'dev-test', title: '测试 Hook 代码', path: 'zh/dev/test.html', coverage: 'official',
      says: '在 `test/` 下按库与最低版本建立用例目录，用 verifier 断言产生的 Span，并说明 muzzle、latest-depth 与 world 测试。',
      gap: '本指南的实验用输出断言证明 hook 执行、原结果不变，没有讲解上游的 verifier 测试框架。给上游提规则时，请按官方这页补测试。',
      read: [['调试与验证：从“没 Span”定位到具体层', '#/learn/debugging'], ['实验 04：普通与插桩输出逐项断言', '#/labs']],
      question: '为一个支持 `v9.0.5` 到最新版本的规则写测试，官方建议先建哪个版本目录？',
      answer: '最低版本 `v9.0.5`，先证明区间左端点可用。'},
    {id: 'dev-rule-types', title: 'Hook 规则类型', path: 'zh/dev/rule_def.html', coverage: 'deep',
      says: '三类规则：给函数插入入口/出口 hook、在编译某个包时加入新文件、给结构体增加字段，并说明各字段的含义。',
      gap: '`Function` 与 `ReceiverType` 支持正则，范围可能比预期大；字段的真实语义要以加载代码为准，文档与实现偶有出入。',
      read: [['规则数据模型', '#/source/rule-model'], ['规则集合', '#/source/bundle'], ['规则系统：版本范围不是装饰', '#/learn/rules'], ['Preprocess：给结构体加字段的实例', '#/source/preprocess']],
      question: '`Function` 和 `ReceiverType` 都写 `.*` 会匹配什么？',
      answer: '该包中的所有函数，包括没有接收者的普通函数。'},
    {id: 'dev-http-capture', title: 'HTTP 采集', path: 'zh/dev/http-capture.html', coverage: 'official',
      says: '设计 HTTP 请求头和 Body 的采集：环境变量、属性命名、Body 采集条件、实现位置与测试计划。',
      gap: '本指南没有讲解这项功能。它适合在读懂 hook 与 OTel 属性之后，作为“一个完整插件设计”来读。',
      read: [['Hook 与 linkname', '#/learn/hooks'], ['OpenTelemetry 运行时：属性、事件和状态', '#/learn/otel']],
      question: '读这页设计文档时，先找哪两部分最能帮助理解实现？',
      answer: '“实现位置”和“Hook 改动”：前者告诉你改哪些包，后者告诉你 hook 在哪一步取数据。'}
  ]},
  {id: 'hacking', title: '黑客指南', en: 'Hacking Guide', pages: [
    {id: 'hack-overview', title: '概述', path: 'zh/hacking/overview.html', coverage: 'deep',
      says: '普通 `go build` 经历解析、类型检查、优化、生成代码与链接；使用工具后，在这些步骤之前增加“预处理”和“埋点”两个阶段。',
      gap: '两个新阶段并不是替换编译器，而是在调用真实编译器之前准备和改写输入。',
      read: [['从零 4 · 编译时和运行时是两段时间', '#/start/4'], ['从 otel go build 到目标二进制', '#/learn/build'], ['源码架构导航：从命令到 hook 的调用链', '#/learn/architecture']],
      question: '“预处理”和“埋点”分别产出什么？',
      answer: '预处理选出要用的规则并准备依赖；埋点按规则生成并注入代码，再交给真实编译器。'},
    {id: 'hack-preprocess', title: '预处理阶段', path: 'zh/hacking/preprocess.html', coverage: 'deep',
      says: '分析项目依赖并与规则匹配，准备规则需要的依赖，然后通过 `go build -toolexec otel` 进入埋点阶段。',
      gap: '官方用一段话带过的“准备依赖”，实际要反复进行：加入 hook 代码会带进新包，新包又可能命中新规则。',
      read: [['Preprocess：为什么找两次规则，要准备三次？', '#/source/preprocess'], ['为观察代码补依赖', '#/source/deps'], ['Go 编译器代理', '#/source/toolexec'], ['实验 03：亲手包装一次 Go 编译', '#/labs']],
      question: '`-toolexec` 让 `go build` 做了什么不同的事？',
      answer: '调用编译器、链接器等工具时，先调用指定程序并把原命令交给它，由它决定改写输入后再执行真实工具。'},
    {id: 'hack-instrument', title: '埋点阶段', path: 'zh/hacking/instrument.html', coverage: 'deep',
      says: '以 `(*Transport).RoundTrip` 为例：在原函数入口插入 tjump，跳到生成的 Trampoline，再由 `go:linkname` 接到开发者写的 hook。',
      gap: '三层模型里，“谁生成、谁提供、谁连接”最容易混。先分清 RawFunc、TrampolineFunc、HookFunc 的来源，再看代码。',
      read: [['AST 插桩总流程', '#/source/instrument'], ['函数 AST 改写：在入口和返回处接上 hook', '#/source/func-ast'], ['Trampoline 三层模型', '#/source/trampoline'], ['跨包符号桥', '#/source/linkname'], ['实验 02 与 04：AST 改写与真实 hook', '#/labs']],
      question: '为什么 tjump 把 OnExit 放在 `else` 分支里的 `defer`？',
      answer: '`skip` 几乎总是 false，`else` 总会执行；用 `defer` 才能在原函数任何返回路径上运行 OnExit。'},
    {id: 'hack-optimize', title: 'AST 优化', path: 'zh/hacking/optimize.html', coverage: 'partial',
      says: '缺少 OnEnter 或 OnExit、或不使用 SkipCall 时，改写 tjump 的条件和分支，让编译器的死代码消除去掉多余部分。',
      gap: '优化依赖 if 骨架保持不变，所以修改 tjump 结构的改动都要重新验证性能和语义。',
      read: [['函数 AST 改写：在入口和返回处接上 hook', '#/source/func-ast'], ['Trampoline 三层模型', '#/source/trampoline'], ['AST 与 DST：把源码变成可安全改写的树', '#/learn/ast']],
      question: '没有 OnExit hook 时，为什么不直接删掉整个 `else` 块？',
      answer: '同一函数可能有多个 tjump，后面的嵌套在 `else` 块里；官方的做法是把 `defer` 换成空语句。'},
    {id: 'hack-debug', title: '调试', path: 'zh/hacking/debug.html', coverage: 'partial',
      says: '`otel set -debug` 构建未优化的二进制并保留临时文件，`-verbose` 输出详细过程；`.otel-build` 里保存注入代码、原文件备份和匹配到的规则。',
      gap: '先确认问题在哪一层：规则没命中、代码没注入、hook 没执行，还是数据没导出。不同层看不同证据。',
      read: [['调试与验证：从“没 Span”定位到具体层', '#/learn/debugging'], ['从 otel go build 到目标二进制：动手读日志', '#/learn/build'], ['实验 04：普通与插桩输出对照', '#/labs']],
      question: '怀疑规则没有命中，先看 `.otel-build` 里的哪个文件？',
      answer: '`preprocess/matched_rules.json`，它记录预处理阶段匹配到的规则。'}
  ]}
];

export const officialFirstPath = ['user-index', 'hack-overview', 'hack-preprocess', 'hack-instrument', 'dev-rule-types', 'dev-register', 'dev-hook', 'hack-debug'];

export const officialPages = officialGroups.flatMap(g => g.pages.map(p => ({...p, group: g})));

export const officialUrl = p => officialSite.base + p.path;

export function renderOfficialPage(id, {inline, escape}) {
  const index = Math.max(0, officialPages.findIndex(p => p.id === id));
  const p = officialPages[index], prev = officialPages[index - 1], next = officialPages[index + 1];
  const [coverage, coverageDetail] = coverageLabels[p.coverage];
  const firstPath = officialFirstPath.map((pid, i) => {
    const page = officialPages.find(x => x.id === pid);
    return `<a class="tag" href="#/official/${pid}">${i + 1}. ${escape(page.group.title)} · ${escape(page.title)}</a>`;
  }).join('');
  const list = officialGroups.map(g => `<div class="nav-label">${escape(g.title)} · ${escape(g.en)}</div>${g.pages.map(x => `<a class="source-item ${x.id === p.id ? 'active' : ''}" href="#/official/${x.id}" ${x.id === p.id ? 'aria-current="page"' : ''}><span class="num">${String(officialPages.findIndex(y => y.id === x.id) + 1).padStart(2, '0')}</span><span>${escape(x.title)}<small>${escape(coverageLabels[x.coverage][0])}</small></span></a>`).join('')}`).join('');
  return `<header class="source-intro"><div class="eyebrow">对照官方文档 / 官方说“怎么用”，这里补“为什么”</div><h1>跟着官方文档读，每页接上例子与源码。</h1><p class="source-plain">左边按 <a href="${escape(officialSite.base)}zh/" target="_blank" rel="noopener noreferrer">LoongSuite Go 官方文档</a> 的侧栏顺序排列。建议把官方页面和这里并排打开：先读官方原文，再按“在本指南中接着读”的顺序看例子、动画和源码。</p><div class="toolbar"><a class="btn" href="${escape(officialUrl(p))}" target="_blank" rel="noopener noreferrer">打开官方原文 ↗</a><a class="btn light" href="${escape(officialSite.base)}" target="_blank" rel="noopener noreferrer">English docs ↗</a></div><div class="callout"><b>版本对应：</b>官方文档随 <code>main</code> 更新，本指南源码固定 v1.15.0。${inline(officialSite.diffNote)}核对日期 ${escape(officialSite.checked)}，<code>main</code> 提交 <code>${escape(officialSite.mainCommit.slice(0, 7))}</code>。</div><p><b>第一次读，想弄懂原理：</b></p><p>${firstPath}</p></header><div class="source-layout"><nav class="source-list" aria-label="官方文档目录">${list}</nav><article class="source-detail"><div class="eyebrow">${escape(p.group.title)} · ${escape(coverage)}</div><h2>${escape(p.title)}</h2><p class="source-path"><a href="${escape(officialUrl(p))}" target="_blank" rel="noopener noreferrer">${escape(officialUrl(p))} ↗</a></p><section class="article-section"><h3>官方这页讲什么</h3><p>${inline(p.says)}</p></section><section class="article-section"><h3>初学者容易卡在哪里</h3><p>${inline(p.gap)}</p></section><section class="article-section"><h3>在本指南中接着读</h3><p class="source-path" style="border:0;padding:0;margin:0 0 8px">${escape(coverageDetail)}</p><ol>${p.read.map(([label, href]) => `<li><a href="${escape(href)}">${escape(label)}</a></li>`).join('')}</ol></section><section class="article-section"><h3>读完自测</h3><details><summary>${inline(p.question)}</summary><p>${inline(p.answer)}</p></details></section><nav class="prev-next" aria-label="官方文档上一页与下一页">${prev ? `<a href="#/official/${prev.id}">← ${escape(prev.group.title)} · ${escape(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/official/${next.id}">${escape(next.group.title)} · ${escape(next.title)} →</a>` : '<span></span>'}</nav></article></div>`;
}
