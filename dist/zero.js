// 入门层只引入当前步骤需要的概念；源码层见 source-lessons.js。
export const zeroSteps = [
  {
    id:'observe', title:'先有一个普通函数', goal:'看见“有结果”和“知道过程”是两件事。', beforeYouRead:'FindRoom(42) 的意思是“查找编号 42 的房间”；return 把结果交回调用处。', question:'函数能正常返回，为什么还需要“插桩”？',
    paragraphs:[
      '假设直播页面要查房间。下面的 `FindRoom` 返回了房间名，说明功能成功了。但只看返回值，你不知道这一次调用花了多久、卡在哪一步。排查慢请求时，这些信息才是你需要的。',
      '最直接的办法是在调用前记时间，调用后算耗时，再写一条记录。“埋点”或“插桩”，在这里就是给原有程序增加这类观察动作。业务仍然查房间，额外的代码负责记录它怎么执行。'
    ],
    terms:[{term:'观测',meaning:'收集程序执行的信息，帮助回答慢在哪里、错在哪里。'},{term:'插桩 / instrumentation',meaning:'在程序执行的某些位置加入观察动作。这个词本身不限定是手写还是工具生成。'}],
    before:{label:'只有业务：能得到结果',code:'func FindRoom(id int) string {\n    return "语聊房间"\n}\n\nroom := FindRoom(42)'},
    after:{label:'手动观察：还想知道用了多久',code:'start := time.Now()\nroom := FindRoom(42)\nfmt.Println("FindRoom 用时", time.Since(start))'},
    caption:'两段均为阅读片段，省略所在函数和 import；这里用计时说明动机，还没有使用 LoongSuite 或链路追踪库。',
    flow:[['调用前','记住开始时间'],['原来的函数','继续查询房间'],['调用后','记录耗时与结果']],
    check:{question:'这段观察代码改变了什么？原来的查询还会执行吗？',answer:'增加了执行信息。示意代码仍调用一次 FindRoom，业务结果继续来自原函数。插桩是否保留原有行为，后面要靠前后对照验证。'},
    takeaway:'先记住目的：我们想观察已有程序的执行。暂时不需要认识任何探针内部函数。'
  },
  {
    id:'packages', title:'代码为什么会分成包和模块', goal:'用一个 demo 项目分清文件夹、package 和 module。', beforeYouRead:'先只记三个词：文件夹放文件，package 给代码分组，import 表示使用。', question:'看到 import、package、module，它们分别管什么？',
    paragraphs:[
      '一个函数写不下整个项目，我们会把相关代码放在一起。Go 把一起编译的一组源文件组织成一个“包”（package）；通常对应一个目录。`import` 表示当前文件要使用另一个包。',
      '你可能会问：main 都写了 `import "example.com/demo/room"`，为什么还要 go.mod？因为这里写的是包的完整路径，不是“找 main.go 旁边的 room 文件夹”。Go 还需要知道 `example.com/demo` 对应本地哪个目录。',
      '本例的 `demo/go.mod` 声明 `module example.com/demo`，于是这个前缀对应放着 go.mod 的 `demo/`。完整路径减去这个前缀，剩下 `room`，便找到 `demo/room/`。这是当前模块里的包，不需要先把 example.com/demo 发布到网站，也不需要为 room 另写 require。',
      '模块（module）还负责把一组相关包及其外部依赖版本组织在一起。本例的模块里有 main 和 room 两个包。文件夹名 demo 是磁盘位置；example.com/demo 是声明的模块路径，两者不是必须同名。',
      '没有 go.mod 并不是任何 Go 代码都不能运行。比如只使用标准库的单文件，可以直接运行。本例要从一个项目目录导入 room 子包，所以用 go.mod 说明这个项目的路径。先记住这个用途即可。'
    ],
    terms:[{term:'package（包）',meaning:'组织 Go 代码的单位。你调用的函数属于某个包。'},{term:'module（模块）',meaning:'管理一组包及其依赖版本的单位，由 go.mod 声明。'},{term:'import（导入）',meaning:'在一个 Go 文件里声明要使用哪个包。标准库 fmt、net/http 也通过它导入。'}],
    before:{label:'目录：一个模块，两个包',language:'text',code:'demo/\n├── go.mod         # module example.com/demo\n├── main.go        # package main\n└── room/\n    └── find.go    # package room'},
    after:{label:'main.go 使用 room 包：阅读示意',code:'package main\n\nimport "example.com/demo/room"\n\nfunc main() {\n    name := room.Find(42)\n    println(name)\n}'},
    caption:'路径解析：example.com/demo/room → 当前模块 example.com/demo + 子目录 room → demo/room/。目录不用叫 example.com，也不用在本地创建 demo/example.com/demo/room。完整 room/find.go 见上面的第 2 段。依据：Go 官方《How to Write Go Code》。',
    flow:[['import 的完整路径','example.com/demo/room'],['go.mod 识别前缀','example.com/demo 对应 demo/'],['剩下的 room 子路径','在 demo/room/ 找到源码']],
    check:{question:'如果把 go.mod 改成 module example.com/other，main 还 import example.com/demo/room，它会自动认出旁边的 room 吗？',answer:'在本例没有额外依赖或替换配置时不会。旧 import 已经不属于当前模块的路径前缀。应把 import 一起改成 example.com/other/room；不能只凭包的短名字 room 自动定位。'},
    takeaway:'import 声明要用哪个包；module 声明帮助把当前模块的路径对应到本地目录；package 给代码分组。'
  },
  {
    id:'gomod', title:'go.mod 到底在告诉 Go 什么', goal:'只看懂 go.mod 的三行：module、go、require。', beforeYouRead:'已经知道 import 是“使用另一个包”；这一页暂时不讲 replace。', question:'import 写了包路径，Go 去哪里找哪一版代码？',
    paragraphs:[
      '使用自己模块里的包时，Go 先识别 module 行声明的路径前缀，再沿剩下的子目录找到源码。使用别人发布的包时，还需要确定它属于哪个模块、使用哪一版。`go.mod` 是这份模块说明和依赖清单。',
      '`require` 声明所需模块及其版本要求；它不是一条函数调用，也不等于把清单上的所有代码都编进程序。源码中的 import 和后续构建决定实际需要哪些包。',
      '最后记住边界：`go.mod` 只是告诉 Go 模块和依赖怎么解析；它不会自动给函数增加记录动作。记录动作要等后面讲构建工具时再接入。'
    ],
    terms:[{term:'依赖（dependency）',meaning:'当前代码要用到的其他代码。'},{term:'require',meaning:'在 go.mod 里声明一个模块的版本要求；最终选用版本还要结合其他模块的要求。'}],
    before:{label:'先认三行：项目名、语言版本、外部依赖',language:'go.mod',code:'module example.com/demo\n\ngo 1.25.0\n\nrequire example.com/observer v1.0.0'},
    after:{label:'翻译成人话',language:'text',code:'module：我的模块叫 example.com/demo。\ngo：构建这个模块所需的最低 Go 版本。\nrequire：我需要外部 observer 模块。\nimport：仍然写在 .go 文件里，表示实际使用哪个包。'},
    caption:'example.com/observer 是教学名称。replace 会在后面的“补齐构建依赖”例子里单独出现；现在先把 require 看成“项目需要谁”。',
    flow:[['.go 文件的 import','我要使用哪个包'],['go.mod 的 module','当前项目的路径前缀'],['go.mod 的 require','需要哪个外部模块和版本']],
    check:{question:'把库名加进 require，就已经在业务函数前后自动记录了吗？',answer:'没有。require 解决代码依赖的声明问题，自动记录还需要实际的观察代码，以及把观察代码接入函数执行的改写步骤。'},
    takeaway:'先分开两件事：go.mod 帮助找到代码，调用和插桩决定代码怎样执行。'
  },
  {
    id:'build', title:'编译时和运行时是两段时间', goal:'区分“生成程序”和“运行请求”这两个时刻。', beforeYouRead:'只需要知道 go build 会生成可执行文件。', question:'otel go build 做的事，什么时候才会影响请求？',
    paragraphs:[
      '你写的是 `.go` 文本，电脑运行的是构建出来的可执行程序。`go build` 会组织包的编译，再把程序需要的部分连接成可执行文件。我们先把“准备和生成程序”的这段叫构建阶段。',
      '执行这个文件、启动服务、接收请求，是之后的运行阶段。LoongSuite 的 `otel` 工具先在构建时参与准备依赖、修改编译输入；生成后的程序在运行时才执行观察动作。',
      '因此要分清两类错误：构建时“找不到包”，程序还没有生成；程序已运行却没有打印记录，则要检查记录动作有没有执行。先判断问题发生在哪个时刻。'
    ],
    terms:[{term:'构建',meaning:'把源码检查、编译并组合成可执行程序。'},{term:'可执行文件',meaning:'构建出来的程序，例如 demo。./demo 表示启动当前目录里的这个程序。'},{term:'运行',meaning:'启动生成的程序，让它真正执行代码。'}],
    before:{label:'普通 Go：构建，再启动',language:'sh',code:'go build -o demo .\n./demo'},
    after:{label:'LoongSuite：让工具参与构建，再启动产物',language:'sh',code:'otel go build -o demo .\n./demo'},
    caption:'以上是命令形态示意，当前步骤不要求安装工具。实际工具版本、示例目录与验证命令见动手实验 04。',
    flow:[['构建时：otel 工具','准备依赖 / 改写编译输入'],['产物：demo','包含业务与需要的观察代码'],['运行时：服务进程','执行函数时产生记录']],
    check:{question:'业务二进制已经生成，之后又改了一条插桩规则，老进程会自动用上吗？',answer:'这套构建时插桩不会把新规则热更新进老二进制。需要用新规则重新构建产物，再运行新产物。'},
    takeaway:'构建工具负责“让代码接进去”，运行中的程序负责“真正执行并记录”。'
  },
  {
    id:'hooks', title:'工具怎样替我加上前后动作', goal:'理解 rule 负责找函数，hook 负责执行额外动作。', beforeYouRead:'先把 hook 理解成“被调用的额外 Go 函数”。', question:'不逐个手写计时，工具怎么知道改哪里、加什么？',
    paragraphs:[
      '回到第一步：手写计时很容易，但每个 HTTP、数据库调用都手写，维护起来很重。工具把这个工作拆成两份：规则告诉它“找谁”，观察函数告诉它“找到以后做什么”。',
      '观察函数通常叫 hook（钩子）：目标函数进入时或退出时调用它。例如进入时记时间，退出时记录结果。hook 仍然是 Go 代码，不是 JSON 里的一段说明。',
      '工具找到目标函数后，把这些额外调用写入交给编译器的代码。于是运行新程序时，原函数前后就多了观察动作。规则说明“找谁”，hook 函数里才有真正要执行的代码。'
    ],
    terms:[{term:'规则（rule）',meaning:'告诉工具要找哪个包、哪个函数。'},{term:'hook（钩子）',meaning:'找到目标后额外执行的 Go 函数，例如记录开始和结束。'}],
    before:{label:'原来的执行路径',language:'text',code:'调用 FindRoom\n    → 执行原函数体\n    → 返回结果'},
    after:{label:'插桩后的路径：概念简图',language:'text',code:'调用 FindRoom\n    → 执行进入 hook\n    → 执行原函数体\n    → 执行退出 hook\n    → 返回结果'},
    caption:'这是帮助理解的正常执行路径。上游还用跳板代码组织调用，支持跳过原函数等能力；它的真实实现放在后续源码页，不能用本简图代替。',
    flow:[['规则','定位 FindRoom'],['工具改写代码','加入进入和退出调用'],['运行新程序','前后动作与原函数一起执行']],
    check:{question:'只写了“找到 FindRoom 后记录一下”，却没有提供记录函数，也没有重新构建，会自动打印记录吗？',answer:'不会。说明只告诉工具要做什么；还需要可执行的记录函数、把调用接进代码，并重新构建和运行。'},
    takeaway:'规则负责找位置，hook 负责做动作，构建工具把额外调用接进去。'
  },
  {
    id:'deps', title:'为什么还要“补上依赖”', goal:'亲眼看见：新增一行观察调用后，为什么原项目还不能编译。', beforeYouRead:'你已经知道 go.mod 能声明外部依赖；这一页只解决“代码找不到”这个问题。', question:'给业务加了一行观察调用，为什么还要改 go.mod？',
    paragraphs:[
      '继续用教学项目 demo：原来 `FindRoom(42)` 返回“语聊房间”；现在在这个函数里面加一行 `observer.Record("FindRoom")`，让它先打印一条执行记录，再返回原来的房间名。',
      'observer 是另一份已经准备好的小库，放在 demo 目录外。只写 import 还不够：demo 原来的 go.mod 没有声明需要这个库，Go 不知道怎样把这份代码接进来，构建就失败了。上面的报错对应的就是这个缺口。',
      '修复时，修改的是 demo 原来那一份 go.mod。require 说明“我需要 observer”，本例的 replace 说明“源码就在相邻的 ../observer”。业务项目 也可以只有自己的一份 go.mod；外部库的文件不等于业务仓库多出一份 go.mod。',
      '回到 LoongSuite：工具自动加进来的观察代码，同样需要找到它使用的外部库。因此构建工具除了接入调用，还要补齐构建依赖。本页的小程序只解释这个理由；真实规则的代码组织与准备次数，在源码章节再读。'
    ],
    terms:[{term:'业务项目',meaning:'本页是教学项目 demo，可以类比你自己的 业务项目；没有修改真实 业务项目。'},{term:'外部库',meaning:'放在 demo 目录外的 observer 代码。'},{term:'replace',meaning:'本例中，用它告诉 Go 到哪个现成的本地目录找 observer。'}],
    before:{label:'原来的业务：能编译、能运行',language:'go',code:'package main\n\nfunc main() {\n    room := FindRoom(42)\n    println(room)\n}'},
    after:{label:'新增调用在 FindRoom 里面：阅读片段',language:'go',code:'import "example.com/observer"\n\nfunc FindRoom(id int) string {\n    observer.Record("FindRoom")\n    return "语聊房间"\n}'},
    caption:'这里的 observer 只是教学用外部库；图中“工具”表示构建准备动作，不代表浏览器正在执行 LoongSuite。',
    flow:[['原程序','FindRoom 能返回结果'],['新增调用','需要 observer.Record'],['补齐 go.mod','Go 才能找到 observer 并编译']],
    check:{question:'如果只生成了 observer.Record 调用，却不补依赖，会发生什么？',answer:'业务程序原来的 FindRoom 代码仍然存在，但编译器找不到 observer 包，整个构建会失败；补依赖不是为了多生成一条 Trace，而是为了让新增代码有来源。'},
    takeaway:'这一页只记住：改了业务的编译输入，就要让新增 import 对应的外部代码也能被找到。',
    destination:{label:'带着这个问题读依赖源码 →',href:'#/source/deps'}
  },
  {
    id:'trace', title:'从一条耗时记录，到一整条请求', goal:'先分清一次请求、一个操作和它们之间的父子关系。', beforeYouRead:'上一页打印了一次 FindRoom 执行；现在看它如何与入口、数据库查询对应起来。', question:'怎样判断三张操作记录属于同一次请求，又是谁调用了谁？',
    paragraphs:[
      '直播页面发起一次请求，服务可能先查房间、再查用户、再调用别的服务。单独一条耗时记录只能说明一个动作；我们还想知道这些动作属于同一次请求，谁调用了谁。',
      '把这次请求相关的记录放在同一条链路（Trace）里，用 Trace ID 标识它。每个有起止时间的操作是一段 Span，也有自己的 Span ID。新操作沿用同一个 Trace ID，并记录父 Span ID，就能组成调用树。',
      '例子里三张记录都写 Trace=A，说明属于同一次请求；数据库记录写 Parent=02，说明是查房间这一步调用了数据库。只有相同的 Trace ID 还不能知道调用顺序，必须再看父操作。A、01、02、03 是便于阅读的教学编号。',
      '程序怎样把这些编号传给下一步，是后面的 context 与传播章节要解决的问题。这里先学会读这三张记录，不需要先记请求头格式。'
    ],
    terms:[{term:'Trace / Trace ID',meaning:'一次请求相关记录的集合 / 标识这个集合的 ID。'},{term:'Span / Span ID',meaning:'链路里的一个操作记录 / 标识这个操作的 ID。'},{term:'父 Span',meaning:'直接引发当前操作的上一层操作。相同 Trace ID 不代表父子关系一定正确。'}],
    before:{label:'只比较 Trace ID 不够',language:'text',code:'HTTP 请求          Trace=A  Span=01\n└── 查房间           Trace=A  Span=02  Parent=01\n    └── 数据库查询    Trace=A  Span=03  Parent=02'},
    after:{label:'沿着 Parent 读调用关系',language:'text',code:'记录 03 的 Parent=02：查房间调用数据库。\n记录 02 的 Parent=01：服务入口调用查房间。\n三张记录的 Trace 都是 A：属于同一次请求。'},
    caption:'A、01、02、03 是便于阅读的教学标识，不是合法的 OTel ID 编码。并非同一 Trace 下的多个 Span 都是重复。',
    flow:[['01 服务入口','收到请求 A'],['02 查房间','记下 Parent=01'],['03 数据库查询','记下 Parent=02']],
    check:{question:'只要当前有 Trace ID，就完全不创建新的 Span，可以吗？',answer:'不能一概这样做。不同操作应有自己的 Span，保持同一 Trace 的父子关系；应避免的是同一个操作被重复记录。如何兼容已有埋点，要按入口、HTTP、数据库等位置逐项验证。'},
    takeaway:'你接下来的目标是理解“怎样接对父节点”，而不只是“有没有相同的 ID”。',
    destination:{label:'进入正式课程：一步步跟随构建 →',href:'#/learn/orientation'}
  }
];

export const zeroSources = [
  {title:'Go 官方：代码、包与模块的组织',url:'https://go.dev/doc/code'},
  {title:'Go 官方：管理依赖',url:'https://go.dev/doc/modules/managing-dependencies'},
  {title:'固定版本：依赖准备的真实实现',url:'https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/add.go'}
];
