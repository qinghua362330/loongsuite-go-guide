// 固定上游实现的初学者讲解层；不是对源码逐行直译。
export const sourceLessons = {
  "go-mod": {
    "title": "先看懂 go.mod：项目的地址与依赖清单",
    "plain": "你的 业务项目 可以只有一份 go.mod。下面的多份 go.mod 属于另一个仓库——LoongSuite 自己的源码，不是要求你给 业务项目 新建这些文件。先看清是谁的文件，再读模块边界。",
    "why": "你会在 LoongSuite 的多个目录看到 go.mod。先弄清每份文件管理哪一组代码，才知道工具、观察函数和业务项目各自从哪里找到所需的包。",
    "prerequisites": [
      {
        "label": "包与模块先看一个目录例子",
        "href": "#/start/2"
      },
      {
        "label": "用一个构建错误理解 require 和 replace",
        "href": "#/start/6"
      }
    ],
    "terms": [
      {
        "term": "包（package）",
        "meaning": "通常是一组放在同一目录、一起编译的 Go 文件。"
      },
      {
        "term": "模块（module）",
        "meaning": "管理一组包及其依赖版本的单位，根目录有 go.mod。"
      },
      {
        "term": "go.mod",
        "meaning": "当前模块的说明文件。遇到下一级独立 go.mod，就进入另一模块的边界。"
      },
      {
        "term": "import",
        "meaning": "在 .go 文件中声明导入哪个包。模块路径加包的相对目录，组成导入路径。"
      },
      {
        "term": "require / replace",
        "meaning": "前者声明模块版本需求，后者指定替代版本或本地代码位置；详见入门第 6 步。"
      }
    ],
    "input": "主 module 的 go.mod；例如 module github.com/alibaba/loongsuite-go、go 1.25.0 和 require 列表。",
    "output": "Go 能解析工具 module；规则目录还可以作为独立 hook module 被编入业务。",
    "steps": [
      {
        "title": "先只看三份文件的位置",
        "explanation": "下面都是同一个仓库的目录，但三份 go.mod 分别管理工具、公共支持包、HTTP hook。文件夹嵌套，不代表模块边界也自动合并。",
        "code": "loongsuite-go/\n├── go.mod                 # 工具\n└── pkg/\n    ├── go.mod             # 公共支持包\n    └── rules/http/\n        └── go.mod         # HTTP hook",
        "language": "text"
      },
      {
        "title": "先认根 module",
        "explanation": "根 go.mod 的 module 是 github.com/alibaba/loongsuite-go，主要服务工具源码。"
      },
      {
        "title": "再认 pkg module",
        "explanation": "源码中 pkg/go.mod 声明 github.com/alibaba/loongsuite-go/pkg；pkg/inst-api 属于它，不是根 module 的独立 go.mod。"
      },
      {
        "title": "再认 hook module",
        "explanation": "pkg/rules/http/go.mod 又声明 github.com/alibaba/loongsuite-go/pkg/rules/http，并通过 replace ../../../pkg 指向真实的 pkg module。"
      },
      {
        "title": "用当前目录验证",
        "explanation": "go env GOMOD 会告诉你当前命中的那一份 go.mod；切换目录后结果可能不同。",
        "code": "go env GOMOD\ngo list -m all",
        "language": "sh"
      }
    ],
    "sourceNotes": [
      {
        "code": "module github.com/alibaba/loongsuite-go",
        "explanation": "根 module 的路径只覆盖根 module 下的包。"
      },
      {
        "code": "go 1.25.0",
        "explanation": "根源码快照声明 Go 1.25.0。"
      },
      {
        "code": "module github.com/alibaba/loongsuite-go/pkg",
        "explanation": "pkg/go.mod 的真实 module 边界，pkg/inst-api 从这里导入。"
      }
    ],
    "pitfalls": [
      "把根 module 的路径想成递归覆盖所有子目录。",
      "看到 pkg/inst-api 就给它的目录单独增加 module 声明。",
      "把 module、package、go.mod 三个词当成同义词。"
    ],
    "check": {
      "question": "为什么一个仓库会有多个 go.mod？",
      "answer": "因为几组代码要分别管理依赖。根模块主要构建工具；pkg 模块提供公共支持包；HTTP hook 也有自己的模块。被插桩的业务项目还另有自己的 go.mod，要通过依赖声明解析需要的那些包。"
    },
    "next": {
      "label": "继续看命令入口",
      "href": "#/source/cli"
    }
  },
  "cli": {
    "title": "命令入口：一个 main 如何分派不同动作",
    "plain": "main 读取 os.Args[1]，先初始化环境，再把 version、set、go、remix 分派给不同函数。它本身不做 AST 改写。",
    "why": "知道入口的边界，才能追问“哪一步准备依赖、哪一步接管编译”，而不是把所有行为归给 main。",
    "prerequisites": [
      {
        "label": "go.mod",
        "href": "#/source/go-mod"
      }
    ],
    "terms": [
      {
        "term": "os.Args",
        "meaning": "命令行参数切片；下标 0 通常是程序名。"
      },
      {
        "term": "subcommand",
        "meaning": "第一个参数表示的动作，如 go 或 remix。"
      },
      {
        "term": "error",
        "meaning": "函数返回的失败结果，main 用 ex.Fatal 结束进程。"
      }
    ],
    "input": "例如 otel go build：os.Args[1] 是 go，后面的参数仍是 build 的参数。",
    "output": "go 分别进入 preprocess.Preprocess 或 instrument.Toolexec，并在错误时退出。",
    "steps": [
      {
        "title": "检查参数",
        "explanation": "少于两个参数就打印用法并退出，不会猜测用户想做什么。"
      },
      {
        "title": "初始化环境",
        "explanation": "initEnv 成功后才继续；失败交给 ex.Fatal。"
      },
      {
        "title": "选择分支",
        "explanation": "go 调 Preprocess，remix 调 Toolexec，version/set 调配置相关函数。"
      },
      {
        "title": "把错误传回命令行",
        "explanation": "分支返回 error，统一在末尾检查；普通 Go 函数调用链因此清楚可追踪。",
        "code": "switch os.Args[1] {\ncase SubcommandGo:\n    err = preprocess.Preprocess()\ncase SubcommandRemix:\n    err = instrument.Toolexec()\n}",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "subcmd := os.Args[1]",
        "explanation": "输入动作来自命令行，而不是环境变量猜测。"
      },
      {
        "code": "err = preprocess.Preprocess()",
        "explanation": "go 子命令先进入构建前置阶段。"
      },
      {
        "code": "err = instrument.Toolexec()",
        "explanation": "remix 子命令处理工具链转发的编译动作。"
      }
    ],
    "pitfalls": [
      "把 otel 命令当成另一套编译器。",
      "忽略 initEnv 失败后仍会继续的可能性。",
      "把 go build 的参数误当成 os.Args[1]。"
    ],
    "check": {
      "question": "前缀命令如何仍然调用标准 go？",
      "answer": "main 只分派；Preprocess 最后组装 go build，Toolexec 再把实际编译器调用转发下去。"
    },
    "next": {
      "label": "进入构建前置阶段",
      "href": "#/source/preprocess"
    }
  },
  "preprocess": {
    "title": "Preprocess：为什么找两次规则，要准备三次？",
    "plain": "要让查房间函数自动记录，先得知道该加哪段代码，再把那段代码需要的包找齐。新增的包又可能命中规则，所以“找规则”和“准备代码”要交替进行。先看下面的房间查询动画。",
    "why": "自动插入的新调用也需要真实的 Go 代码。如果只选出了规则，却没让对应的记录包进入构建，后续改写出来的代码就找不到需要的材料。",
    "prerequisites": [
      {
        "label": "命令入口",
        "href": "#/source/cli"
      },
      {
        "label": "go.mod",
        "href": "#/source/go-mod"
      }
    ],
    "terms": [
      {
        "term": "Preprocess（构建前准备）",
        "meaning": "在正式插桩构建前，把规则和配套 Go 代码准备齐。"
      },
      {
        "term": "依赖",
        "meaning": "当前代码要用到的其他代码。例如记录包调用 cache，cache 就是它的依赖。"
      },
      {
        "term": "匹配 / matchRules",
        "meaning": "检查实际会参与构建的包，选出适用的规则。它选出的是清单，还没有把所有配套代码接入。"
      },
      {
        "term": "bundles",
        "meaning": "选中的规则清单。动画里 B1、B2 分别表示第一次、第二次选出的清单。"
      }
    ],
    "input": "业务构建目标（例如 room.FindRoom）、项目的 go.mod、可用规则和 go build 参数。",
    "output": "让最终选中规则所用的代码能参与构建，保存规则，再启动带 toolexec 的正式构建。",
    "steps": [
      {
        "title": "先确认这个业务项目能按模块找代码",
        "explanation": "precheck 检查 go.mod 等条件；初始化处理器、备份相关文件。你暂时只要知道：准备阶段会调整构建输入，结束时安排清理。"
      },
      {
        "title": "准备①：还没选出业务规则，先加入基础库",
        "explanation": "bundles 初始为空。newDeps([]) 先生成 OTel 基础 import；syncDeps 调用 go mod tidy，同步依赖。动画画面 2 展示这一刻。",
        "code": "bundles := []*rules.InstRuleSet{}\nnewDeps(bundles) // 此时 bundles 为空\nsyncDeps()",
        "language": "go"
      },
      {
        "title": "匹配①：现在才知道要哪个业务记录包",
        "explanation": "matchRules 扫描当前构建范围，得到 B1。动画中它选中 room 规则，规则指向 room-recorder。注意：这条规则是本轮准备之后才选出来的。",
        "code": "B1 := matchRules()\n// 选出了 room 规则，还没有执行 newDeps(B1)",
        "language": "go"
      },
      {
        "title": "准备②：接入 B1，新代码可能又带来其他包",
        "explanation": "newDeps(B1) 把已选规则的 import 和模块信息加进去，再同步。动画里 room-recorder 引用了 cache，于是 cache 也参与构建。",
        "code": "newDeps(B1)\nsyncDeps()\n// 现在能在构建范围中看到 cache 了",
        "language": "go"
      },
      {
        "title": "匹配②：按变化后的构建范围再选一次",
        "explanation": "再调用 matchRules，得到 B2。动画中新增的 cache 命中自己的规则；它对应的 cache-recorder 又是新的准备需求。实际项目也可能因为加入包而改变版本选择。",
        "code": "B2 := matchRules()\n// B2 可能和 B1 不同",
        "language": "go"
      },
      {
        "title": "准备③：把第二次匹配的结果落实，然后停止匹配",
        "explanation": "newDeps(B2) 和 syncDeps 把最终清单所需的代码接入。第三轮没有 matchRules。如果第二次匹配没有相关变化，第三次准备可能不增加新模块；当前源码仍固定执行这一轮。",
        "code": "newDeps(B2)\nsyncDeps()\n// 没有第 3 次 matchRules()",
        "language": "go"
      },
      {
        "title": "把准备好的结果交给正式构建",
        "explanation": "updateRule 修正规则路径，store 保存规则，然后 runBuildWithToolexec 开始正式插桩构建。前面是在备齐材料；这里才把观察动作接到目标函数的编译输入里。",
        "code": "updateRule(B2)\nstore(B2)\nrunBuildWithToolexec(goBuildCmd)",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "bundles := make([]*rules.InstRuleSet, 0)",
        "explanation": "最初还没有匹配结果，所以第一次 newDeps 只能先准备基础代码。"
      },
      {
        "code": "for i := 0; i < 3; i++",
        "explanation": "实际固定循环三次，不是 Go 语言的规定，也不是一直循环到完全不变。"
      },
      {
        "code": "dp.newDeps(bundles) → dp.syncDeps()",
        "explanation": "用上一轮的规则清单生成 import、补模块信息，再调用 go mod tidy；vendor 模式还会更新 vendor。"
      },
      {
        "code": "if i == 2 { continue }",
        "explanation": "第三次准备后直接跳过匹配；总共只有两次 matchRules。"
      },
      {
        "code": "bundles, err = dp.matchRules()",
        "explanation": "本次新选出的规则，要等到后面的准备步骤，才能把配套代码接入。"
      },
      {
        "code": "runBuildWithToolexec(dp.goBuildCmd)",
        "explanation": "依赖与规则准备结束后，再启动编译工具包装与源码改写流程。"
      }
    ],
    "pitfalls": [
      "日志写 Round 3 of rule matching，也不能理解成三次真正的匹配；第三轮在调用 matchRules 前已经 continue。",
      "三轮不是每个项目在理论上都不可缩减。若要优化，需要证明前后规则与依赖没有相关变化，不能直接把循环次数改小。",
      "固定两次匹配不等于对任意深度的自定义依赖链都已找到全部规则；源码没有做到自动检查收敛。",
      "这里只是构建前准备；不表示请求执行三次，也不表示自动产生三个相同 Span。",
      "非 debug 路径会尝试清理生成文件与恢复备份；清理错误被忽略，不能据此承诺所有情况都完整恢复。"
    ],
    "check": {
      "question": "动画里只做一轮时，room 规则已经选出来了，为什么仍不够？",
      "answer": "因为这一轮的 newDeps 发生在匹配之前，收到的还是空清单。room 规则是之后才选出来的，需要下一次 newDeps(B1) 接入它的记录包。"
    },
    "next": {
      "label": "查看依赖注入",
      "href": "#/source/deps"
    }
  },
  "toolexec": {
    "title": "toolexec：把每次编译器调用接到工具上",
    "plain": "runBuildWithToolexec 取出当前可执行文件，把它放进 go build 的 -toolexec 参数；Go 后续调用 compile/link 时会先经过这个程序。",
    "why": "一个 go build 会编译很多 package，所以工具必须在每个编译 action 的边界观察，而不是只拦截一次总命令。",
    "prerequisites": [
      {
        "label": "编译前置",
        "href": "#/source/preprocess"
      }
    ],
    "terms": [
      {
        "term": "-toolexec",
        "meaning": "Go build 用来替换/包装底层工具调用的选项。"
      },
      {
        "term": "compile action",
        "meaning": "针对一个 package 的具体编译动作。"
      },
      {
        "term": "build cache",
        "meaning": "Go 根据输入与参数复用已生成产物的缓存。"
      }
    ],
    "input": "原始 goBuildCmd、当前可执行文件路径、构建工作目录、缓存和 debug 配置。",
    "output": "追加 -toolexec、-work 或 -a、调试 gcflags 后的新 go build 参数。",
    "steps": [
      {
        "title": "找自己的可执行文件",
        "explanation": "os.Executable 返回当前工具路径，避免硬编码安装目录。"
      },
      {
        "title": "插入代理参数",
        "explanation": "args 先保留 go build 的前两个参数，再追加 -toolexec=当前程序 CompileRemix。"
      },
      {
        "title": "控制构建输入",
        "explanation": "没有 Go cache 配置时追加 -a 强制重编译；debug 时追加 -N -l。"
      },
      {
        "title": "保留用户参数",
        "explanation": "goBuildCmd[2:] 原样追加，最后仍由 Go 处理目标包和输出。",
        "code": "go build -toolexec=\"/path/otel remix\" -work -a ./...",
        "language": "sh"
      }
    ],
    "sourceNotes": [
      {
        "code": "args = append(args, \"-toolexec=\"+exe+\" \"+CompileRemix)",
        "explanation": "代理入口是当前工具加 remix 子命令。"
      },
      {
        "code": "args = append(args, util.BuildWork)",
        "explanation": "保留构建工作目录，方便查看临时编译输入。"
      },
      {
        "code": "args = append(args, \"-a\")",
        "explanation": "无缓存路径时选择强制重编译；这是源码中的策略。"
      }
    ],
    "pitfalls": [
      "把 toolexec 当成只执行一次的 wrapper。",
      "把 -a 解释成“插桩成功”的证明。",
      "只看最终二进制，不看 compile action 日志。"
    ],
    "check": {
      "question": "go build 为什么会重复调用编译器？",
      "answer": "因为依赖图里每个 package 都可能触发独立 compile action，-toolexec 让这些调用逐个经过工具。"
    },
    "next": {
      "label": "理解规则依赖",
      "href": "#/source/deps"
    }
  },
  "deps": {
    "title": "为什么插桩要改 go.mod？",
    "plain": "这里修改的是业务原来那一份 go.mod。后文的 HTTP 记录模块属于 LoongSuite 源码，在业务仓库之外。工具要让业务构建找得到这份外部代码；不要求 业务项目 多建 go.mod。",
    "why": "原来程序只负责查房间。自动插桩后，它还要运行额外的观察函数。这些函数也写在 Go 包里，不会因为 otel 工具已经安装，就凭空出现在业务程序中。因此，工具需要准备依赖声明和导入代码，再交给 Go 构建。",
    "prerequisites": [
      {
        "label": "包和模块是什么",
        "href": "#/start/2"
      },
      {
        "label": "go.mod 的三种声明",
        "href": "#/start/3"
      },
      {
        "label": "先用构建报错理解为什么要补依赖",
        "href": "#/start/6"
      }
    ],
    "terms": [
      {
        "term": "包（package）",
        "meaning": "一组一起编译的 Go 源文件。你调用的函数属于某个包。"
      },
      {
        "term": "模块（module）",
        "meaning": "把一组包放在一起管理版本的单位，根目录有自己的 go.mod。业务项目和探针代码可以属于不同模块。"
      },
      {
        "term": "go.mod",
        "meaning": "模块的说明文件，声明模块名、Go 版本要求和外部模块依赖等。"
      },
      {
        "term": "import",
        "meaning": "写在 .go 文件里，说明这个文件要导入哪个包。"
      },
      {
        "term": "require",
        "meaning": "写在 go.mod 里，声明需要哪个模块和哪个版本；它不是调用函数的指令。"
      },
      {
        "term": "replace",
        "meaning": "也写在 go.mod 里：需要这个模块时，改用另一版或指定本地目录的源码。"
      },
      {
        "term": "hook（观察函数）",
        "meaning": "在目标函数进入或退出时执行的额外 Go 函数，例如记录调用的开始和结束。hook 包提供这些函数。"
      },
      {
        "term": "运行时支持 / SDK",
        "meaning": "最终程序执行时要用的支持库。OTel SDK 负责组织、处理和导出链路记录；与构建时执行的 otel 命令分开。"
      }
    ],
    "input": "业务项目的 go.mod 文件，加上本次需要补入的模块清单。每项列出模块路径、版本，以及是否改用某个替代源码位置。",
    "output": "addDependency 把缺失的 require / replace 声明写回这个 go.mod，已有同路径声明不被它直接覆盖。调用它的 newDeps 还负责生成导入观察包的 Go 文件。",
    "steps": [
      {
        "title": "从最简单的业务项目开始",
        "explanation": "假设业务模块叫 example.com/app，原来的 main.go 只用 Go 标准库 net/http。标准库随 Go 提供，不需要单独写进 require。先看业务原来的 go.mod：",
        "code": "module example.com/app\n\ngo 1.25.0",
        "language": "go.mod"
      },
      {
        "title": "工具想接入一份 HTTP 观察代码",
        "explanation": "nethttp.json 规则的 Path 指向 github.com/alibaba/loongsuite-go/pkg/rules/http。这个目录有自己的 go.mod，提供 HTTP hook。newDeps 会生成独立的 Go 文件，把它导入业务构建。下面是这份文件的一小部分，不是 go.mod：",
        "code": "package main\n\nimport _ \"github.com/alibaba/loongsuite-go/pkg/rules/http\"",
        "language": "go"
      },
      {
        "title": "为什么 import 前有一个下划线？",
        "explanation": "普通 import 通常用来调用包里导出的名字。import _ 表示不使用这些名字，但仍把包作为依赖纳入构建，并执行它的初始化。这里还需要后续的跳板改写把目标调用接到 hook；单有这行 import 不会自动记录每次 HTTP 请求。"
      },
      {
        "title": "给 go.mod 补上这个模块的声明",
        "explanation": "生成的文件有了新 import，业务构建也要能解析其所属模块。工具使用下面这个占位版本，并同时给它准备本地 replace。长版本号不是让你猜一个发布版本；它与本地替代目录一起使用。下面仍是简化的 go.mod，不是最终全部依赖清单：",
        "code": "module example.com/app\n\ngo 1.25.0\n\nrequire github.com/alibaba/loongsuite-go/pkg/rules/http v0.0.0-00010101000000-000000000000\n\nreplace github.com/alibaba/loongsuite-go/pkg/rules/http => ../loongsuite-go/pkg/rules/http",
        "language": "go.mod"
      },
      {
        "title": "replace 回答“实际代码在哪儿”",
        "explanation": "上例假设旁边恰好有 ../loongsuite-go 这份源码；这只是便于阅读的目录布局。工具会计算实际所在目录，不要求你把仓库放到这个路径。require 声明模块需求，replace 把它指向这份本地 hook 源码。hook 自己还需要的其他模块，会继续参与 Go 的依赖解析。"
      },
      {
        "title": "记录库也要进入业务构建",
        "explanation": "newDeps 还会导入基础支持包，例如下面的 pkg。它有独立的 pkg/go.mod。pkg/inst-api 只是这个模块内的一个包，不是另一个独立模块。由 hook 调用的记录库在业务程序运行时工作，不能只存在于构建工具的依赖里。下面还是生成 Go 文件的片段：",
        "code": "package main\n\nimport _ \"github.com/alibaba/loongsuite-go/pkg\"",
        "language": "go"
      },
      {
        "title": "最后回到 addDependency：只补缺失项",
        "explanation": "它做的事情很朴素：读取 go.mod → 逐项检查已有 require → 缺失才补 → 按需检查并补 replace → 有变化才写回文件。它没有在这里创建 Trace，也没有在这里改目标函数体；那是后续步骤的工作。"
      }
    ],
    "sourceNotes": [
      {
        "code": "gomod",
        "explanation": "函数参数：本次要修改的 go.mod 文件路径，属于被插桩的业务项目。"
      },
      {
        "code": "dependencies []Dependency",
        "explanation": "另一项参数：本次要补入的模块清单。Dependency 这个结构把模块路径、版本和替代位置放在一起。"
      },
      {
        "code": "modfile, err := parseGoMod(gomod)",
        "explanation": "把 go.mod 文本读成程序能检查和修改的数据。err 用来报告读取或解析失败。"
      },
      {
        "code": "for _, r := range modfile.Require",
        "explanation": "逐条查看文件已经声明的 require，比较模块路径是否等于本次需要的路径。"
      },
      {
        "code": "if !alreadyRequire { ... AddRequire(...) }",
        "explanation": "alreadyRequire 表示“已经声明过”。前面的 ! 表示“没有”；只有缺失时，才加入模块路径和版本。"
      },
      {
        "code": "if dependency.Replace { ... }",
        "explanation": "这项依赖是否要求替代源码？如果需要，再检查已有 replace，缺失才调用 AddReplace。"
      },
      {
        "code": "if changed { ... writeGoMod(gomod, modfile) }",
        "explanation": "只有清单真的改变了，才写回 go.mod。完整函数见下面的固定源码摘录。"
      }
    ],
    "pitfalls": [
      "require 与 import 各管一件事：声明模块版本，不等于调用其中的函数，也不等于把整个模块全编进去。",
      "业务项目能找到 hook，不等于目标函数已经接上 hook；还要完成匹配、改写、编译，并在运行时走到对应调用。",
      "规则中的 Dependencies 前置条件，是检查业务有没有规则需要的库和版本；本页补入的依赖，是让新增代码能编译。两者不能混为一谈。",
      "“不覆盖已有声明”只描述 addDependency 这个函数；完整预处理还会同步依赖，不能据此保证 go.mod 的其他内容都完全不变。"
    ],
    "check": {
      "question": "工具已经安装好了，为什么业务 go.mod 还可能需要改？",
      "answer": "因为工具是加工程序，hook 和记录库是生成后的业务程序需要使用的代码。工具自己能运行，不能代替业务构建对这些库的解析。newDeps 准备导入，addDependency 补声明，后面的改写再把实际调用连接起来。"
    },
    "next": {
      "label": "继续：这些准备工作怎样串成一次构建",
      "href": "#/source/preprocess"
    }
  },
  "rule-load": {
    "title": "规则加载：JSON 先变成具体 Go 类型",
    "plain": "loadRuleFile 读文件，loadRuleRaw 先把 JSON 解成一组原始对象，再根据是否有 Function 或 StructType 选择对应规则结构。",
    "why": "不同规则需要不同字段和改写逻辑；先辨认类型，后面 instrument 才能安全调用函数规则或结构体规则。",
    "prerequisites": [
      {
        "label": "规则依赖",
        "href": "#/source/deps"
      }
    ],
    "terms": [
      {
        "term": "JSON",
        "meaning": "文本格式的对象/数组数据。"
      },
      {
        "term": "RawMessage",
        "meaning": "先保留一段 JSON，稍后按具体结构解码。"
      },
      {
        "term": "InstFuncRule",
        "meaning": "针对函数/方法的规则类型。"
      },
      {
        "term": "InstStructRule",
        "meaning": "针对结构体类型的规则类型。"
      }
    ],
    "input": "规则文件路径和 JSON 数组；nethttp.json 中有 net/http 的 RoundTrip、ServeHTTP 条目。",
    "output": "[]rules.InstRule；每一项实际指向函数规则、结构体规则等具体对象。",
    "steps": [
      {
        "title": "读取文本",
        "explanation": "util.ReadFile 失败时带当前目录返回错误，便于定位相对路径问题。"
      },
      {
        "title": "拆成数组",
        "explanation": "json.Unmarshal 将整个文件变成 []json.RawMessage，而不是直接猜一种结构。"
      },
      {
        "title": "判断字段",
        "explanation": "有 Function 就解成 InstFuncRule，有 StructType 就解成 InstStructRule。"
      },
      {
        "title": "交给匹配器",
        "explanation": "所有具体对象装进 []rules.InstRule，后续按包、版本等条件筛选。",
        "code": "[{\"ImportPath\":\"net/http\",\"Function\":\"RoundTrip\",\"ReceiverType\":\"\\*Transport\"}]",
        "language": "json"
      }
    ],
    "sourceNotes": [
      {
        "code": "var rawMessages []json.RawMessage",
        "explanation": "允许同一个数组包含不同规则形状。"
      },
      {
        "code": "if _, ok := obj[\"Function\"]; ok",
        "explanation": "Function 字段存在时选择函数规则。"
      },
      {
        "code": "rule = &funcRule",
        "explanation": "接口里保存具体规则指针，后续可用类型 switch。"
      }
    ],
    "pitfalls": [
      "把 JSON 解析成功等同于规则一定命中。",
      "忘记规则字段名大小写。",
      "固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。"
    ],
    "check": {
      "question": "规则文件如何变成 InstRule？",
      "answer": "先读文本、解数组、按关键字段选择具体 struct，再以 InstRule 接口统一返回。"
    },
    "next": {
      "label": "理解统一规则接口",
      "href": "#/source/rule-model"
    }
  },
  "rule-model": {
    "title": "规则模型：同一条规则带着哪些约束",
    "plain": "InstRule 接口统一暴露库版本、Go 版本、目标 import、hook 路径和字符串表示；InstBaseRule 保存这些字段。",
    "why": "规则不是“见函数名就改”，它还要回答目标库版本、Go 版本和 hook 代码在哪里。",
    "prerequisites": [
      {
        "label": "规则加载",
        "href": "#/source/rule-load"
      }
    ],
    "terms": [
      {
        "term": "interface",
        "meaning": "只声明方法集合的 Go 类型。"
      },
      {
        "term": "版本区间",
        "meaning": "如 [1.9.1,1.9.2)，表示左闭右开范围。"
      },
      {
        "term": "ImportPath",
        "meaning": "被插桩目标包的完整导入路径。"
      },
      {
        "term": "Path",
        "meaning": "本地 hook 代码所在 module/path。"
      }
    ],
    "input": "一个具体规则对象和目标 package 的库版本、Go 版本。",
    "output": "匹配器可读取的版本/路径信息，以及后续定位 hook 的 Path。",
    "steps": [
      {
        "title": "从接口读契约",
        "explanation": "GetVersion、GetGoVersion、GetImportPath、GetPath 是所有规则都要回答的问题。"
      },
      {
        "title": "理解两个版本",
        "explanation": "Version 约束被改的库；GoVersion 约束编译器。两者不是同一个范围。"
      },
      {
        "title": "理解路径角色",
        "explanation": "ImportPath 指目标库，例如 github.com/gin-gonic/gin；Path 指 hook 代码位置。"
      },
      {
        "title": "用 String 做诊断",
        "explanation": "String 让日志或测试能看到完整规则，而不必猜接口动态类型。"
      }
    ],
    "sourceNotes": [
      {
        "code": "Version string `json:\"Version,omitempty\"`",
        "explanation": "库版本范围可为空；为空意味着不按该字段限制。"
      },
      {
        "code": "GoVersion string `json:\"GoVersion,omitempty\"`",
        "explanation": "Go 版本范围单独保存。"
      },
      {
        "code": "func (rule *InstBaseRule) GetPath() string",
        "explanation": "返回 hook 代码路径，不是目标源码路径。"
      }
    ],
    "pitfalls": [
      "把 Path 当成目标库源文件路径。",
      "把空 Version 解释成支持所有未来版本的保证。",
      "把 GoVersion 和库 Version 拼成一个区间比较。"
    ],
    "check": {
      "question": "Go 版本范围和库版本范围有什么区别？",
      "answer": "前者筛编译环境，后者筛被改写的库；任一不满足都不应使用这条规则。"
    },
    "next": {
      "label": "聚合规则集合",
      "href": "#/source/bundle"
    }
  },
  "bundle": {
    "title": "规则集合：一个编译 package 的工作篮子",
    "plain": "InstRuleSet 按 import path 保存一个编译 action 的文件、函数、结构体规则和 cgo 标记。",
    "why": "同一个 package 只需选择一套规则，instrument 可以按文件集中解析、按类型执行。",
    "prerequisites": [
      {
        "label": "规则模型",
        "href": "#/source/rule-model"
      }
    ],
    "terms": [
      {
        "term": "rule set",
        "meaning": "对一个目标 package 聚合后的规则集合。"
      },
      {
        "term": "map",
        "meaning": "键到值的映射；这里把函数名映射到多条函数规则。"
      },
      {
        "term": "cgo",
        "meaning": "Go 与 C 交互的编译边界，可能影响源文件处理。"
      }
    ],
    "input": "import path 和已经筛选出的 InstRule。",
    "output": "含 PackageName、ImportPath、FileRules、FuncRules、StructRules 的集合。",
    "steps": [
      {
        "title": "创建空集合",
        "explanation": "NewInstRuleSet 初始化切片和两个 map，避免后面向 nil map 写入。"
      },
      {
        "title": "按类别放入",
        "explanation": "文件规则单独保存；函数和结构体规则按名字归类。"
      },
      {
        "title": "记录目标",
        "explanation": "ImportPath 让集合只服务于一个 package；PackageName 供生成代码使用。"
      },
      {
        "title": "检查有效性",
        "explanation": "IsValid 只有在至少有一种规则时才返回 true。",
        "code": "if rset == nil || !rset.IsValid() {\n    return nil\n}",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "FuncRules map[string][]*InstFuncRule",
        "explanation": "同名函数可以对应多条规则，但键是函数名。"
      },
      {
        "code": "StructRules map[string][]*InstStructRule",
        "explanation": "结构体规则使用另一张表，执行时按类型分派。"
      },
      {
        "code": "IsValid()",
        "explanation": "nil 或三类规则全空时不会误认为可插桩。"
      }
    ],
    "pitfalls": [
      "以为一个 package 可以同时套用多个互相冲突的集合。",
      "忘记初始化 map 导致写入 panic。",
      "把 HasCgo 当成“所有文件都是 C 代码”。"
    ],
    "check": {
      "question": "为什么一个 package 选择一个 rule set？",
      "answer": "match 明确返回第一个匹配集合；集合内部再容纳不同类型规则，避免跨 package 混用。"
    },
    "next": {
      "label": "追踪编译 action 匹配",
      "href": "#/source/match"
    }
  },
  "match": {
    "title": "编译 action 匹配：从 -p 找到目标包",
    "plain": "match 从编译器参数取出 -p 的 import path，遍历规则集合，路径相等时返回第一个集合。",
    "why": "真正被编译的是一个个 package action；必须先知道当前 action 的包，才能应用正确规则。",
    "prerequisites": [
      {
        "label": "规则集合",
        "href": "#/source/bundle"
      }
    ],
    "terms": [
      {
        "term": "flag",
        "meaning": "命令参数中的选项，如 -p。"
      },
      {
        "term": "import path",
        "meaning": "包的完整路径，不是磁盘目录名。"
      },
      {
        "term": "first match",
        "meaning": "遍历顺序中第一个满足条件的集合。"
      }
    ],
    "input": "toolexec 传来的 args，其中包含 -p 目标 import path，以及所有 rule set。",
    "output": "匹配的 *InstRuleSet；找不到时返回 nil。",
    "steps": [
      {
        "title": "读取 -p",
        "explanation": "FindFlagValue(args, \"-p\") 取当前编译 action 的包路径。"
      },
      {
        "title": "做安全检查",
        "explanation": "路径为空会触发 sanity check，说明调用方传入不符合预期。"
      },
      {
        "title": "逐个比较",
        "explanation": "源码用 rset.ImportPath == importPath；这里不是正则，也没有按 Function 做匹配。"
      },
      {
        "title": "交给 instrument",
        "explanation": "找到集合后才进入 AST 改写；没有集合就跳过该 package。"
      }
    ],
    "sourceNotes": [
      {
        "code": "importPath := util.FindFlagValue(args, \"-p\")",
        "explanation": "输入来自 Go 编译动作参数。"
      },
      {
        "code": "if rset.ImportPath == importPath",
        "explanation": "包路径精确相等才命中。"
      },
      {
        "code": "return nil",
        "explanation": "未命中不是错误，表示这个 package 没有规则。"
      }
    ],
    "pitfalls": [
      "把 -p 当磁盘绝对路径。",
      "把匹配优先级误认为 Function 正则优先级。",
      "认为未命中一定代表工具失败。"
    ],
    "check": {
      "question": "规则优先级和版本区间怎样决定命中？",
      "answer": "本函数只按 import path 精确选择第一个集合；版本范围应在更早筛选阶段处理，不能凭此函数推断更多优先级。"
    },
    "next": {
      "label": "进入 AST 插桩总流程",
      "href": "#/source/instrument"
    }
  },
  "instrument": {
    "title": "AST 插桩总流程：先文件，再函数和结构体",
    "plain": "instrument 按文件分组规则，先应用可能新增文件的规则，再解析目标文件一次，最后按具体规则类型改写 AST/DST。",
    "why": "AST 是源码的树形结构：函数、参数、return 都是节点。改树比字符串替换更能保留语法结构和格式信息。",
    "prerequisites": [
      {
        "label": "编译 action 匹配",
        "href": "#/source/match"
      }
    ],
    "terms": [
      {
        "term": "AST",
        "meaning": "把源码表示成节点树的语法结构。"
      },
      {
        "term": "DST",
        "meaning": "保留更多源码位置/装饰信息的 Go 语法树库。"
      },
      {
        "term": "parse",
        "meaning": "把源码文本变成可遍历的语法树。"
      },
      {
        "term": "group",
        "meaning": "把同一文件的多条规则聚在一起。"
      }
    ],
    "input": "一个已命中的 InstRuleSet、目标文件和文件/函数/结构体规则。",
    "output": "写回包含 hook/trampoline 改写的源码或临时编译输入。",
    "steps": [
      {
        "title": "先应用文件规则",
        "explanation": "文件规则可能创建 raw rule 需要的新文件，所以源码明确要求它们先执行。"
      },
      {
        "title": "按文件分组",
        "explanation": "同一文件只 parse 一次，避免每条规则重复读源码。"
      },
      {
        "title": "解析 AST/DST",
        "explanation": "parseAst 将文本变成树；树能区分函数声明、receiver、返回列表。"
      },
      {
        "title": "按类型改写",
        "explanation": "函数走 applyFuncRule，结构体走 applyStructRule；任何 error 都立即返回。"
      }
    ],
    "sourceNotes": [
      {
        "code": "for _, rule := range rset.FileRules",
        "explanation": "文件规则拥有最先改变文件集合的机会。"
      },
      {
        "code": "root, err := rp.parseAst(file)",
        "explanation": "输入源码先变成语法树。"
      },
      {
        "code": "switch rt := r.(type)",
        "explanation": "Go 类型 switch 把统一接口还原成具体规则。"
      }
    ],
    "pitfalls": [
      "把 AST 当运行时对象，而不是编译前数据。",
      "直接字符串拼接括号和逗号，容易生成非法 Go。",
      "忽略同一文件多规则需要共享一次解析树。"
    ],
    "check": {
      "question": "为什么使用 dave/dst 而不是直接字符串替换？",
      "answer": "树节点能表达函数和返回值结构，改写后再打印源码，较不容易破坏语法；这是编译前源码变换，不是运行时反射。"
    },
    "next": {
      "label": "看函数节点如何插入跳转",
      "href": "#/source/func-ast"
    }
  },
  "func-ast": {
    "title": "函数 AST 改写：在入口和返回处接上 hook",
    "plain": "createTJumpIf 生成局部 CallContext、onEnter 调用、skip 判断和 onExit 调用，再把返回值交给原函数返回。",
    "why": "hook 要同时看到原参数和返回值；直接包一层字符串函数很难处理命名/匿名返回值、receiver 和多返回值。",
    "prerequisites": [
      {
        "label": "AST 插桩总流程",
        "href": "#/source/instrument"
      }
    ],
    "terms": [
      {
        "term": "receiver",
        "meaning": "方法声明中位于 func 后括号里的接收者。"
      },
      {
        "term": "多返回值",
        "meaning": "一个 Go 函数同时返回多个值，如 (string,error)。"
      },
      {
        "term": "trampoline jump",
        "meaning": "从原函数入口跳到生成的 hook 桥接逻辑。"
      },
      {
        "term": "匿名返回值",
        "meaning": "返回类型存在但结果没有名字的函数签名。"
      }
    ],
    "input": "InstFuncRule、函数声明、参数名和返回值名；无名返回值需要工具生成可用名字。",
    "output": "函数体入口的 hook 调用、可选跳过原调用的分支，以及离开前的 onExit。",
    "steps": [
      {
        "title": "收集参数",
        "explanation": "createHookArgs(args) 把目标函数参数转换成 onEnter 需要的表达式。"
      },
      {
        "title": "准备返回值",
        "explanation": "retVals 传给 onExit；如果原函数返回值没有名字，生成逻辑先为它们准备可引用的名字。"
      },
      {
        "title": "生成唯一变量",
        "explanation": "规则字符串经过 CRC32 得到后缀，避免同一文件里局部变量重名。"
      },
      {
        "title": "组织控制流",
        "explanation": "先 onEnter，再检查 skip；原调用返回后调用 onExit，最后返回 retVals。",
        "code": "callCtx, skip := onEnter(args...)\nif skip { onExit(callCtx, returns...); return returns... }",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "varSuffix := util.Crc32(t.String())",
        "explanation": "变量后缀由规则内容稳定生成。"
      },
      {
        "code": "argsToOnEnter := createHookArgs(args)",
        "explanation": "输入参数进入 onEnter。"
      },
      {
        "code": "argsToOnExit = append([]dst.Expr{argCallContext}, argsToOnExit...)",
        "explanation": "onExit 的第一个参数是 CallContext，后面才是返回值。"
      }
    ],
    "pitfalls": [
      "把 hook 当成替换整个函数指针。",
      "认为 Function 字段是正则；实际 v1.15.0 按名字相等，ReceiverType 才按正则。",
      "跳过原调用后忘记构造/传递返回值。",
      "固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。"
    ],
    "check": {
      "question": "如何保证命名/匿名返回值都能 hook？",
      "answer": "改写阶段把返回表达式统一收集为可引用变量，再用同一组名字构造 onExit 和 return。"
    },
    "next": {
      "label": "理解 trampoline 三层结构",
      "href": "#/source/trampoline"
    }
  },
  "trampoline": {
    "title": "Trampoline：用生成函数桥接 enter、原函数和 exit",
    "plain": "materializeTemplate 解析模板，把 onEnter、onExit 和 CallContextImpl 方法声明放进待生成声明列表。",
    "why": "trampoline 是函数入口里的 defer/桥接逻辑，不是替换函数指针；它让生成代码能在不改业务 hook 签名的情况下传递上下文。",
    "prerequisites": [
      {
        "label": "函数 AST 改写",
        "href": "#/source/func-ast"
      }
    ],
    "terms": [
      {
        "term": "template",
        "meaning": "生成源码前的函数声明模板。"
      },
      {
        "term": "onEnter",
        "meaning": "原函数调用前运行的 hook。"
      },
      {
        "term": "onExit",
        "meaning": "拿到返回值后运行的 hook。"
      },
      {
        "term": "defer",
        "meaning": "函数返回时执行的 Go 语句机制；模板可用它桥接退出。"
      }
    ],
    "input": "trampolineTemplate 文本和 AST parser。",
    "output": "可插入目标包的函数声明、CallContext 方法和 hook 桥接代码。",
    "steps": [
      {
        "title": "解析模板",
        "explanation": "ParseSource 把模板源码变成 AST，而不是把文本直接拼到业务函数中。"
      },
      {
        "title": "筛选函数声明",
        "explanation": "名字等于 onEnterName/onExitName 的函数分别保存。"
      },
      {
        "title": "收集 receiver 方法",
        "explanation": "有 receiver 的声明被断言为 CallContextImpl 方法并加入列表。"
      },
      {
        "title": "等待入口跳转",
        "explanation": "这些声明只是桥的材料；createTJumpIf 再把对它们的调用插入目标函数。"
      },
      {
        "title": "认识 hook panic 的保护边界",
        "explanation": "impl.tmpl 的 enter/exit 桥接函数用 defer + recover 捕获 hook panic，打印错误和可用的栈信息后返回。通常让原调用继续，但不能撤销 hook 已产生的副作用，也不能把没有崩溃当成 hook 成功。"
      }
    ],
    "sourceNotes": [
      {
        "code": "astRoot, err := p.ParseSource(trampolineTemplate)",
        "explanation": "模板自身也必须是合法 Go。"
      },
      {
        "code": "decl.Name.Name == trampolineOnEnterName",
        "explanation": "按约定识别 enter 函数。"
      },
      {
        "code": "ast.HasReceiver(decl)",
        "explanation": "带 receiver 的声明被当作 CallContextImpl 方法。"
      }
    ],
    "pitfalls": [
      "把 trampoline 说成换函数指针。",
      "认为模板能随意 import 新包；生成位置和依赖仍要满足 Go 编译。",
      "认为 defer 一定能处理进程级 os.Exit。"
    ],
    "check": {
      "question": "hook 自己发生 panic，原业务就一定会 panic 退出吗？",
      "answer": "不一定。模板中的 enter/exit 桥有 recover，会捕获并报告 hook panic。仍需检查 hook 失败、返回状态和已发生的副作用；也不要把这个机制当成处理原业务所有 panic 的承诺。"
    },
    "next": {
      "label": "读取 CallContext 契约",
      "href": "#/source/call-context"
    }
  },
  "call-context": {
    "title": "CallContext：enter 和 exit 之间的共享小信封",
    "plain": "CallContext 接口保存 skip 标记、普通 data、按 key 的 data、原参数、返回值和函数元信息。",
    "why": "hook 不需要知道生成代码的局部变量名；它通过这个接口读取或改变约定中的输入输出。",
    "prerequisites": [
      {
        "label": "函数 AST 改写",
        "href": "#/source/func-ast"
      }
    ],
    "terms": [
      {
        "term": "interface",
        "meaning": "hook 看到的是方法契约，不必依赖具体 struct。"
      },
      {
        "term": "skip",
        "meaning": "让生成代码跳过原函数调用。"
      },
      {
        "term": "param",
        "meaning": "原函数的某个参数，按下标访问。"
      },
      {
        "term": "return value",
        "meaning": "原函数的某个返回值，按下标访问。"
      }
    ],
    "input": "onEnter 传入的 CallContext 和原始参数；onExit 得到同一个 CallContext 与返回值。",
    "output": "hook 对参数/返回值的读取或修改，以及是否执行原调用的决定。",
    "steps": [
      {
        "title": "先决定是否跳过",
        "explanation": "SetSkipCall(true) 会影响原函数是否执行；这不是只读日志。"
      },
      {
        "title": "在两端传数据",
        "explanation": "SetData/GetData 或 key data 可把 onEnter 的计算交给 onExit。"
      },
      {
        "title": "按下标读写",
        "explanation": "GetParam/SetParam 和 GetReturnVal/SetReturnVal 按位置访问。目标是方法时，参数列表先包含 receiver，再包含普通参数；不要仅按括号里的参数猜下标。"
      },
      {
        "title": "谨慎改业务值",
        "explanation": "非泛型目标函数支持通过生成的 setter 改参数和返回值；类型和位置必须正确。泛型目标的 SetParam / SetReturnVal 不受支持，生成方法会 panic；在 enter/exit 中调用时，panic 可能被桥的 recover 捕获，不能把“进程没退出”当成修改成功。",
        "code": "// 真实 HTTP hook 的签名形态；片段，省略 import 与函数体\nfunc clientOnEnter(c api.CallContext, t *http.Transport, req *http.Request) {\n    // 第 0 个目标参数是 receiver t，第 1 个才是 req\n}",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "SetSkipCall(bool)",
        "explanation": "公开的控制开关。"
      },
      {
        "code": "SetData(interface{})",
        "explanation": "enter/exit 共享一个任意值。"
      },
      {
        "code": "GetParam(idx int)",
        "explanation": "参数按原函数位置读取。"
      },
      {
        "code": "SetReturnVal(idx int, val interface{})",
        "explanation": "非泛型目标中可替换返回值；泛型目标的生成实现会 panic，不支持这种修改。"
      }
    ],
    "pitfalls": [
      "把 CallContext 当 context.Context。",
      "用错误下标读取参数，运行时才暴露问题。",
      "随意 SetParam/SetReturnVal 改变业务协议。",
      "把泛型目标当成也支持 SetParam / SetReturnVal；对应生成方法会 panic，且 hook panic 可能被桥捕获。"
    ],
    "check": {
      "question": "SetParam 为什么可能改变业务行为？",
      "answer": "对支持修改的非泛型目标，生成代码会把替换值交给原函数或调用者。对泛型目标，这两个 setter 不受支持，不能用它们实现修改。"
    },
    "next": {
      "label": "看具体字段实现",
      "href": "#/source/call-context-impl"
    }
  },
  "call-context-impl": {
    "title": "CallContextImpl：先读测试版，再找生成版",
    "plain": "当前文件 pkg/api/impl.go 开头写明“仅用于测试”。它用简单字段实现 CallContext，方便测试 hook；真正插入业务包的实现来自另一份模板。",
    "why": "先看简单字段，比较容易理解 enter 和 exit 怎样共享数据。但要二开生成行为，必须再去看 tool/instrument/impl.tmpl 和 trampoline.go，不能只改这份测试帮手。",
    "prerequisites": [
      {
        "label": "CallContext 接口的用途",
        "href": "#/source/call-context"
      }
    ],
    "terms": [
      {
        "term": "接口",
        "meaning": "规定有哪些可调用方法；不要求每个实现都使用相同内部字段。"
      },
      {
        "term": "测试帮手",
        "meaning": "测试中构造接口对象的简化实现，不能直接推断它就是生产生成代码。"
      },
      {
        "term": "slice（切片）",
        "meaning": "按下标存放多个元素，例如测试中的参数列表。"
      },
      {
        "term": "生成模板",
        "meaning": "工具据此创建并改写真实代码的底稿。"
      }
    ],
    "input": "测试代码准备的 Params、ReturnVals、SkipCall 和 Data 字段，以及对接口方法的调用。",
    "output": "测试中可使用的 CallContext 对象。实际业务插桩会使用生成到目标包内的实现，类型还会按规则带上 CRC 后缀。",
    "steps": [
      {
        "title": "先看文件里的用途说明",
        "explanation": "For testing purpose only 已限定了这个类型的角色。读源码不仅看类型名，也要看它由谁创建、在哪个构建里使用。"
      },
      {
        "title": "把方法对上普通字段",
        "explanation": "SkipCall 存是否跳过，Data 存 enter/exit 共享数据；Params 和 ReturnVals 存测试准备的参数与结果。"
      },
      {
        "title": "注意 getter 返回的是地址",
        "explanation": "测试实现的 GetParam 返回 &c.Params[idx]，GetReturnVal 返回 &c.ReturnVals[idx]。它们不是把元素原值直接返回；用 interface{} 接到以后还需按具体类型理解。",
        "code": "func (c *CallContextImpl) GetParam(idx int) interface{} {\n    return &c.Params[idx]\n}",
        "language": "go"
      },
      {
        "title": "按 key 存数据也有类型条件",
        "explanation": "SetKeyData 在 Data 为 nil 时创建 map；如果你先用 SetData 放了其他类型，再把它断言为 map，会 panic。"
      },
      {
        "title": "最后找真实生成位置",
        "explanation": "tool/instrument/impl.tmpl 提供模板；trampoline.go 把它解析、按目标签名改写，并给相关类型加 CRC 后缀。生产修改要沿这条生成路径核验。"
      }
    ],
    "sourceNotes": [
      {
        "code": "// For testing purpose only",
        "explanation": "上游直接声明这是测试用实现。"
      },
      {
        "code": "Params []interface{}",
        "explanation": "测试对象保存参数的切片；并非生成代码必须永远采用的外部稳定字段。"
      },
      {
        "code": "return &c.Params[idx]",
        "explanation": "返回切片元素地址。这里的 & 不能在阅读时忽略。"
      },
      {
        "code": "c.Data.(map[string]interface{})[key]",
        "explanation": "这次类型断言要求 Data 确实是这种 map。"
      }
    ],
    "pitfalls": [
      "把测试实现当成实际注入目标包的唯一实现。",
      "只改 pkg/api/impl.go，就以为改变了真实 trampoline。",
      "忽略 getter 的地址返回和 Data 的类型断言。"
    ],
    "check": {
      "question": "想改变真实插桩生成的 CallContext，只改这个文件够吗？",
      "answer": "不够。这是测试帮手；真实路径要看 impl.tmpl 以及 trampoline.go 对模板的解析、签名改写和重命名，再检查生成到目标包的代码。"
    },
    "next": {
      "label": "看模板怎样生成桥接代码",
      "href": "#/source/trampoline"
    }
  },
  "linkname": {
    "title": "go:linkname：跨包符号的窄桥",
    "plain": "runtime_linker.go 用 go:linkname 给变量/函数指定链接符号名，让生成 hook 能找到运行时实现。",
    "why": "普通 Go 包边界不允许直接引用这些内部符号；这座桥让工具生成代码和 runtime rule module 连接起来。",
    "prerequisites": [
      {
        "label": "CallContext 实现",
        "href": "#/source/call-context-impl"
      }
    ],
    "terms": [
      {
        "term": "symbol",
        "meaning": "链接器用来识别函数或变量的名字。"
      },
      {
        "term": "linker",
        "meaning": "把各 package 编译产物连接成程序的工具。"
      },
      {
        "term": "ABI",
        "meaning": "调用方与被调用方约定参数、寄存器和布局的低层接口。"
      },
      {
        "term": "unsafe",
        "meaning": "允许绕过部分普通类型安全边界的标准库包。"
      }
    ],
    "input": "带 go:linkname 的声明、runtime rule module 和匹配的 Go toolchain。",
    "output": "生成代码可调用的符号入口；编译/链接成功并不等于 ABI 永久稳定。",
    "steps": [
      {
        "title": "看声明不是实现",
        "explanation": "var otel_get... = _otel... 把一个可见名字绑定到实现函数。"
      },
      {
        "title": "看符号名",
        "explanation": "go:linkname 两侧名称决定链接器寻找哪个符号。"
      },
      {
        "title": "识别版本边界",
        "explanation": "目标 runtime 私有字段、ABI 和编译器可能变化；这不是普通包 API。"
      },
      {
        "title": "先验证最小构建",
        "explanation": "更改 Go 版本或 rule module 后先编译最小 fixture，再谈兼容性。"
      }
    ],
    "sourceNotes": [
      {
        "code": "//go:linkname otel_get_trace_context_from_gls otel_get_trace_context_from_gls",
        "explanation": "给链接器指定跨包符号名。"
      },
      {
        "code": "var otel_get_trace_context_from_gls = _otel_gls_get_trace_context_impl",
        "explanation": "生成/调用侧获得一个命名入口。"
      }
    ],
    "pitfalls": [
      "把 linkname 当普通 import。",
      "认为能链接就代表未来 Go 版本也兼容。",
      "在没有查证 ABI/源码时承诺支持所有 toolchain。"
    ],
    "check": {
      "question": "linkname 为什么受 Go 版本和 ABI 影响？",
      "answer": "它绕过普通包可见性，依赖链接符号和调用布局；Go runtime 或编译器改变就可能失效。"
    },
    "next": {
      "label": "区分 GLS 数据桥",
      "href": "#/source/linkname"
    }
  },
  "gls": {
    "title": "GLS：工具提供的协程上下文桥",
    "plain": "GLS 函数通过 getg().m.curg 读写当前 goroutine 的 trace context、baggage 和调用深度字段。",
    "why": "Go 原生不会自动把 context.Context 复制给新 goroutine；这里是额外的 runtime/tool hook 机制，不是语言保证。",
    "prerequisites": [
      {
        "label": "跨包符号桥",
        "href": "#/source/linkname"
      }
    ],
    "terms": [
      {
        "term": "GLS",
        "meaning": "这里指工具维护的 goroutine-local storage，不是 Go 标准库。"
      },
      {
        "term": "goroutine",
        "meaning": "Go runtime 调度的轻量执行单元。"
      },
      {
        "term": "baggage",
        "meaning": "随传播上下文携带的键值信息。"
      },
      {
        "term": "nosplit",
        "meaning": "告诉编译器该函数不插入栈增长分裂点的指令。"
      }
    ],
    "input": "当前 goroutine 的 runtime 结构和被注入的字段。",
    "output": "trace context、baggage 的读取/写入结果，以及 producer call depth 计数。",
    "steps": [
      {
        "title": "读当前执行单元",
        "explanation": "getg().m.curg 取得当前 goroutine 结构；这依赖特定 runtime 形状。"
      },
      {
        "title": "读取上下文",
        "explanation": "get trace/baggage 函数返回对应字段的 interface{}。"
      },
      {
        "title": "写回上下文",
        "explanation": "set 函数把 hook 产生的值放回当前结构。"
      },
      {
        "title": "别替代显式交接",
        "explanation": "预创建 worker、消息和跨进程边界仍应传递 context/carrier；GLS 只覆盖工具识别的路径。"
      }
    ],
    "sourceNotes": [
      {
        "code": "return getg().m.curg.otel_trace_context",
        "explanation": "trace context 从当前 goroutine 结构读取。"
      },
      {
        "code": "getg().m.curg.otel_baggage_container = v",
        "explanation": "baggage 由 runtime bridge 写回。"
      },
      {
        "code": "//go:nosplit",
        "explanation": "runtime 低层函数使用了特殊编译约束。"
      }
    ],
    "pitfalls": [
      "把 GLS 说成 context.Context。",
      "把 goroutine 创建理解成一定自动继承。",
      "忽略 runtime 字段和 Go 版本的兼容风险。"
    ],
    "check": {
      "question": "为什么 goroutine 创建不是普通 context 继承？",
      "answer": "因为 Go 规范只保证显式变量/参数访问，不保证隐式 context 传播；GLS 是额外工具机制。"
    },
    "next": {
      "label": "阅读自定义 hook 入口",
      "href": "#/source/hook-rule"
    }
  },
  "hook-rule": {
    "title": "自定义 Hook：普通 Go 函数也要遵守连接约定",
    "plain": "文档示例创建 hook module，导入 api.CallContext 和目标库，并用 go:linkname 把 OnEnter 名称接到生成调用点。",
    "why": "hook 不是魔法插件；它最终是被编译进目标程序的普通 Go 函数，但参数顺序必须和目标函数对应。",
    "prerequisites": [
      {
        "label": "CallContext API",
        "href": "#/source/call-context"
      },
      {
        "label": "规则依赖",
        "href": "#/source/deps"
      }
    ],
    "terms": [
      {
        "term": "hook",
        "meaning": "在目标函数前后执行的普通 Go 函数。"
      },
      {
        "term": "blank import",
        "meaning": "import _ \"unsafe\" 等只为初始化/指令生效而导入的包。"
      },
      {
        "term": "OnEnter",
        "meaning": "目标函数调用前的 hook。"
      },
      {
        "term": "OnExit",
        "meaning": "目标函数返回后接收返回值的 hook。"
      }
    ],
    "input": "目标函数签名、api.CallContext、hook module 的 go.mod 和 linkname 名称。",
    "output": "可被生成 trampoline 调用的 enter/exit 函数；返回值和参数类型可通过编译检查。",
    "steps": [
      {
        "title": "建立 hook 自己的模块",
        "explanation": "上游通常放在 pkg/rules 下；自定义规则也可以指向项目外的本地模块。这个模块自己的 go.mod 必须能解析，Path 要能定位到它。"
      },
      {
        "title": "先读原方法的签名",
        "explanation": "RoundTrip 不只有 req 参数；前面的 (t *http.Transport) 是 receiver，表示这个方法属于 Transport。以下为方法声明形态，省略函数体，不能单独编译。",
        "code": "func (t *http.Transport) RoundTrip(req *http.Request) (*http.Response, error)",
        "language": "go"
      },
      {
        "title": "进入 hook：先上下文，再 receiver，再普通参数",
        "explanation": "这是 HTTP 方法 hook 的形态。CallContext 固定放首位；方法 receiver 是下一个参数，之后才跟 req。下面是签名片段，仍需模块、import、连接声明及实现。",
        "code": "func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request) {\n    // 先只读观察，不改变原始参数\n}",
        "language": "go"
      },
      {
        "title": "退出 hook：接收原返回值",
        "explanation": "退出 hook 在 CallContext 后接方法的返回值，不重复传入 receiver。函数和方法的 enter 参数规则要区分。下面也是片段。",
        "code": "func clientOnExit(call api.CallContext, res *http.Response, err error) {\n    // 检查结果；按需要结束观察记录\n}",
        "language": "go"
      },
      {
        "title": "先验证只读连接，再考虑修改值",
        "explanation": "先证明 hook 命中、被调用、原返回值保持正确。再考虑 SetParam / SetReturnVal；泛型目标不支持这两个修改方法，生成实现会 panic。"
      }
    ],
    "sourceNotes": [
      {
        "code": "import _ \"unsafe\"",
        "explanation": "示例为 linkname 指令准备 unsafe 导入。"
      },
      {
        "code": "//go:linkname muxRoute130OnEnter github.com/gorilla/mux.muxRoute130OnEnter",
        "explanation": "hook 名字链接到目标包内生成的符号。"
      },
      {
        "code": "func muxRoute130OnEnter(call api.CallContext, req *http.Request, route interface{})",
        "explanation": "CallContext 必须排在第一个，后续参数匹配目标。"
      }
    ],
    "pitfalls": [
      "把 hook 当成可自动注入任意依赖的容器。",
      "enter/exit 参数顺序与目标函数不一致。",
      "没有目标版本范围就宣称 hook 永远兼容。",
      "方法 hook 漏掉 receiver，导致剩余参数全部错位。"
    ],
    "check": {
      "question": "hook 参数为什么必须先放 CallContext？",
      "answer": "生成代码按这个固定位置传入共享对象。普通函数接着是普通参数；方法接着先是 receiver，再是普通参数。退出 hook 则接收返回值。"
    },
    "next": {
      "label": "用真实 JSON 配置 hook",
      "href": "#/source/rule-json"
    }
  },
  "rule-json": {
    "title": "规则 JSON：把目标函数和 hook 名字写成数据",
    "plain": "nethttp.json 用 ImportPath、Function、ReceiverType、OnEnter、OnExit、Path 描述 net/http 的两个目标方法。",
    "why": "把匹配条件从 Go 代码抽成数据，工具就能加载、筛选、生成统一的改写流程。",
    "prerequisites": [
      {
        "label": "规则加载",
        "href": "#/source/rule-load"
      },
      {
        "label": "自定义 Hook",
        "href": "#/source/hook-rule"
      }
    ],
    "terms": [
      {
        "term": "ImportPath",
        "meaning": "目标包路径，如 net/http。"
      },
      {
        "term": "Function",
        "meaning": "目标名字；固定实现按名字相等匹配，与文档宣称的正则能力存在差异。"
      },
      {
        "term": "ReceiverType",
        "meaning": "方法接收者的匹配表达式；源码把它当正则使用。"
      },
      {
        "term": "OnEnter/OnExit",
        "meaning": "生成调用的 hook 函数名。"
      }
    ],
    "input": "JSON 数组和目标编译 package 的声明信息。",
    "output": "InstFuncRule 列表；命中后生成对指定 hook 的调用。",
    "steps": [
      {
        "title": "先锁包",
        "explanation": "ImportPath net/http 让规则只考虑这个包。"
      },
      {
        "title": "再锁方法",
        "explanation": "RoundTrip、ServeHTTP 是 Function 字段。当前执行代码按名字相等匹配；虽然文档仍声明支持正则，本指南按固定实现说明，并把差异作为二开时的回归点。"
      },
      {
        "title": "用 receiver 区分方法",
        "explanation": "ReceiverType 如 \\*Transport、serverHandler 用于接收者匹配，才是正则语义位置。"
      },
      {
        "title": "指定实现位置",
        "explanation": "Path 指向真实 hook module github.com/alibaba/loongsuite-go/pkg/rules/http。"
      }
    ],
    "sourceNotes": [
      {
        "code": "\"Function\": \"RoundTrip\"",
        "explanation": "目标函数名。"
      },
      {
        "code": "\"ReceiverType\": \"\\*Transport\"",
        "explanation": "Transport 指针 receiver 的正则表达式。"
      },
      {
        "code": "\"OnEnter\": \"clientOnEnter\", \"OnExit\": \"clientOnExit\"",
        "explanation": "生成代码要调用的 enter/exit 名称。"
      },
      {
        "code": "\"Path\": \"github.com/alibaba/loongsuite-go/pkg/rules/http\"",
        "explanation": "hook module/import 路径。"
      }
    ],
    "pitfalls": [
      "把 ReceiverType 的反斜杠 JSON 转义漏掉。",
      "Path 写成随意目录，导致 hook module 无法解析。",
      "固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。"
    ],
    "check": {
      "question": "如何为一个库版本增加匹配范围？",
      "answer": "在对应规则条目增加准确的 Version/GoVersion 范围，并用 fixture 验证；不要靠改 Function 名字扩大匹配。"
    },
    "next": {
      "label": "看运行时如何开始 Span",
      "href": "#/source/otel-runtime"
    }
  },
  "otel-runtime": {
    "title": "运行时入口：从 request 到新的 Span context",
    "plain": "InternalInstrumenter.doStart 检查是否启用，再确定 Span 名称和类型，调用 tracer.Start 创建记录与新的 context，随后设置属性并返回。",
    "why": "编译期命中只说明代码被插入；真正的父子关系和属性要在运行时 context、Tracer 和 SDK 中完成。",
    "prerequisites": [
      {
        "label": "自定义 Hook",
        "href": "#/source/hook-rule"
      }
    ],
    "terms": [
      {
        "term": "context.Context",
        "meaning": "显式携带取消、deadline 和 OTel SpanContext 的接口。"
      },
      {
        "term": "Span",
        "meaning": "一次操作的时间区间和属性容器。"
      },
      {
        "term": "Tracer",
        "meaning": "创建 Span 的 OTel API 对象。"
      },
      {
        "term": "enabler",
        "meaning": "决定当前 instrumenter 是否启用的开关。"
      }
    ],
    "input": "parentContext、request、时间戳、SpanStartOption 和 instrumenter 配置。",
    "output": "newCtx：包含新 Span 和属性的 context，之后交给后续操作；禁用时直接返回 parentContext。",
    "steps": [
      {
        "title": "先判断开关",
        "explanation": "enabler 存在且未启用时，不创建 Span，原 context 原样返回。"
      },
      {
        "title": "准备命名和类型",
        "explanation": "extractor 从 request 得到 spanName、spanKind，并追加时间/类型选项。"
      },
      {
        "title": "创建并丰富 Span",
        "explanation": "tracer.Start 返回 newCtx 与 span；属性 extractor 和 customizer 继续修改它们。"
      },
      {
        "title": "把新的 context 交给下游",
        "explanation": "Span 已由 tracer.Start 放入它返回的 newCtx。最后调用抑制策略的 StoreInContext 钩子；此版本内置实现直接返回 context，不会再额外存一遍 Span。",
        "code": "return i.spanSuppressor.StoreInContext(newCtx, spanKind, span)",
        "language": "go"
      }
    ],
    "sourceNotes": [
      {
        "code": "if i.enabler != nil && !i.enabler.Enable()",
        "explanation": "禁用路径不创建新 Span。"
      },
      {
        "code": "newCtx, span := i.tracer.Start(parentContext, spanName, options...)",
        "explanation": "父 context 是新 Span 的输入。"
      },
      {
        "code": "return i.spanSuppressor.StoreInContext(newCtx, spanKind, span)",
        "explanation": "调用策略钩子后返回 context；当前内置实现保持它不变。不要仅凭方法名推断它又保存了一份 Span。"
      }
    ],
    "pitfalls": [
      "把 CallContext 当成 context.Context。",
      "看到相同 TraceID 就断言只有一个合法 child span。",
      "把 manual OTel 兼容或 existingprovider/otelhttp 去重说成上游默认保证。",
      "把 StoreInContext 的名字当作它一定写入 Span 的证据；要继续读该接口的具体实现。"
    ],
    "check": {
      "question": "自动 Span 如何沿用 ctx 中的 SpanContext？",
      "answer": "tracer.Start 接收 parentContext；若其中有有效 SpanContext，SDK 按采样与父子规则创建新 Span。"
    },
    "next": {
      "label": "最后检查版本兼容边界",
      "href": "#/source/version-boundary"
    }
  },
  "version-boundary": {
    "title": "兼容性边界：三种版本要一起看",
    "plain": "兼容性不是一个数字：Go toolchain、目标库版本、runtime/ABI 都会影响规则能否编译和运行。",
    "why": "规则是按源码形状和符号约定写的；库升级、Go runtime 变化或 OTel module 最低版本变化，都可能让旧规则失效。",
    "prerequisites": [
      {
        "label": "规则模型",
        "href": "#/source/rule-model"
      },
      {
        "label": "跨包符号桥",
        "href": "#/source/linkname"
      }
    ],
    "terms": [
      {
        "term": "toolchain",
        "meaning": "编译 Go 程序的一组工具和版本。"
      },
      {
        "term": "ABI",
        "meaning": "低层调用与布局约定。"
      },
      {
        "term": "compatibility range",
        "meaning": "规则声明能安全匹配的版本区间。"
      },
      {
        "term": "GOTOOLCHAIN",
        "meaning": "Go 选择本地或自动下载 toolchain 的环境变量。"
      }
    ],
    "input": "业务 go.mod 的 Go 版本、目标库版本、LoongSuite commit、规则范围和 runtime 符号。",
    "output": "一个可审计的兼容矩阵：是否满足 Go 最低版本、库规则范围和 runtime/ABI 约束。",
    "steps": [
      {
        "title": "先看 Go 最低版本",
        "explanation": "文档说明 OTel v1.42.0 起声明 go 1.25.0，快照固定 v1.45.0，因此工具和被插桩应用都需 Go 1.25 或更高。"
      },
      {
        "title": "再看库版本",
        "explanation": "net/http、GORM、Mongo 等规则要匹配实际源码版本；不能只改业务代码绕过不匹配。"
      },
      {
        "title": "再看低层桥",
        "explanation": "linkname、GLS runtime 字段和 trampoline 结构还有 ABI/编译器风险。"
      },
      {
        "title": "做最小验证",
        "explanation": "记录 go version、GOTOOLCHAIN、go.mod、规则 JSON 和 fixture 构建结果，再扩大测试。",
        "code": "go version\ngo env GOTOOLCHAIN\ngo list -m all",
        "language": "sh"
      }
    ],
    "sourceNotes": [
      {
        "code": "Minimum Go version: 1.25",
        "explanation": "兼容性文档明确给出最低版本。"
      },
      {
        "code": "GOTOOLCHAIN=auto",
        "explanation": "Go 1.24 可能自动下载 1.25；GOTOOLCHAIN=local 时则失败。"
      },
      {
        "code": "following minor release ... remove compatibility testing",
        "explanation": "上游支持窗口会随 Go 新版本滚动，不是永久承诺。"
      }
    ],
    "pitfalls": [
      "把“能下载 toolchain”当成规则一定兼容。",
      "把库版本范围和 Go 版本范围混为一谈。",
      "把 trace 相同解释成没有多个合法 child span。",
      "把手工 OTel 兼容补丁当作上游默认行为。"
    ],
    "check": {
      "question": "为什么版本不匹配时不能只改业务代码？",
      "answer": "插桩规则依赖目标源码结构，运行时桥依赖 ABI，注入的 OTel module 又有最低 Go 版本；三者任一变化都可能在编译或运行时失败。"
    },
    "next": {
      "label": "回到第一张源码地图",
      "href": "#/source/go-mod"
    }
  }
};
