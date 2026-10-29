const upstream = 'https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1';
const docs = `${upstream}/docs`;

const q = (question, options, answer, explanation) => ({ q: question, options, answer, explanation });
const sec = (title, paragraphs, code, language, note) => ({ title, paragraphs, ...(code ? { code, language } : {}), ...(note ? { note } : {}) });
const walk = (file, symbol, task, url = `${upstream}/${file}`) => ({ file, symbol, task, url });

export const chapters = [
  {
    id: 'orientation', title: '从一个普通 Go 函数开始：为什么需要插桩', subtitle: '先会跑一个小程序，再逐步理解 package、module、构建和观测', stage: '基础', minutes: 55, prerequisites: ['会读最基本的 Go 函数：func、参数、返回值和调用'],
    bridge: { known: '你会读并调用普通 Go 函数。', problem: '函数只给结果，调用过程、耗时和错误不容易看见。', idea: '先手动记录，再理解编译期工具如何按规则自动加记录点。', terms: [{ term: 'package', meaning: '一起编译的一组 Go 文件' }, { term: 'module', meaning: '有名字、可被依赖的一组 package' }, { term: 'binary', meaning: '编译后可直接运行的程序' }], takeaway: '先看懂源代码怎样变成程序，才知道插桩插在哪里。' },
    outcomes: ['能从一个普通函数读懂 package、import 和 module 的基本关系', '能用 go build 生成并运行一个二进制文件', '能说出“观察函数执行”为什么需要在代码中增加记录点，并理解自动插桩要解决的重复劳动'],
    sections: [
      sec('先看懂一个普通函数', ['先把“观测”放一边。下面的函数接收一个数字，返回一个数字；调用者只能看到返回值，不知道函数何时开始、用了多久、走了哪条分支。', '示意（可运行）：'], `package main\n\nimport "fmt"\n\nfunc addOne(n int) int { return n + 1 }\n\nfunc main() { fmt.Println(addOne(2)) }`, 'go', '保存为 main.go 后可运行：go run main.go；输出 3。'),
      sec('从 package 和 import 到 module', ['package 是一组一起编译的 Go 文件；import 表示“我要使用另一个 package”；module 是一组有名字、可被依赖的 package，module 名称和外部依赖的版本要求写在 go.mod 里。先只记住关系：文件属于 package，package 属于 module。', '创建练习模块：mkdir hello-observe && cd hello-observe && go mod init example.com/hello-observe；把上一个 main.go 放进去后运行 go run .。'], null, null, 'example.com/hello-observe 只是练习名称，不是线上地址。'),
      sec('go build 做了什么，输出在哪里', ['go run 会编译后临时运行；go build 会编译并留下可执行文件。-o 明确指定输出文件，便于你看到“源代码如何变成程序”。'], `go build -o hello .\n./hello`, 'sh', 'macOS/Linux 执行 ./hello；Windows 建议用 go build -o hello.exe .，再执行 .\\hello.exe。'),
      sec('为什么要观察函数执行', ['如果只看 addOne 的返回值，我们不知道它是否被调用、调用了几次、耗时多久或返回了什么错误。最直接的办法是在函数前后手动写记录：开始时记时间，结束时打印结果。', '这能解决一个函数的问题，却会让很多库调用都重复写同样的代码；而且提前 return、错误和并发都容易漏记。自动插桩的动机，就是在编译时把类似的记录点按规则加进去，仍交给普通 Go 编译器检查。'], `func addOne(n int) int {\n    fmt.Println("addOne: start")\n    result := n + 1\n    fmt.Println("addOne: end", result)\n    return result\n}`, 'go'),
      sec('从手动记录走到 LoongSuite', ['LoongSuite Go 的固定上游版本是 v1.15.0，commit 为 cac400935add57d8219122ba32857b8f55ac6eb1。它不是运行时凭空扫描已经编译好的程序，而是在 otel go build 过程中准备依赖、匹配规则、改写目标源码，再交给 Go 编译器生成二进制。', '先记住因果链：函数本身没有观察记录 → 手动加记录点 → 重复劳动变多 → 编译期工具按明确规则自动加点。'], `源代码 -> go build ->（规则命中时改写）-> Go 编译器 -> 二进制 -> 运行时产生记录`, 'text')
    ],
    walkthrough: [walk('README.md', 'Getting Started', '确认 otel go build 是编译期入口，并记录 Go 版本要求'), walk('docs/user/compilation-time.md', 'Compilation Time', '理解 preprocess、instrument、原始编译的时间组成'), walk('go.mod', 'module github.com/alibaba/loongsuite-go', '区分根模块、pkg 模块和测试依赖')],
    lab: { title: '运行一个普通函数，再手动加观察', steps: ['下载并解压实验包，进入 labs/00-start；先读 main.go 的 addOne。', '运行 go run .，比较 plain result 与 observed result，找出额外的 start/end 记录。', '用 go build 留下可执行文件，再直接运行它；观察结果相同。'], command: 'cd labs/00-start\ngo run .\nmkdir -p .bin\ngo build -o .bin/observe .\n.bin/observe', expected: '两个结果都是 3；带观察的路径额外打印 observe: start 和 observe: end，耗时可能每次不同。这里只手写普通 Go 记录，没有 OTel Span。', challenge: '把 main 中两处输入都改成 8，确认普通结果、观察结果和记录中的结果都是 9。' },
    quiz: [q('只运行 go build 后，下面哪项最能说明“已经得到一个可运行程序”？', ['目录中出现二进制文件，并执行它看到预期输出', '只看终端没有报错，不检查输出文件', '只查看 go.mod，不运行程序'], 0, 'go build 的直接结果是可执行文件；运行它才能验证输出。'), q('为什么一个函数的手动开始/结束打印会推动自动插桩？', ['因为每个函数都必须改名', '因为大量函数都重复需要相同记录，手写容易漏掉分支和错误', '因为 go.mod 会自动记录函数耗时'], 1, '自动插桩解决的是重复且易漏的记录劳动；module 文件不负责运行时观测。')],
    checkpoint: ['能运行一个含 main 函数的最小 Go 程序', '能说明 package、import、module 和 go build 的关系', '能用一句话解释“手动记录点”如何引出自动插桩'], sources: [{ title: 'LoongSuite Go README', url: 'https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1' }, { title: 'Compilation Time', url: `${docs}/user/compilation-time.md` }], visual: 'pipeline'
  },
  {
    id: 'go-foundations', title: 'Go 最小阅读底座：从函数到可观察函数', subtitle: '先掌握普通 Go 的调用、错误、包和模块，再看工具如何改写它', stage: '基础', minutes: 75, prerequisites: ['orientation'],
    bridge: { known: '你已经能运行小程序并理解 module 的位置。', problem: '读 hook 时会遇到多返回值、接口、defer 和 context。', idea: '补齐这些普通 Go 机制，再把工具接口和标准库接口分开。', terms: [{ term: 'error', meaning: '作为返回值交给调用者处理的错误信息' }, { term: 'defer', meaning: '函数返回前执行的一次收尾调用' }, { term: 'interface', meaning: '只规定需要哪些方法的类型' }, { term: 'context.Context', meaning: '显式传递取消、期限和值的标准库接口' }], takeaway: '先会读普通 Go 的调用约定，才能判断生成 hook 是否正确。' },
    outcomes: ['能读函数、package、import、module、指针和 interface 的最小例子', '能用 defer 覆盖函数结束，并正确处理多返回值和 error', '能解释 context.Context 为什么要显式传递，并知道 CallContext 是工具接口而非 context.Context'],
    sections: [
      sec('函数的输入、输出和错误', ['Go 函数可以有多个返回值，最常见的约定是“结果 + error”。error 是一个值，不是自动抛出的异常；调用者要检查它。'], `package main\n\nimport "fmt"\n\nfunc divide(a, b int) (int, error) {\n    if b == 0 { return 0, fmt.Errorf("divide by zero") }\n    return a / b, nil\n}\n\nfunc main() {\n    result, err := divide(6, 2)\n    if err != nil {\n        fmt.Println("failed:", err)\n        return\n    }\n    fmt.Println(result)\n}`, 'go', '完整小程序；可单独保存为 main.go 后用 go run main.go 运行。'),
      sec('defer：无论从哪里 return，都做收尾', ['defer 会把一个调用安排到当前函数即将返回时执行。它适合关闭文件、结束计时或结束一个观测记录；进程被强制终止时不会执行。'], `func work() (result int) {\n    start := time.Now()\n    defer func() { fmt.Println("elapsed:", time.Since(start)) }()\n    return 42\n}`, 'go', '函数阅读片段；放入含 fmt、time 导入的完整程序，并在 main 中调用 work 才能运行。'),
      sec('package、import、module 的阅读顺序', ['读陌生 Go 目录时，先看每个 .go 文件的 package 行，再看 import，最后看最近的 go.mod。go.mod 中的 module 行是本模块名字，require 行表示依赖；replace 是“本地或指定位置替代某个依赖”的构建指示，不是 Go 语言语法。'], `module example.com/app\ngo 1.25\nrequire example.com/lib v1.2.3\nreplace example.com/lib => ../lib`, 'go.mod', '这是结构示意，不代表本课程上游 go.mod 的完整内容。'),
      sec('interface、指针和工具自己的 CallContext', ['interface 可以理解为“只声明我需要哪些方法”。如果方法写在 *T（指针类型）上，通常是 *T 满足接口，而 T 不一定满足；编译器会在赋值时检查。'], `type Greeter interface { Greet() string }\ntype User struct { Name string }\nfunc (u *User) Greet() string { return "hi " + u.Name }\nvar g Greeter = &User{Name: "Go"}`, 'go'),
      sec('context.Context 要显式传，CallContext 不是它', ['context.Context 是标准库接口，用来传取消信号、deadline 和请求范围的值；Go 不会因 go f() 自动复制它。需要把 ctx 作为参数传给子函数或任务。', 'LoongSuite 的 CallContext 是插桩 hook 用来读写目标函数参数、返回值和共享数据的工具接口；它不等于 context.Context，也不能替代 context 的取消或传播。GLS 同样是工具/runtime 的额外机制，不是 Go 原生自动 context。'], `func child(ctx context.Context) { fmt.Println(ctx.Value("request")) }\nctx := context.WithValue(context.Background(), "request", "demo")\nchild(ctx)`, 'go')
    ],
    walkthrough: [walk('pkg/api/api.go', 'CallContext', '阅读 hook 与被拦截函数之间的数据契约'), walk('pkg/api/impl.go', 'CallContextImpl（测试用）', '用简化实现理解字段存取；真实生成实现继续看 tool/instrument/impl.tmpl'), walk('docs/user/context-propagation.md', 'Context Propagation', '比较原生 context 与 GLS 补救机制')],
    lab: { title: '亲眼比较传 ctx 和重新开始', steps: ['进入 labs/01-context，找到 request 中保存的字符串 trace-request；这只是教学标识。', '比较把 request 显式交给新协程，与使用 context.Background() 的两条路径。', '找到预先启动的 worker：任务通过 jobs channel 传入 context，检查它拿到的是哪一份。'], command: 'cd labs/01-context\ngo run .', expected: '顺序可能变化，但共有两行 trace-request 和一行 <root>；Background 没有教学标识。此实验不创建 OTel Span，真实 Span 在第 05 章的 labs/05-otel 验证。', challenge: '把 jobs <- request 改成 jobs <- context.Background()，先预测输出，再运行；完成后恢复。' },
    quiz: [q('阅读一个接收 context.Context 的 hook 时，哪种调用最能保持父链？', ['把当前 ctx 作为参数传入并在子操作中继续使用', '在子操作开始时用 context.Background()，再把 TraceID 写入日志', '把 ctx 存到全局变量，供所有 goroutine 读取'], 0, '显式传递保留取消、deadline 和 SpanContext；Background 会丢父链，全局变量又会造成并发串链和生命周期问题。'), q('某类型只有指针 receiver 的方法，为什么值 T 作为接口参数可能编译失败？', ['接口方法集只收集导出方法，指针 receiver 不会自动属于 T 的方法集', '编译器会为所有值自动复制一份指针方法，因此不会失败', '方法集只影响运行时反射，不影响接口赋值'], 0, '指针和值的方法集不同，接口赋值在编译期检查；第二项混淆了自动取址场景，第三项错误地把静态类型检查归为反射。')],
    checkpoint: ['能解释 context.Context 的取消、deadline、值和显式传递', '能定位一个多返回值函数哪个返回值是 error', '能说出 CallContext 与 context.Context 的用途不同'], sources: [{ title: 'Go Context blog', url: 'https://go.dev/blog/context' }, { title: 'Effective Go', url: 'https://go.dev/doc/effective_go' }], visual: 'context'
  },
  {
    id: 'build', title: '从 otel go build 到目标二进制', subtitle: '理解 -toolexec、缓存和为什么编译时间会增加', stage: '机制', minutes: 60, prerequisites: ['go-foundations'],
    bridge: { known: '你知道 go build 会生成二进制。', problem: '普通构建不会自动进入 LoongSuite 的预处理和改写阶段。', idea: '用 otel go build 包住构建，并观察 -toolexec 如何接入 compiler。', terms: [{ term: 'toolchain', meaning: '编译器、链接器等构建工具链' }, { term: '-toolexec', meaning: '让 go 命令调用一个工具包装器' }, { term: 'cache', meaning: '可复用的构建结果' }], takeaway: '插桩先进入构建链，才有机会改变编译输入。' },
    outcomes: ['能解释 go build 的 toolchain 调用层级', '能找到预处理与 instrument 阶段的日志', '能区分 Go 缓存命中与插桩缓存策略'],
    sections: [
      sec('go build 的真实入口', ['普通 go build 会解析 go.mod、构建依赖包并调用编译器和链接器。LoongSuite 的 otel 命令包住这次构建，通过 Go 的 -toolexec 或等效工具链钩子拦截编译动作，识别哪些 package 应被改写，再把结果交给原始 compiler。', '阅读入口时先找命令参数解析和子进程执行，而不是先看某个 Redis hook。你要能回答“这个 package 何时被发现、源码何时被解析、失败如何返回给 go build”。']),
      sec('预处理与 instrument', ['预处理阶段通常准备依赖、生成配置或注入基础支持代码；instrument 阶段读取目标包、匹配规则、修改 AST/DST 并写入临时源码或编译输入。最终仍需让 go compiler 检查类型，所以插桩失败通常表现为编译失败。', '文档明确说明自动插桩在原始编译前增加 Preprocessing 和 Instrument 两个阶段。用日志时间戳拆分这三段，才能判断是网络拉依赖慢、AST 改写慢，还是 Go 本身慢。']),
      sec('为什么缓存不能简单照搬', ['Go build cache 以输入文件、编译参数、工具版本等为依据。插桩会改变源码、增加依赖和标准库支持文件；如果工具没有把规则版本和 probe 内容纳入缓存键，就可能复用错误产物。因此上游文档曾选择更保守的全量重编译。', '优化缓存的正确问题不是“能不能复用旧 .a”，而是“规则、probe、SDK、Go 版本和目标源码都相同时能否证明产物等价”。在 CI 中保留模块下载缓存和 Go build cache 可以缩短依赖准备，但不能掩盖插桩输入变化。']),
      sec('动手读日志', ['用一个小模块执行 go build -x 或 -work，保存命令；再执行 otel go build，比较 compiler 参数、临时目录和生成文件。不要把缓存目录提交到业务仓库。', '每次实验记录 GOTOOLCHAIN、GOOS、GOARCH、工具版本、规则快照和输出 hash。这样你才能复现“昨天通过、今天失败”的构建。'], `go env GOMOD GOTOOLCHAIN GOOS GOARCH GOCACHE GOPATH\ngo build -x -work ./...\notel go build -x -work ./...`, 'sh')
    ],
    walkthrough: [walk('tool/otel/main.go', 'main', '定位 otel 命令的入口和参数转发'), walk('docs/user/compilation-time.md', 'Compilation Time', '将文档的时间模型映射到日志'), walk('pkg/otel_setup.go', 'initOpenTelemetry', '看注入侧 SDK 依赖与版本固定说明')],
    lab: { title: '做一次编译对照', steps: ['用同一个 demo 分别运行普通 go build 和 -toolexec 包装器。', '把命令输出按 compile、link 分类。', '删除只属于本地工具的临时输出后比较二进制 hash。'], command: 'cd labs/03-toolexec && mkdir -p .bin && go build -o .bin/toolexec ./wrapper && TOOLEXEC_LOG=$PWD/toolexec.log go build -toolexec=$PWD/.bin/toolexec -o .bin/app . && .bin/app && grep -E "compile|link" toolexec.log', expected: '实验输出包含 compile、link 调用；这只验证 toolexec 边界，不等同于完整 LoongSuite 插桩。', challenge: '提出一个安全缓存键，至少包含 Go 版本、工具 commit、规则 hash、probe hash、go.mod 和目标源码 hash。' },
    quiz: [q('要证明 -toolexec 已进入 Go 构建链，哪项证据最直接？', ['运行后的 Trace 数量增加', 'wrapper 日志中出现 go tool 的 compile/link 调用且程序仍能运行', '只看到 go build 命令返回 0'], 1, 'toolexec 首先是工具链包装边界；Trace 还受规则、运行时和采样影响，单看退出码也不能证明包装器实际处理了目标动作。'), q('插桩编译缓存键缺少规则文件 hash，最可能出现什么？', ['源码不变时总会重新编译，只有性能损失', '规则修改后仍复用旧的生成产物，导致行为与源码配置不一致', '链接器会自动读取新规则并修复缓存'], 1, '规则是插桩输入，不能省略；第一项方向相反，第三项把构建缓存和运行时配置混为一谈。')],
    checkpoint: ['能从 go build -x 找到 compiler 调用', '能解释 Preprocess、Instrument、Compile 的顺序', '能写出不包含凭据和业务缓存的构建证据'], sources: [{ title: 'Go command reference', url: 'https://pkg.go.dev/cmd/go' }, { title: 'Compilation Time', url: `${docs}/user/compilation-time.md` }], visual: 'pipeline'
  },
  {
    id: 'ast', title: 'AST 与 DST：把源码变成可安全改写的树', subtitle: '从 token、节点、位置到生成可编译代码', stage: '机制', minutes: 75, prerequisites: ['build'],
    bridge: { known: '你知道工具会在编译前处理源码。', problem: '字符串替换无法可靠区分函数、方法、return 和 import。', idea: '把 Go 源码解析成树，按节点改写后再交给编译器。', terms: [{ term: 'AST', meaning: '表示语法结构的树' }, { term: 'DST', meaning: '保留格式和注释信息的可改写树' }, { term: 'receiver', meaning: '方法声明中绑定接收者的部分' }], takeaway: '安全改写依赖结构化节点，不依赖猜字符串。' },
    outcomes: ['能在 dst.File 中寻找函数和 receiver', '能构造调用、defer、return、import 节点', '能解释源码位置保留和类型检查的重要性'],
    sections: [
      sec('为什么不是字符串替换', ['字符串替换不知道注释、泛型、作用域、嵌套函数和多返回值。AST 把 package、声明、函数、表达式和语句表示为结构；DST 在 AST 基础上保留装饰信息，使改写后格式和注释更可控。', '插桩工具必须避免把同名函数、方法 receiver 和不同 package 混在一起。本课程固定版本的 FindFuncDecl 对 function 使用字符串相等，对 receiverType 使用正则；上游文档说 Function 可用正则，与这里的实现并不一致。二开时必须沿真实匹配函数核验。']),
      sec('AST 与 DST 的差别要逐行看', ['标准 go/ast 表示语法结构，适合分析声明和位置；类型信息需结合 go/types 或项目的类型处理，单靠 AST 不等于完成语义分析。dave/dst 额外保存空白、注释和装饰信息，适合改完仍保留原文件结构。DST 不是另一门语言，节点仍然代表 Go 语法。', '调试时可先用 go/parser 验证语法，再用 dst.Clone 和项目 helper 修改；改写后重新格式化并重新解析验证。']),
      sec('读 parser 和 shared helper', ['tool/ast/parser.go 负责 ParseSource、ParseFile、WriteFile；tool/ast/shared.go 提供 FindFuncDecl、FindStructDecl、AddImportForcely 和类型判断。先理解这些小函数，再读复杂 rule；否则你会把“树遍历问题”误判为“某个库的业务逻辑”。', '泛型带来 IndexExpr 和 IndexListExpr，指针 receiver 带来 StarExpr。版本兼容规则若只处理旧 AST 形状，升级 Go 或第三方库后就可能漏匹配。']),
      sec('改写函数的三个位置', ['OnEnter 代码要插入原函数体最前面；OnExit 需要在所有 return 前结束或用 defer；如果要观察命名返回值，函数签名和 return 形状必须支持。直接在最后一条语句后追加代码无法覆盖提前 return 和 panic。', '当 hook 需要修改参数或返回值，CallContext.SetParam/SetReturnVal 会通过生成的中间变量传递变化。这个能力会影响求值顺序和副作用，必须用测试锁定。固定版本对泛型目标不支持 SetParam / SetReturnVal，生成的 setter 会 panic；hook 中的 panic 还可能被桥捕获，不能据此认为修改成功。']),
      sec('生成后的源码是第一证据', ['调试插桩时不要只看规则 JSON。保存 instrument 后的临时 .go 文件，检查 import 是否重复、变量名是否冲突、defer 是否在正确作用域、return 值是否仍匹配。最后运行 gofmt、go test 或 go tool compile。'], `func target(x int) (int, error) {\n    call := api.NewCallContext()\n    hookEnter(call, x)\n    defer hookExit(call)\n    return x + 1, nil\n}`, 'go', '这是示意代码；真实生成形式以具体 rule 和版本为准。')
    ],
    walkthrough: [walk('tool/ast/parser.go', 'ParseFile / WriteFile', '从文件读取 DST 并写回源码'), walk('tool/ast/shared.go', 'FindFuncDecl / AddImportForcely', '跟踪函数匹配与 import 处理'), walk('tool/ast/primitives.go', 'CallTo / DeferStmt / ReturnStmt', '学习生成节点的最小构造器')],
    lab: { title: '写一个最小 AST 改写实验', steps: ['建一个只含 func Add(a,b int) int 的临时 package。', '用 go/parser 或 dave/dst 找到 Add，并插入 fmt.Println。', '写出改写文件并 go test，失败时先看生成源码。'], command: 'cd labs/02-ast && go run .', expected: '能生成可格式化、可编译的源码，并能解释每个新增节点。', challenge: '把 Add 改成两个返回值，说明为什么原有 return 注入可能失效。' },
    quiz: [q('规则只写 Function=Do，目标包同时有 free function 和 *Client.Do 方法，为什么还要核对 ReceiverType？', ['receiver 决定方法身份，缺失时可能误匹配另一条调用路径', 'receiver 只影响生成的 Span 名，不影响匹配对象', 'receiver 由 Go linker 在运行时自动推断，所以规则不需要它'], 0, '方法的 receiver 是声明身份的一部分；第二项低估了匹配阶段，第三项把编译期规则解析误说成运行时推断。'), q('函数中间有 early return，想保证退出 hook 总会执行，哪种改写思路更稳妥？', ['只在源码最后追加一条语句，依赖控制流自然到达', '把 hook 放到所有 return 前，但忽略 panic 和新增分支', '用统一的退出路径或 defer 保存必要状态，再按原返回签名结束'], 2, '统一退出路径或 defer 能覆盖多个正常返回，并可单独设计 panic 语义；只追加末尾会漏 early return，逐个插入容易漏分支。')],
    checkpoint: ['能在 dst AST 中定位目标 FuncDecl', '能解释正则过宽造成的误插桩', '能保存并检查一份生成源码，而不是只看编译成功'], sources: [{ title: 'AST parser helpers', url: `${upstream}/tool/ast/parser.go` }, { title: 'Hook development', url: `${docs}/dev/hook.md` }], visual: 'source'
  },
  {
    id: 'otel', title: 'OpenTelemetry 运行时：Span 从哪里来、到哪里去', subtitle: 'API、SDK、采样和 exporter 的职责分工', stage: '机制', minutes: 65, prerequisites: ['go-foundations'],
    bridge: { known: '你已经理解函数可以被加上记录点。', problem: '记录点产生的数据还要经过 API、SDK、采样和导出。', idea: '沿一条 Span 从创建到后端的流水线分清职责。', terms: [{ term: 'Span', meaning: '一次操作的开始、结束和属性记录' }, { term: 'TraceID', meaning: '标识整条链路的 ID' }, { term: 'sampler', meaning: '决定是否记录或保留 Span 的组件' }, { term: 'exporter', meaning: '把数据发送到后端的组件' }], takeaway: '有上下文不等于已记录，更不等于已导出。' },
    outcomes: ['能区分 OTel API 与 SDK', '能用 ParentBased 理解采样结果', '能解释“日志有 TraceID 但后端没有 Trace”'],
    sections: [
      sec('API 与 SDK 的两层设计', ['OTel API 提供 Tracer、Span、Context 和 Propagator 接口；SDK 提供 TracerProvider、Sampler、SpanProcessor 和 Exporter。插桩 hook 应依赖 API，应用启动配置 SDK，这样换 exporter 不必改每条业务 hook。', 'Noop provider 仍可以返回合法对象，但不会导出数据。观察到 TraceID 字符串不能直接证明 Span 被记录；要同时检查 IsRecording、采样 flag、processor 和 collector 入库。']),
      sec('Start 的父子规则', ['Tracer.Start(ctx,name) 会从 ctx 读取当前 SpanContext。ctx 有有效本地 Span，就创建 child；没有就创建 root。context.WithoutCancel(ctx) 只移除取消与 deadline 传播，不等于创建新 Trace，也不应被误解成“脱离父 Span”。', '手动埋点和自动 hook 只要使用同一个 ctx 和 TracerProvider，就能形成一棵树。若 hook 使用 Background 或 GLS 取到另一份上下文，就会出现并列根 Span。']),
      sec('采样不是查询失败的同义词', ['ParentBased sampler 会优先尊重远程父节点的 sampled flag，再决定子 Span 是否 RecordAndSample。网关采样、collector tail sampling、存储延迟都可能让日志存在而 Trace 查询暂时为空。', '验证时记录请求时间、tenant、等待时间和查询接口；第一次 404 不足以证明丢数据。对比 TraceID、SpanID、parent references 和 process serviceName，而不是只看页面颜色。']),
      sec('属性、事件和状态', ['Span name 表示操作类型；attributes 用于可聚合维度；events 记录时间点；status 表示错误语义。把完整请求体、token 或高基数字段塞进 attributes 会造成隐私和成本风险。自动插桩的错误判断必须和业务语义分开。']),
      sec('API、SDK、processor 的分工', ['API 让 hook 能调用 tracer.Start；SDK 的 TracerProvider 决定实现对象；Sampler 决定是否记录和采样；SpanProcessor 决定同步或批量处理；Exporter 决定发送到哪里。把这些层混成“OTel 负责上报”会让排障失去方向。', '例如 API 返回有效 Span 但 provider 是 noop，hook 运行了而后端没有数据；batch processor 尚未 flush，短进程退出，也会造成查询为空。'])
    ],
    walkthrough: [walk('pkg/inst-api/instrumenter/instrumenter.go', 'Instrumenter', '看注入代码依赖的 instrumenter 接口层'), walk('pkg/otel_setup.go', 'initOpenTelemetry', '确认 SDK/exporter 初始化和固定版本'), walk('docs/user/sdk-config.md', 'SDK configuration', '列出环境变量与采样配置的来源')],
    lab: { title: '追一棵真实 Span 树', steps: ['运行内存 exporter 实验，观察 request、child、remote-child。', '对照 detached 的新 TraceID，确认 Background 路径成为新根。', '查看 unsampled-child 的断言：有有效 TraceID，但 IsRecording 为 false，也没有导出。'], command: 'cd labs/05-otel && go run .', expected: '输出四个已导出的 Span，程序对 TraceID、ParentSpanID、remote 标志和未采样路径作断言；它不连接远端 Collector。', challenge: '为一个预期的 HTTP 400 设计状态策略，避免把所有非 2xx 都标为系统错误。' },
    quiz: [q('日志中已有有效 TraceID，但后端没有对应 Span，哪项仍需核验？', ['只需重新生成 TraceID，原 ID 一定是错误的', '采样决策、Span 是否 recording、processor/exporter 和后端查询范围', '只需检查 Span 名称，导出链路与名称无关'], 1, '上下文存在不等于被采样、处理和入库；改 ID 会破坏关联，名称检查也不能替代导出诊断。'), q('ParentBased sampler 处理一个带远端父 Span 的请求时，主要依据是什么？', ['父 Span 的采样决策，并结合本地配置处理无效父级', '当前函数是否返回 error，再决定父链是否存在', '响应头是否已经写入 TraceID'], 0, '它关注父级采样上下文；业务 error 和响应头是其他层面的信息，不能替代 sampler 的输入。')],
    checkpoint: ['能画 API→SDK→processor→exporter→backend', '能解释一条日志有 trace_id 但 Trace 查询为空的至少三种原因', '能区分 Span name、attributes、events、status'], sources: [{ title: 'OpenTelemetry Go', url: 'https://github.com/open-telemetry/opentelemetry-go' }, { title: 'OTel SDK configuration', url: `${docs}/user/sdk-config.md` }], visual: 'sampling'
  },
  {
    id: 'context', title: 'Context 与传播：一条链怎样跨 goroutine 和进程', subtitle: '把“自动继承”放回真实边界里', stage: '机制', minutes: 80, prerequisites: ['go-foundations', 'otel'],
    bridge: { known: '你知道 Span 可以挂在 context 上。', problem: 'goroutine、HTTP 和消息队列会把一次调用带到新的边界。', idea: '在任务或 carrier 中显式传递，再比较 GLS 这类额外补救。', terms: [{ term: 'carrier', meaning: '承载传播字段的 header 或消息属性' }, { term: 'Inject', meaning: '把当前上下文写入 carrier' }, { term: 'Extract', meaning: '从 carrier 读出远端上下文' }, { term: 'GLS', meaning: '工具/runtime 维护的额外关联机制' }], takeaway: '跨边界的父子关系必须有交接证据。' },
    outcomes: ['能区分 context 传递、HTTP carrier 和消息 carrier', '能解释 B3 单头、多头与 W3C 的优先级风险', '能判断 GLS 能覆盖什么、不能覆盖什么'],
    sections: [
      sec('进程内与进程间是两件事', ['进程内的 context 是 Go 值，函数可以显式传递；进程间不能直接发送 context，只能用 propagator 把 SpanContext 编码进 HTTP header、gRPC metadata 或消息 properties。消费者必须从 carrier Extract 后再 Start。', '一个服务全部接入 OTel 也不会自动修复消息字段为空；发送端没有 Inject，消费端只能创建新根。这个区别是理解“全链路”最重要的边界。']),
      sec('W3C 与 B3', ['W3C 用 traceparent 单头携带 version、TraceID、parent-id 和 flags；B3 多头拆成 X-B3-TraceId、X-B3-SpanId、X-B3-Sampled，B3 单头把它们组合在 b3。它们表达相似信息，但不能把两个不同父节点同时当成真相。', 'Composite propagator 的顺序会影响冲突输入。旧版 tracing 的 OTLP 初始化顺序是 TraceContext、Baggage、B3MultipleHeader；B3 extractor 本身会优先有效 b3 单头，再回退多头。网关应统一清理和重注入，而不是让下游猜。']),
      sec('GLS 与 goroutine', ['LoongSuite 文档描述了 GLS：创建 Span 时保存数据，新 goroutine 创建时复制对应结构，后续 Start 可从 GLS 读取最近 Span。这是编译期插入和 runtime hook 的联合能力，不是 Go 规范。', '它对普通、工具可识别的 go 语句可能有效；预先创建的 worker 只是在任务提交时执行，创建 worker 的时刻并没有当前请求。正确做法仍是提交 Job 时携带 ctx 或 carrier，worker 执行时恢复它。']),
      sec('传播流程', ['HTTP 服务端先 Extract，再创建 server Span；客户端在发送前 Inject 当前 ctx。消息生产者创建 producer Span 并 Inject 到 properties；消费者 Extract、创建 consumer Span，并根据语义决定 child 或 Span Link。', 'Span Link 适合一个批量任务由多条消息或多个请求共同触发；强行选择单一父节点会丢失因果关系。'])
    ],
    walkthrough: [walk('docs/user/context-propagation.md', 'Context Propagation', '对照 GLS 说明与 Go 原生语义'), walk('pkg/rules/otel-sdk/trace/v1_39_0/otel_trace_context_linker.go', 'trace context linker', '跟踪 SpanContext 与工具上下文的连接'), walk('pkg/rules/http/server_setup.go', 'server setup', '找 HTTP 服务端提取和客户端注入的 hook')],
    lab: { title: '做传播矩阵', steps: ['准备 pure W3C、B3 multi、B3 single、W3C+B3 冲突四组 header。', '记录 Extract 后的 TraceID、SpanID、IsRemote。', '再模拟网关创建新出站 Span，检查是否清理旧 b3。'], command: 'cd labs/06-propagation && go run .', expected: '真实 propagator 对每行断言 TraceID、SpanID 和 IsRemote。旧单头残留与清理后的案例保持相同 TraceID，父 SpanID 不同；这是载体模型，不是真实网关验收。', challenge: '设计消息 properties 的最小字段集合，同时保留采样和 baggage。' },
    quiz: [q('消息自动插桩已经产生 publish 和 consume Span，但两者 Trace 不相连，最可能缺少哪一步？', ['给 consume Span 改一个更短的名称', '把生产侧 SpanContext 注入消息属性，并在消费侧从同一属性提取', '只给 exporter 增加 flush 次数'], 1, 'Span 创建与跨进程关联是两件事；名称或 flush 不能凭空提供消息中的父上下文。'), q('GLS 机制与 Go 原生 context 的关系，哪项准确？', ['GLS 是语言规范的一部分，任何 goroutine 都自动可用', 'GLS 只能替代 context，显式 ctx 传递反而会重复', 'GLS 是工具/runtime 层的补救，不能替代跨任务和跨进程交接'], 2, 'Go 不保证隐式继承；GLS 有覆盖和版本边界，任务队列及消息 carrier 仍需显式传递。前两项都把工具机制夸大成语言保证。')],
    checkpoint: ['能画 HTTP 和消息两条 Inject/Extract 流程', '能说明 B3 单头与多头并存为何危险', '能为预创建 worker 写出显式任务交接接口'], sources: [{ title: 'Context propagation', url: `${docs}/user/context-propagation.md` }, { title: 'OpenTelemetry propagation API', url: 'https://github.com/open-telemetry/opentelemetry-go/blob/main/propagation/propagation.go' }], visual: 'propagation'
  },
  {
    id: 'architecture', title: '源码架构导航：从命令到 hook 的调用链', subtitle: '建立可重复的阅读路线', stage: '源码', minutes: 80, prerequisites: ['build', 'ast', 'otel'],
    bridge: { known: '你已看过构建、改写和运行时三条线。', problem: '源码分散在命令、规则、API、probe 和测试目录。', idea: '沿一条真实调用链定位每层的入口和产物。', terms: [{ term: 'preprocess', meaning: '准备临时构建目录和依赖' }, { term: 'instrument', meaning: '匹配并改写目标编译输入' }, { term: 'probe', meaning: '规则命中的运行时 hook 代码' }], takeaway: '先画文件之间的调用路线，再深入单个库规则。' },
    outcomes: ['能按入口、编译管线、规则、API、运行时五层定位源码', '能读懂一条规则的全生命周期', '能使用 rg、go list 和测试反向验证推断'],
    sections: [
      sec('五层地图', ['第一层是 CLI 和构建代理；第二层是 preprocessing/instrument 编译管线；第三层是 tool/data 中的规则与版本匹配；第四层是 pkg/api、pkg/inst-api 和各 rule probe；第五层是 OTel runtime、GLS 和 exporter。', '从一个真实 hook 反向走：规则 JSON 告诉你匹配函数，rule 目录告诉你 OnEnter/OnExit，api.CallContext 告诉你参数如何保存，生成源码告诉你插入位置，最终 Span 树告诉你运行时是否正确。']),
      sec('为什么先读接口再读库规则', ['如果直接读 goredis 或 echo rule，你会把通用机制和库特例混在一起。先读 CallContext、instrumenter interface、rule parser，再读一个简单 net/http rule，最后读复杂数据库 rule。', '每个陌生符号都记录“定义、调用者、输入、输出、失败方式”。只读定义不读调用点，容易把工具的约定写成臆测。']),
      sec('根模块与 pkg 模块', ['仓库存在根 go.mod 和 pkg/go.mod 等边界。根模块主要构建命令、测试和开发工具；pkg 模块是注入到目标程序的 API/runtime。二开时要确认新增 import 放在哪个模块，避免本地能编译、用户目标项目无法解析。']),
      sec('阅读工具链', ['rg 找符号和字符串，go list -deps 找模块图，go doc 看接口契约，go test -run 缩小验证，git show 固定 commit。每读完一层就运行一个最小测试，避免一次读完整仓库后才发现基础假设错了。'])
    ],
    walkthrough: [walk('tool/otel/main.go', 'main', '确认仓库根部的可执行入口'), walk('tool/instrument/trampoline.go', 'trampoline', '从工具包定位参数和返回值改写'), walk('pkg/api/api.go', 'CallContext', '区分目标程序依赖的注入 API 与工具自身')],
    lab: { title: '画一条规则的源码路线', steps: ['选 net/http 或 echo。', '从 rules 数据文件找到 ImportPath 和 Function。', '反查 probe 的 OnEnter、OnExit、CallContext 和测试。'], command: '设计练习：本章没有独立测试命令；在 pinned upstream 根目录执行 rg -n "net/http|OnEnter|OnExit|CallContext" tool pkg test，并把结果按规则、probe、API、fixture 分组。', expected: '得到至少五个文件的有向阅读链，并能解释每一跳；不要把 guide 目录的 labs 输出当作源码规则测试。', challenge: '把路线改写成一个新人可以执行的 10 分钟排障清单。' },
    quiz: [q('定位一条规则为何没有命中时，哪组字段应优先与目标依赖源码对照？', ['目标 import path、函数和 receiver、版本区间及依赖版本', '先看 Span 名和 exporter 地址，再回头猜函数签名', '只比较文件名，因为规则会忽略模块版本'], 0, '匹配发生在目标符号和版本边界上；Span 名及 exporter 属于运行时，文件名也不能代替 import path 和签名。'), q('根模块和 pkg 子模块的 go.mod 分开时，二开者首先应如何使用它们？', ['把所有新 import 都放根模块，子模块会自动继承', '确认每个文件所属模块及其依赖边界，再在对应模块运行 go list/test', '删除子模块 go.mod，让工具统一解析依赖'], 1, '模块边界决定解析和构建上下文；自动继承和删除模块都会改变上游构建语义。')],
    checkpoint: ['能画五层架构', '能用 rg 从规则反查 probe', '能为一个推断写出对应测试和证据'], sources: [{ title: 'Repository tree', url: upstream }, { title: 'Developer overview', url: `${docs}/dev/overview.md` }], visual: 'source'
  },
  {
    id: 'rules', title: '规则系统：版本范围不是装饰', subtitle: '从匹配条件到“为什么没命中”', stage: '源码', minutes: 75, prerequisites: ['architecture', 'ast'],
    bridge: { known: '你能从命令追到规则和 AST helper。', problem: '同名函数可能来自不同包、receiver 或版本。', idea: '用 import、实际函数名、receiver 和版本区间精确匹配。', terms: [{ term: 'ImportPath', meaning: '目标 package 的完整导入路径' }, { term: 'version range', meaning: '规则适用的库版本区间' }, { term: 'fixture', meaning: '用于验证命中结果的小测试工程' }, { term: 'muzzle', meaning: '检查规则边界和误匹配的测试' }], takeaway: '固定 v1.15.0 中 Function 名称按实际相等匹配，不要把它想成正则。' },
    outcomes: ['能读 Function、ReceiverType、Dependencies、Version', '能正确解释半开区间版本', '能为库升级设计规则和测试'],
    sections: [
      sec('规则字段的真实语义', ['函数规则的常见字段包括 ImportPath、Function、ReceiverType、OnEnter、OnExit、Path 和 Version；并不是每个字段都必填，未指定版本约束等情况要结合规则类型读实现。Dependencies 表示目标项目必须已有的依赖，避免工具为了一个可选库强行改变 go.mod。', 'v1.15.0 的文档声称 Function 与 ReceiverType 支持正则，但 tool/ast/shared.go 的 FindFuncDecl 实际以 function == funcDecl.Name.Name 匹配函数名。ReceiverType 才走正则，而且非空 receiver 过滤会排除普通函数。使用 .* 前先看实现，不要只读文档。']),
      sec('半开区间', ['[1.22.0,1.25.10) 表示大于等于 1.22.0 且严格小于 1.25.10。1.25.10 不匹配，1.25.12 更不匹配；不能按“主版本差不多”判断。', '库升级后先查 API 是否变化，再决定扩展范围还是新增版本规则。扩大范围可能让 hook 误用已经改变签名的函数；新增规则能隔离差异，但维护成本更高。']),
      sec('匹配失败的诊断顺序', ['先确认 go list -m 给出的 module version，再确认 ImportPath 和包是否在编译图中；然后检查 Function/ReceiverType 的真实名字，最后检查 Dependencies 和规则文件是否被打包进工具。', '如果编译成功但没有 Span，可能是采样、hook 没触发、函数走了另一条路径或 exporter 未连接；不要直接把它归因于版本范围。']),
      sec('一次真实的文档与实现差异', ['打开 tool/ast/shared.go:198，先看函数名筛选，再看 receiver 的分支。Function 写成 .*ServeHTTP，在这个未打补丁的版本中不会像文档承诺那样匹配；这与你之前需要 function-regex 补丁的场景有关。', '若要二开支持正则，先决定是否使用完整匹配、如何处理无效表达式，再为精确函数名、模式、普通函数、指针 receiver、泛型 receiver 和反例分别测试。不要把尚未修改的上游当成补丁版。'], `// v1.15.0 摘录：函数名在这里按相等匹配\nfunc FindFuncDecl(root *dst.File, function string, receiverType string) []*dst.FuncDecl {\n    decls := findFuncDecls(root, func(funcDecl *dst.FuncDecl) bool {\n        return function == funcDecl.Name.Name\n    })\n    // 后续才按 receiverType 过滤；完整代码见固定提交。\n}`, 'go'),
      sec('规则改写与业务修改的边界', ['添加规则属于工具侧改造，目标业务代码可以零改动；但规则本身仍需要和目标依赖版本、函数签名、返回值语义配套。规则不能凭空给消息增加跨进程 carrier，也不能修改网关配置。'])
    ],
    walkthrough: [walk('docs/dev/rule_def.md', 'Types of Hook Rule', '逐字段建立规则检查表'), walk('tool/data/rules', 'rule JSON files', '比较同一库不同版本的规则'), walk('docs/dev/test.md', 'version tests', '理解最低版本、最新版本和 muzzle 检查'), walk('tool/ast/shared.go', 'FindFuncDecl', '核验文档的正则描述与当前实现差异')],
    lab: { title: '为一个版本缺口写规则计划', steps: ['选择你项目中高于现有上限的库版本。', '用 go doc 和源码比较旧、新函数签名。', '决定扩展半开区间还是新建规则，并写最小测试矩阵。'], command: '设计练习：本章没有独立测试命令；在目标服务模块运行 go list -m -json all，再在 pinned upstream 中对照 rules 数据和 test fixture。', expected: '输出当前依赖版本、现有规则范围和明确的匹配结论。', challenge: '为“函数名相同但 receiver 变化”设计 ReceiverType 正则和反例。' },
    quiz: [q('规则版本写成 [1.22.0, 1.25.10)，目标依赖为 1.25.10，正确判断是什么？', ['命中，因为右端版本也属于 1.25 系列', '不命中，因为半开区间不包含右端点', '只有 Go 版本会影响，库版本区间可忽略'], 1, '右端是开区间；系列相同不改变边界判断，库版本也正是规则匹配条件之一。'), q('规则日志显示已匹配，但没有看到 Span，下一步最有区分度的检查是什么？', ['先把版本区间放宽到 .*，确保任何版本都进入规则', '先确认生成 hook 是否执行，再分别检查采样、recording、processor/exporter', '直接在业务函数里再 Start 一个 Span 作为对照'], 1, '匹配、执行和导出是不同层；放宽规则可能引入误匹配，重复手动 Span 会污染诊断。')],
    checkpoint: ['能手算三个边界版本是否匹配', '能为一条规则列出依赖、函数、receiver、返回值检查', '能把“规则问题”和“运行时上报问题”分开'], sources: [{ title: 'Rule definition', url: `${docs}/dev/rule_def.md` }, { title: 'Testing rules', url: `${docs}/dev/test.md` }], visual: 'rule'
  },
  {
    id: 'hooks', title: 'Hook 与 linkname：如何接入而不破坏调用约定', subtitle: 'OnEnter、OnExit、trampoline 和参数返回值', stage: '源码', minutes: 85, prerequisites: ['ast', 'rules'],
    bridge: { known: '你知道规则何时命中目标函数。', problem: '命中后生成的 hook 必须保持原参数、返回值和控制流。', idea: '用 OnEnter/OnExit 和 trampoline 包住原调用，并验证 error、panic、return。', terms: [{ term: 'hook', meaning: '在目标函数前后执行的插入代码' }, { term: 'trampoline', meaning: '保存原调用约定的跳转层' }, { term: 'OnEnter', meaning: '目标函数进入时运行的逻辑' }, { term: 'OnExit', meaning: '目标函数返回后运行的逻辑' }], takeaway: 'Hook 的第一契约是和原函数签名及控制流一致。' },
    outcomes: ['能写出签名匹配的 hook', '能解释 go:linkname 与 trampoline 风险', '能安全保存和恢复调用参数、返回值'],
    sections: [
      sec('Hook 的 ABI 契约', ['OnEnter 的第一个参数是 api.CallContext，后续参数按目标函数入参顺序排列；OnExit 的后续参数按返回值顺序排列。参数类型、receiver、variadic 和泛型形状必须一致。', '“看起来能编译”不够：错误的参数顺序可能让运行时读到错误值；interface{} 虽能承载值，但类型断言、nil interface 和指针层级要明确。']),
      sec('go:linkname 和 trampoline', ['go:linkname 把一个本包函数绑定到另一个符号名，使目标包调用路径能够进入 hook。工具在原函数入口插入 trampoline 跳转，生成参数与返回值的桥接代码，在进入和退出时调用 hook；它不是简单地保存一个函数地址再整体替换原函数。普通路径继续执行原函数体，skip 路径另行处理。', '这绕开普通可见性和包边界，依赖链接器符号、编译器实现和 runtime 约定。它适合工具内部桥接，不适合业务代码随意使用。']),
      sec('修改参数和返回值', ['CallContext.SetParam 可以在调用原始函数前替换参数，SetReturnVal 可以在退出时替换返回值。固定版本对泛型目标不支持这两种修改，生成 setter 会 panic。修改前先判断函数是否真的允许改变语义；观测型 hook 应优先只读，避免把 tracing bug 变成业务 bug。', '多返回值尤其要小心：error 可能是 nil interface、typed nil 或包装错误。SetReturnVal 的索引错一位，编译器未必能替你发现。']),
      sec('trampoline 如何处理多返回值', ['生成器通常把原函数调用放到临时变量中，再把这些变量交给 OnExit；若函数返回多个值，trampoline 必须按声明顺序保存每个值，hook 修改后再按同样顺序 return。', '命名返回值、裸 return、defer 和 panic 都会改变控制流，所以不能只在函数末尾追加一条 hook 调用。阅读 tool/instrument/trampoline.go 时，先找参数装箱、原始调用、返回值拆箱和 return 节点四段。']),
      sec('异常与清理', ['Span End 应覆盖正常返回和 error 返回；如果 hook 捕获 panic，必须保持原有 panic/recover 语义，不要吞掉业务 panic。defer 的执行顺序、闭包捕获变量和原函数是否已经注册 defer 都要在测试中观察。'], `// 示意：hook 只读返回值并保证结束\nfunc onExit(call api.CallContext, result any, err error) {\n    span := call.GetKeyData("span")\n    if s, ok := span.(trace.Span); ok {\n        if err != nil { s.RecordError(err) }\n        s.End()\n    }\n}`, 'go')
    ],
    walkthrough: [walk('docs/dev/hook.md', 'Write the Hook Code', '核对 linkname 和参数规则'), walk('tool/instrument/impl.tmpl', 'CallContextImpl 模板', '对照 trampoline.go 查看真实生成的 setter；pkg/api/impl.go 仅作测试帮手'), walk('pkg/rules/mux/mux_server_setup.go', 'OnEnter hook', '找一个简单、完整的 hook 作为模板')],
    lab: { title: '实现一个只记录耗时的 hook', steps: ['选择测试函数并写 OnEnter 保存 start time。', 'OnExit 取出 start time，记录 duration 后 End。', '加入 error、提前 return 和 panic 测试，确认清理不丢失。'], command: 'cd labs/04-custom-hook && go run main.go', expected: '普通编译基线输出 plain-result；完整 hook 构建按 labs/04-custom-hook/README.md 先构建 v1.15.0 工具，失败时保留失败日志。main.go 明确排除工具生成的 runtime stub。', challenge: '设计一个检测已有 otelhttp Span 的去重条件，并说明为什么“当前有 Span”不能简单等于“跳过所有客户端 Span”。' },
    quiz: [q('目标函数返回 (value, error)，OnExit 需要判断错误并允许修改返回值，哪项约束正确？', ['只接收 error 即可，value 会由 runtime 自动恢复', '按原函数返回顺序接收并保持类型/数量匹配，再决定是否调用 SetReturnVal', '把返回值编码成日志字符串即可，hook 签名不必一致'], 1, 'trampoline 需要按原签名保存和拆包；少接收、改成字符串或依赖 runtime 自动恢复都会破坏调用约定。'), q('引入 go:linkname 后升级 Go 或目标库，为什么必须重新跑构建/运行 fixture？', ['符号和 ABI/生成代码约定可能变化，旧的链接假设不具备稳定兼容性', 'linkname 只在注释阶段生效，升级不会影响二进制', '只要 TraceID 格式不变，链接符号就一定兼容'], 0, 'linkname 绕过普通可见性，依赖私有符号和工具链实现；协议字段格式不能证明 ABI 仍然一致。')],
    checkpoint: ['能写出目标函数与 hook 的签名对照表', '能解释 trampoline 如何保留原始调用', '能测试 error、panic、提前 return 三条路径'], sources: [{ title: 'Writing hook code', url: `${docs}/dev/hook.md` }, { title: 'CallContext API', url: `${upstream}/pkg/api/api.go` }], visual: 'hook'
  },
  {
    id: 'runtime', title: '运行时上下文：GLS、newproc 与真实限制', subtitle: '理解“协程自动继承”为什么不是魔法', stage: '源码', minutes: 85, prerequisites: ['context', 'hooks'],
    bridge: { known: '你已经知道显式 context 和 carrier 的边界。', problem: '新 goroutine 的创建时机可能早于真正的任务来源。', idea: '比较 newproc/GLS 的创建时复制与 worker 入队时的显式交接。', terms: [{ term: 'G', meaning: 'Go runtime 表示一个 goroutine 的结构' }, { term: 'newproc', meaning: 'runtime 创建新 goroutine 的路径' }, { term: 'worker', meaning: '等待任务并执行的长期 goroutine' }], takeaway: 'GLS 不是 Go 原生自动 context，不能替代任务和消息交接。' },
    outcomes: ['能说明 GLS 在什么时刻保存和读取 Span', '能区分新 goroutine 与预创建 worker', '能识别 runtime/ABI 适配风险'],
    sections: [
      sec('Go 的 GMP 只负责调度', ['G、M、P 是 goroutine、OS thread、processor 的调度模型。goroutine 被调度到哪个 M/P 与业务 Trace 没有天然关系；把 Span 放到 OS thread local 会在切换时错乱。', '因此上下文通常放在 context.Context 中显式传递。LoongSuite 通过对 goroutine 创建路径的编译/runtime 介入，维护自己的 GLS 数据，但这是一层额外协议。']),
      sec('newproc 与复制时机', ['当工具能识别 go 语句或 runtime newproc 路径时，它可以让新 G 复制父 G 的关联数据。这个复制发生在 goroutine 创建时，适合“请求中马上 go func()”的场景。', '预创建 worker 在服务启动时产生，此时没有请求 Span；之后任务提交只是把一个 Job 放入队列，工具无法凭空知道 Job 来自哪个请求。必须在交接处传 ctx 或 carrier。']),
      sec('GLS 与 context：上游实现和兼容策略', ['上游文档描述：新建 Span 会写入 GLS，新 goroutine 获取创建者的关联数据，后续创建 Span 时可从 GLS 最近的 Span 取父节点。v1_39_0 的 getOrInitTraceContext 直接读取 GLS；不能把它概括为“显式 context 永远优先”。具体选择还要沿 SDK hook 与 context linker 阅读。', '兼容改造建议：明确有效显式 context、远程父上下文、GLS 与 WithNewRoot 的优先级，再用冲突输入测试。这里的建议不是上游已保证的契约。生命周期恢复错误或旧 GLS 残留，可能造成错误 parent 或跨请求串链。', '并发测试比单请求测试重要：两个请求同时创建 goroutine，检查不同 TraceID、正确 parent、任务结束后的状态恢复。GLS 不能替代跨进程 carrier。']),
      sec('runtime 版本和安全边界', ['runtime 符号、栈布局、编译器生成代码和 ABI 在 Go 版本间可能变化。工具需要固定支持版本并为新版本做测试；用户升级 Go 不能只改 go.mod。出现 panic、错误 parent 或编译器崩溃时，先保留编译参数和 Go 版本。'])
    ],
    walkthrough: [walk('docs/user/context-propagation.md', 'GLS description', '将文档描述与实际 hook 对照'), walk('pkg/rules/otel-sdk/trace', 'context linker', '追踪 SpanContext 与 GLS 的连接'), walk('pkg/rules/otel-sdk/trace/v1_39_0', 'trace context linker', '观察版本目录隔离')],
    lab: { title: '比较两种 worker', steps: ['启动一个预创建 worker，提交不带 ctx 的任务。', '再次提交显式携带 ctx 的任务。', '并发提交两个不同 Trace 的任务，检查 parent 和 TraceID。'], command: 'cd labs/01-context && go run . | sort', expected: '显式任务交接保持链路；Background/无 carrier 任务成为新根或无父。', challenge: '给 worker 设计 cancel、deadline、Span 结束时机，避免任务结束前请求 context 已取消。' },
    quiz: [q('服务启动时预创建 worker，收到请求后才从队列取 Job；为什么创建时继承不到请求 Span？', ['worker 的 goroutine 已在请求之前创建，任务来源只在入队/出队时出现', 'worker 运行在独立 OS 线程，Go context 永远不能进入其中', '只要启用采样，runtime 会回溯找到最近请求'], 0, '继承时机早于任务来源；线程边界不是根因，采样也不会恢复未交接的上下文。'), q('在显式 ctx 与 GLS 同时可用的任务中，哪种读取策略更安全？', ['总是优先 GLS，因为它不需要改函数签名', '总是创建新根，避免任何父子关系', '优先有效的显式 ctx，GLS 仅作为受限补救并验证生命周期'], 2, '显式 ctx 的来源和生命周期可审计；无条件用 GLS 可能复用旧关联，直接新建根又丢失本可保留的父链。')],
    checkpoint: ['能区分 G 创建时间和任务提交时间', '能设计显式 worker 任务交接结构', '能列出 runtime 插桩升级 Go 的回归风险'], sources: [{ title: 'Context propagation', url: `${docs}/user/context-propagation.md` }, { title: 'Go runtime source', url: 'https://cs.opensource.google/go/go' }], visual: 'context'
  },
  {
    id: 'compatibility', title: '兼容已有 OTel：去重、入口和消息边界', subtitle: '以已有 OTel 服务为案例做决策', stage: '二开', minutes: 90, prerequisites: ['otel', 'context', 'hooks'],
    bridge: { known: '你能生成 Span 并解释传播边界。', problem: '已有手动或 otelhttp 埋点可能与自动规则重复。', idea: '按入口、操作和 wrapper 判断是否去重，而不是看到任意 Span 就跳过。', terms: [{ term: 'provider', meaning: '创建 tracer 和处理导出的 SDK 对象' }, { term: 'instrumentation scope', meaning: '标识某套埋点代码来源的信息' }, { term: 'dedup', meaning: '只跳过确实重复的埋点' }], takeaway: 'providerreuse/otelhttp 去重是自定义兼容设计，不是默认能力。' },
    outcomes: ['能制定自动与手动埋点的边界', '能识别重复 server/client Span 的来源', '能给 HTTP、gRPC、数据库和消息写兼容矩阵'],
    sections: [
      sec('入口只能有一套主埋点', ['同一个 Echo 或 net/http server 同时安装原有 otelecho 和自动 server rule，可能出现两个入口 Span。最安全的策略是选择一套 server 入口，另一套只保留指标或关闭 tracing handler。', '数据库、gRPC 和已有 otelhttp client 则要按库分别判断：如果自动规则能识别已有 instrumentation scope 或当前调用包装，应该跳过重复 client Span；不能用“ctx 里有任意 Span”作为全局跳过条件。']),
      sec('去重不是“Span 数量越少越好”', ['正常情况下一个请求需要 server Span、client Span 和数据库 Span。去重目标是同一操作不出现两个同名同层 Span，而不是删除所有子 Span。判断维度应包括操作类型、调用栈/包装器、instrumentation scope 和当前 transport。', '一次真实样本若只有入口和手动 Span，不能证明 otelhttp 去重已通过；必须让已有 otelhttp wrapper 和普通 http.Client 各走一次，比较 Span 数量和 parent。']),
      sec('兼容配置与上报信息', ['已有 tracing 初始化可能已经管理 exporter endpoint、service name、propagator 和 shutdown。自动插件应复用这套 provider，避免另起一套 SDK 造成两条 Trace、重复 exporter 或服务名分裂。', '如果工具需要显式实验配置，必须记录它是否覆盖现有 provider；“自动沿用”要通过构建和运行日志验证，不能只靠环境变量命名推断。']),
      sec('消息是独立适配项', ['NSQ、Pulsar 发送端需要 Inject 到 message properties；消费端 Receive 后 Extract，再 Start consumer Span。消息只含业务 JSON 时，自动库 hook 可以记录 publish/receive，却无法知道业务因果。批量消费应考虑 Link。'])
    ],
    walkthrough: [walk('pkg/rules/http', 'net/http instrumentation', '识别普通 client/server 埋点'), walk('pkg/rules/grpc', 'gRPC hooks', '比较 server/client 两侧责任'), walk('docs/user/compatibility.md', 'Compatibility', '按版本和库能力建立验收矩阵')],
    lab: { title: '写兼容矩阵', steps: ['列入口 Echo、net/http、gRPC、GORM、Mongo、NSQ、Pulsar。', '每行写现有埋点、自动规则、是否选主入口、去重证据。', '为未覆盖项写明确“不自动解决”的交接动作。'], command: '设计练习：没有单条命令能替代你的服务兼容矩阵；参考 upstream/test/nethttp、test/grpc、test/gorm 和 test/mongo 的 fixture，再按 docs/dev/test.md 运行对应集成测试。', expected: '矩阵能区分入口重复、子调用重复、消息断链三种问题；不要把不存在的 TestHTTP 名称当作通过。', challenge: '为已有 otelhttp wrapper 设计一个不误伤普通 http.Client 的 skip predicate。' },
    quiz: [q('HTTP client 调用当前 ctx 已有 server Span，是否应直接跳过自动 client Span？', ['应跳过，任何已有 Span 都说明请求已埋点', '不应仅凭已有 Span 判断，还要确认是否已有同一 client wrapper/操作', '应新建一个 root Span，避免和 server Span 重叠'], 1, 'server parent 下仍应有 client child；去重要识别同一操作和包装器，不能全局跳过或切断父链。'), q('消费端自动生成 consumer Span，但消息没有传播字段，能否仅凭 TraceID 或采样率恢复生产父级？', ['能，TraceID 可从消费时间和服务名推导', '能，只要生产和消费使用同一采样率', '不能，必须有生产侧 Inject 与消费侧 Extract 的 carrier'], 2, 'TraceID 不可推导，采样率只影响是否记录；没有 carrier 就没有跨进程因果依据。')],
    checkpoint: ['能给每种传输选择一个 tracing 入口', '能定义一个可验证的去重断言', '能写出消息 Inject/Extract 的责任表'], sources: [{ title: 'Compatibility', url: `${docs}/user/compatibility.md` }, { title: 'OTel HTTP instrumentation', url: 'https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation/net/http/otelhttp' }], visual: 'coverage'
  },
  {
    id: 'debugging', title: '调试与验证：从“没 Span”定位到具体层', subtitle: '用证据代替猜测', stage: '二开', minutes: 85, prerequisites: ['architecture', 'compatibility'],
    bridge: { known: '你已有构建、规则、hook 和导出各层的地图。', problem: '“没 Span”可能发生在命中、执行、采样、导出或查询任一层。', idea: '用五问法和最小复现逐层排除，并保留可复现证据。', terms: [{ term: 'recording', meaning: 'Span 当前是否真的记录数据' }, { term: 'processor', meaning: '接收并处理 Span 的 SDK 组件' }, { term: 'tenant', meaning: '查询后端数据所在的租户或空间' }], takeaway: '先定位断在哪一层，再改规则或运行时。' },
    outcomes: ['能用最小复现拆分编译、hook、context、采样和上报', '能读 Span references 而不是只读 TraceID', '能写不泄漏业务数据的验证报告'],
    sections: [
      sec('五问法', ['第一问：工具版本、Go 版本、目标库版本是否在支持范围？第二问：规则是否命中？第三问：生成 hook 是否编译并执行？第四问：当前 context/GLS 的 parent 是谁？第五问：sampler、processor、collector 和查询租户是否正确？', '每一问都要有证据。比如规则命中看 instrument 日志或生成源码，hook 执行看 Span/日志，父子关系看 references，导出看后端和 collector。']),
      sec('不要把 404 当成丢链路', ['Trace 后端可能有 tail sampling 的 decision_wait、异步 exporter 和索引延迟。先等待，再指定 tenant、时间窗口和 service 查询；日志有 ID 但 Trace 仍无数据时，再查 sampled flag、collector 错误和 exporter health。', '报告中写“在时间 T、租户 X、查询 Q、等待 W 后未找到”，不要写“系统没有 Trace”这种超出证据的结论。']),
      sec('错误 Span 的解释', ['错误 Span 代表某个操作被标记为 error，可能是业务校验、下游返回、超时或真实异常。聚合面板的错误数不能直接证明插桩造成错误；要看 error.type、status、operation、版本和基线对比。', '插桩回归需要比较同一请求集合的成功率、延迟、Span 数、CPU、内存和 exporter error，而不是只看红色数字。']),
      sec('最小复现与二分', ['先用一条函数和一个规则复现，再加入 context、并发、已有 OTel wrapper。每次只改变一个变量。编译失败保留生成源码；运行错误保存请求 header 的脱敏版本、Trace 树和工具日志。'])
    ],
    walkthrough: [walk('test/integration_test.go', 'integration tests', '看测试如何构造目标模块和结果'), walk('test/build_test.go', 'build tests', '理解编译级验证'), walk('docs/dev/test.md', 'test workflow', '学习最低版本、muzzle 和夜间测试')],
    lab: { title: '制作一份可复现报告', steps: ['选择一个“没有 Span”的现象。', '记录 commit、Go、module version、命令和脱敏输入。', '按五问法给每层标记 pass/fail/unknown。'], command: '设计练习：使用 labs/README.md 中对应实验命令，并把实际失败或成功日志保存到报告；不要运行一个可能 0 tests 的模糊 -run。', expected: '报告能让另一个人只靠命令和版本复现，且不包含 token、用户 ID 或完整请求体。', challenge: '把一个 Trace 404 分解为采样、入库延迟、租户错误、ID 不一致四个假设并设计验证顺序。' },
    quiz: [q('日志有 TraceID 但 Trace 查询为空，哪项排查顺序更稳妥？', ['先改业务 TraceID，再看是否出现；不需要核验查询条件', '先核对采样/recording、processor/exporter、collector、租户和时间窗口', '直接扩大规则版本范围，因为后端查询为空说明没有命中规则'], 1, '日志和 Span 走不同阶段；查询范围、采样和导出都可能造成空结果，改 ID 或扩大规则会掩盖问题。'), q('两个 Span 共享 TraceID，但一个没有预期的父边，哪类证据最能区分“同链但拓扑错”与“查错 Trace”？', ['只看两个 Span 的服务名是否相同', '比较 ParentSpanID、Span links、入站/出站传播字段和时间顺序', '只看响应头是否包含任意 TraceID'], 1, 'TraceID 只证明同一链标识；父 ID、links 和传播/时序才能验证拓扑，响应头单字段不足以定位。')],
    checkpoint: ['能完成一次五问法排障', '能写出基线对比而不是单点错误数', '能生成脱敏、可复现的最小案例'], sources: [{ title: 'LoongSuite tests', url: `${upstream}/test` }, { title: 'Developer testing', url: `${docs}/dev/test.md` }], visual: 'coverage'
  },
  {
    id: 'capstone', title: '毕业项目：为已有 OTel 服务新增一个安全规则', subtitle: '从问题定义到二开验收', stage: '二开', minutes: 180, prerequisites: ['rules', 'hooks', 'runtime', 'compatibility', 'debugging'],
    bridge: { known: '你已经能从规则走到生成代码和 Span 证据。', problem: '真实服务还要兼容 provider、已有 wrapper、版本和回滚。', idea: '选择一个小目标，做规则、fixture、兼容矩阵和回滚闭环。', terms: [{ term: 'fixture', meaning: '固定版本和调用方式的验证样例' }, { term: 'ADR', meaning: '记录设计取舍和边界的短文档' }, { term: 'rollback', meaning: '撤回改动并恢复基线构建' }], takeaway: '安全二开是可证明、可回滚、可复现的最小改动。' },
    outcomes: ['能从真实函数签名设计规则和 hook', '能保持现有 provider、日志和手动 Span 兼容', '能交付版本矩阵、生成源码、测试和回滚说明'],
    sections: [
      sec('项目题目', ['选择一个已有 OTel 服务中的库调用：优先普通 HTTP、Redis 或一个版本明确的数据库函数；暂不从 Pulsar/NSQ 开始，因为消息跨进程还需要 carrier 设计。目标是增加一个不改变业务返回值的 child Span。', '定义成功条件：目标版本命中；hook 执行一次；parent 正确；已有 wrapper 不重复；error 语义不误报；provider 和服务名沿用；go test、race 或集成测试通过。']),
      sec('设计文档先于代码', ['写一页 ADR：目标函数、版本范围、为什么需要自动 Span、已有埋点、跳过条件、参数脱敏、采样影响和回滚方法。把“不支持消息自动传播”“不修改网关”写成范围边界。', '为每个风险配证据：函数签名来自固定 commit，版本来自 go list，现有 Span 来自测试，生成源码来自 instrument 输出。']),
      sec('实现步骤', ['先在 test/ 增加最低版本 fixture，再写 probe；使用 api.CallContext 保存 Span 和原始参数；规则 JSON 指定准确 receiver 和版本；运行 gofmt、go test、编译和最小服务。', '若需要跳过已有 instrumentation，优先改 probe 的精确判断，而不是关闭整个库的自动规则。若发现版本签名不同，新增版本规则而不是把正则放宽到 .*。']),
      sec('交付物和复盘', ['提交应包含规则、probe、测试、README 或 ADR、生成证据摘要和兼容矩阵。报告明确哪些是已证明、哪些是本地机制测试、哪些仍需测试环境或网关配合。', '最后做一次反向阅读：从一个真实 Span 找回规则和 hook；从一个失败请求反查编译、context、采样和传播。你能双向走通，才算具备二开能力。'])
    ],
    walkthrough: [walk('docs/dev/rule_def.md', 'rule schema', '把设计字段落到 JSON'), walk('docs/dev/hook.md', 'hook contract', '把设计映射到 OnEnter/OnExit'), walk('test/custom_test.go', 'custom instrumentation test', '参考自定义规则测试结构'), walk('README.md', 'contributing', '遵循上游构建和贡献入口')],
    lab: { title: '完成一次可回滚二开', steps: ['建立 feature 分支和基线 commit。', '实现一个最小规则，先跑最低版本 fixture，再跑目标服务。', '保存生成源码、Span 树和性能前后对照。', '写回滚命令并在本地验证回滚后普通 go build。'], command: '设计练习：先运行 cd labs/04-custom-hook && go run main.go；再按其 README 使用固定 v1.15.0 工具构建；最后在 clean upstream 根目录运行 go test ./test -run TestCustomRule -count=1 -v。', expected: '普通实验和真实 custom rule 测试的结果分开记录；不会把不存在的测试命令当作通过。', challenge: '把该规则扩展到一个签名变化的新版本：用新 rule 和新 fixture，不破坏旧版本。' },
    quiz: [q('一个自动规则已在本地生成 Span，提交前哪组证据才能支持“兼容已有 OTel”？', ['一张后端 Trace 截图即可，编译和重复性无需记录', '规则命中、生成源码、父子拓扑、已有 wrapper 去重、provider/导出和回滚结果', '只跑普通 go build，因为运行时拓扑由 SDK 自动保证'], 1, '兼容同时跨编译期和运行时；单张截图无法证明去重、配置沿用或回滚，普通编译也不验证 hook。'), q('目标库新版本只改变了函数签名，最安全的规则演进方式是什么？', ['放宽参数/receiver 匹配到任意形式，减少维护量', '沿用旧规则并寄希望于 trampoline 自动适配', '新增精确版本区间和 fixture，保留旧规则并分别验证'], 2, '签名变化会影响生成调用和返回值，精确隔离可避免误匹配；宽泛匹配和自动适配都会隐藏 ABI/语义差异。')],
    checkpoint: ['能独立完成一个规则从设计到测试的闭环', '能解释并证明不会重复现有入口埋点', '能在报告中明确自动插桩、网关、消息和业务代码的责任边界'], sources: [{ title: 'Adding rules', url: `${upstream}/docs/how-to-add-a-new-rule.md` }, { title: 'LoongSuite Go upstream', url: upstream }], visual: 'coverage'
  }
];

export const courseMeta = {
  title: 'LoongSuite Go：从 Go 基础到编译期插桩二开',
  version: 'v1.15.0 / cac400935add57d8219122ba32857b8f55ac6eb1',
  audience: '会读基本 Go 函数、希望从零理解并逐步编写 LoongSuite 规则和 hook 的学习者',
  method: '每章 = 概念解释 + 源码导航 + 可验证实验 + 测验 + checkpoint；证据优先，区分上游能力与服务侧适配。',
  map: ['基础：orientation → go-foundations', '机制：build → ast → otel → context', '源码：architecture → rules → hooks → runtime', '二开：compatibility → debugging → capstone']
};
