// Each map names the objects in the corresponding article example.
export const motionMaps = {
  "source": {
    "go-mod": {
      "mode": "modules",
      "nodes": [
        {
          "id": "n0",
          "label": "业务 go.mod",
          "detail": "module example.com/live",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "import rules/http",
          "detail": "生成文件需要 HTTP 记录包",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "require + replace",
          "detail": "精确替换 rules/http 模块",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "本地 rules/http",
          "detail": "与基础 pkg 分别解析",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "新增 import"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "查 go.mod"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "找本地代码"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "先有业务模块的地址。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "新增 import 指向独立的 HTTP 规则模块。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "HTTP 规则包自己有 go.mod，必须精确配置其模块路径。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "Go 分别找到 HTTP 规则模块与基础 pkg，后续才能编译。",
          "broken": []
        }
      ]
    },
    "cli": {
      "mode": "build",
      "nodes": [
        {
          "id": "command",
          "label": "otel go build",
          "detail": "用户命令",
          "x": 100,
          "y": 80
        },
        {
          "id": "cli",
          "label": "tool/cli",
          "detail": "解析参数",
          "x": 300,
          "y": 80
        },
        {
          "id": "pre",
          "label": "Preprocess",
          "detail": "准备依赖/规则",
          "x": 300,
          "y": 220
        },
        {
          "id": "build",
          "label": "go build",
          "detail": "启动 toolexec",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "command",
          "to": "cli",
          "label": "参数"
        },
        {
          "from": "cli",
          "to": "pre",
          "label": "前置"
        },
        {
          "from": "pre",
          "to": "build",
          "label": "完成"
        }
      ],
      "stages": [
        {
          "visible": [
            "command"
          ],
          "active": [
            "command"
          ],
          "moving": [],
          "note": "入口拿到命令文本"
        },
        {
          "visible": [
            "command",
            "cli"
          ],
          "active": [
            "cli"
          ],
          "moving": [
            0
          ],
          "note": "CLI 解析 build 参数"
        },
        {
          "visible": [
            "command",
            "cli",
            "pre"
          ],
          "active": [
            "pre"
          ],
          "moving": [
            1
          ],
          "note": "交给 Preprocess"
        },
        {
          "visible": [
            "command",
            "cli",
            "pre",
            "build"
          ],
          "active": [
            "build"
          ],
          "moving": [
            2
          ],
          "note": "准备完才构建"
        }
      ]
    },
    "rule-load": {
      "mode": "flow",
      "nodes": [
        {
          "id": "n0",
          "label": "nethttp.json",
          "detail": "RoundTrip 的 JSON 文本",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "Go Rule 对象",
          "detail": "ImportPath / Function / hook",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "本例字段检查",
          "detail": "这是一条函数规则",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "交给匹配器",
          "detail": "加载成功 ≠ 当前项目命中",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "解析 JSON"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "检查字段"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "等待匹配"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "先看到 HTTP 规则的 JSON 文本。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "把文本字段转换为 Go 对象。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "本例函数规则需要目标包与函数名；其他规则类型另有条件。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "只有加载完，后面才能结合实际依赖判断是否适用。",
          "broken": []
        }
      ]
    },
    "rule-model": {
      "mode": "flow",
      "nodes": [
        {
          "id": "n0",
          "label": "Function: Open",
          "detail": "仅函数名还不够",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "gorm.io/gorm",
          "detail": "确定哪个包的 Open",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "Version 条件",
          "detail": "限定可处理的库版本",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "方法还有 receiver",
          "detail": "另看 HTTP: *Transport",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "限定包"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "限定版本"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "另看方法条件"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "同名函数可能在不同包里。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "加 ImportPath，确定 GORM 包中的 Open。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "再加版本区间，限定适用的实现。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "换看 HTTP 方法的例子：还需要 *Transport 这个接收者条件。",
          "broken": []
        }
      ]
    },
    "bundle": {
      "mode": "flow",
      "nodes": [
        {
          "id": "httpcompile",
          "label": "compile net/http",
          "detail": "RoundTrip",
          "x": 100,
          "y": 80
        },
        {
          "id": "httpbundle",
          "label": "HTTP bundle",
          "detail": "clientOnEnter/Exit",
          "x": 300,
          "y": 80
        },
        {
          "id": "gormcompile",
          "label": "compile gorm",
          "detail": "Open",
          "x": 100,
          "y": 230
        },
        {
          "id": "gormbundle",
          "label": "GORM bundle",
          "detail": "afterGormOpen",
          "x": 500,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "httpcompile",
          "to": "httpbundle",
          "label": "命中 HTTP"
        },
        {
          "from": "gormcompile",
          "to": "gormbundle",
          "label": "命中 GORM"
        },
        {
          "from": "httpbundle",
          "to": "gormbundle",
          "label": "最终保存"
        }
      ],
      "stages": [
        {
          "visible": [
            "httpcompile",
            "gormcompile"
          ],
          "active": [
            "httpcompile"
          ],
          "moving": [],
          "note": "dry build 暴露编译目标"
        },
        {
          "visible": [
            "httpcompile",
            "gormcompile",
            "httpbundle"
          ],
          "active": [
            "httpbundle"
          ],
          "moving": [
            0
          ],
          "note": "net/http 形成 HTTP bundle"
        },
        {
          "visible": [
            "httpcompile",
            "gormcompile",
            "httpbundle",
            "gormbundle"
          ],
          "active": [
            "gormbundle"
          ],
          "moving": [
            1
          ],
          "note": "gorm 形成独立 GORM bundle"
        },
        {
          "visible": [
            "httpcompile",
            "gormcompile",
            "httpbundle",
            "gormbundle"
          ],
          "active": [
            "httpbundle",
            "gormbundle"
          ],
          "moving": [
            2
          ],
          "note": "按目标保存最终 bundles"
        }
      ]
    },
    "match": {
      "mode": "flow",
      "nodes": [
        {
          "id": "deps",
          "label": "dry-run deps",
          "detail": "实际编译依赖",
          "x": 100,
          "y": 80
        },
        {
          "id": "version",
          "label": "版本/包匹配",
          "detail": "gorm v1.25.12",
          "x": 300,
          "y": 80
        },
        {
          "id": "rule",
          "label": "命中或跳过",
          "detail": "规则条件",
          "x": 500,
          "y": 80
        },
        {
          "id": "bundle",
          "label": "InstRuleSet",
          "detail": "进入改写",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "deps",
          "to": "version",
          "label": "提供事实"
        },
        {
          "from": "version",
          "to": "rule",
          "label": "比较"
        },
        {
          "from": "rule",
          "to": "bundle",
          "label": "命中才加入"
        }
      ],
      "stages": [
        {
          "visible": [
            "deps"
          ],
          "active": [
            "deps"
          ],
          "moving": [],
          "note": "先读 dry-run"
        },
        {
          "visible": [
            "deps",
            "version"
          ],
          "active": [
            "version"
          ],
          "moving": [
            0
          ],
          "note": "取包路径和版本"
        },
        {
          "visible": [
            "deps",
            "version",
            "rule"
          ],
          "active": [
            "rule"
          ],
          "moving": [
            1
          ],
          "note": "规则条件决定命中"
        },
        {
          "visible": [
            "deps",
            "version",
            "rule",
            "bundle"
          ],
          "active": [
            "bundle"
          ],
          "moving": [
            2
          ],
          "note": "命中结果交给 instrument"
        }
      ]
    },
    "toolexec": {
      "mode": "build",
      "nodes": [
        {
          "id": "go",
          "label": "go build",
          "detail": "用户命令",
          "x": 100,
          "y": 80
        },
        {
          "id": "wrap",
          "label": "toolexec wrapper",
          "detail": "记录并转发",
          "x": 300,
          "y": 80
        },
        {
          "id": "compile",
          "label": "compile",
          "detail": "编译 Go 包",
          "x": 500,
          "y": 80
        },
        {
          "id": "link",
          "label": "link",
          "detail": "最终程序",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "go",
          "to": "wrap",
          "label": "调用"
        },
        {
          "from": "wrap",
          "to": "compile",
          "label": "原参数"
        },
        {
          "from": "compile",
          "to": "link",
          "label": "链接"
        }
      ],
      "stages": [
        {
          "visible": [
            "go"
          ],
          "active": [
            "go"
          ],
          "moving": [],
          "note": "普通构建开始"
        },
        {
          "visible": [
            "go",
            "wrap"
          ],
          "active": [
            "wrap"
          ],
          "moving": [
            0
          ],
          "note": "wrapper 收到命令"
        },
        {
          "visible": [
            "go",
            "wrap",
            "compile"
          ],
          "active": [
            "compile"
          ],
          "moving": [
            1
          ],
          "note": "原参数交给 compiler"
        },
        {
          "visible": [
            "go",
            "wrap",
            "compile",
            "link"
          ],
          "active": [
            "link"
          ],
          "moving": [
            2
          ],
          "note": "link 产出程序"
        }
      ]
    },
    "instrument": {
      "mode": "build",
      "nodes": [
        {
          "id": "n0",
          "label": "room.go",
          "detail": "example.com/live/room",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "AST / DST",
          "detail": "Handle 的语法结构",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "选中 Handle",
          "detail": "包名与函数名都匹配",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "加工后的函数体",
          "detail": "入口 + defer 退出动作",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "解析"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "选中目标"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "写回源码"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "本次编译处理的是 room.go。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "先解析文件，找到 Handle 和它的函数体。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "按规则精确选出这个 Handle。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "把观察动作接进函数体，再交回编译器。",
          "broken": []
        }
      ]
    },
    "func-ast": {
      "mode": "call",
      "nodes": [
        {
          "id": "n0",
          "label": "Handle(ok)",
          "detail": "失败与成功两个 return",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "Enter → CallContext",
          "detail": "为本次调用建立观察状态",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "defer Exit(call)",
          "detail": "两条 return 都能收尾",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "方法另带 receiver",
          "detail": "*Transport + request",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "进入"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "安排收尾"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "核对方法形状"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "先看具有两个返回路径的 Handle。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "在进入时建立这次调用的状态。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "退出动作放在 defer 中，覆盖两条正常返回路径。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "另看 HTTP 方法：Enter 的参数形状还包括 receiver。",
          "broken": []
        }
      ]
    },
    "trampoline": {
      "mode": "call",
      "nodes": [
        {
          "id": "n0",
          "label": "调用者",
          "detail": "Handle(7)",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "trampoline 桥",
          "detail": "先调用 Enter",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "原来的 Handle",
          "detail": "执行原业务，得到 8",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "Exit → return 8",
          "detail": "收尾后把结果还给调用者",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "进入桥"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "执行原业务"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "结果 8"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "调用者仍然调用 Handle(7)。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "生成桥接代码接住调用，先完成 Enter。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "桥继续执行原业务实现，得到结果 8。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "Exit 读取同次调用状态，最后返回业务结果。",
          "broken": []
        }
      ]
    },
    "call-context": {
      "mode": "call",
      "nodes": [
        {
          "id": "enter",
          "label": "clientOnEnter",
          "detail": "call + Transport + request",
          "x": 115,
          "y": 65
        },
        {
          "id": "data",
          "label": "CallContext.Data",
          "detail": "ctx + request",
          "x": 340,
          "y": 65
        },
        {
          "id": "original",
          "label": "RoundTrip(req)",
          "detail": "response + error",
          "x": 115,
          "y": 255
        },
        {
          "id": "exit",
          "label": "clientOnExit",
          "detail": "GetData + res + err",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "enter",
          "to": "data",
          "label": "SetData"
        },
        {
          "from": "enter",
          "to": "original",
          "label": "继续原方法"
        },
        {
          "from": "data",
          "to": "exit",
          "label": "GetData"
        },
        {
          "from": "original",
          "to": "exit",
          "label": "res + err"
        }
      ],
      "stages": [
        {
          "visible": [
            "enter"
          ],
          "active": [
            "enter"
          ],
          "moving": [],
          "note": "Enter 收到同一次调用的参数与 CallContext。",
          "broken": []
        },
        {
          "visible": [
            "enter",
            "data"
          ],
          "active": [
            "data"
          ],
          "moving": [
            0
          ],
          "note": "Enter 用 SetData 保存 ctx 和请求元数据；不是用 SetParam 当字典。",
          "broken": []
        },
        {
          "visible": [
            "enter",
            "data",
            "original"
          ],
          "active": [
            "original"
          ],
          "moving": [
            1
          ],
          "note": "原方法继续运行，产生 response 与 error。",
          "broken": []
        },
        {
          "visible": [
            "enter",
            "data",
            "original",
            "exit"
          ],
          "active": [
            "exit"
          ],
          "moving": [
            2,
            3
          ],
          "note": "Exit 直接收到返回值，同时从 GetData 取回 Enter 保存的状态。",
          "broken": []
        }
      ]
    },
    "call-context-impl": {
      "mode": "flow",
      "nodes": [
        {
          "id": "test",
          "label": "pkg/api/impl.go",
          "detail": "仅供测试的实现",
          "x": 115,
          "y": 65
        },
        {
          "id": "tmpl",
          "label": "impl.tmpl",
          "detail": "生产生成模板",
          "x": 565,
          "y": 65
        },
        {
          "id": "slot",
          "label": "测试 getter",
          "detail": "返回 Params/Returns 槽位地址",
          "x": 115,
          "y": 255
        },
        {
          "id": "typed",
          "label": "生成的具体类型桥",
          "detail": "实际目标的参数与返回类型",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "test",
          "to": "slot",
          "label": "读测试接口"
        },
        {
          "from": "tmpl",
          "to": "typed",
          "label": "生成"
        },
        {
          "from": "slot",
          "to": "typed",
          "label": "对照理解，非运行调用"
        }
      ],
      "stages": [
        {
          "visible": [
            "test"
          ],
          "active": [
            "test"
          ],
          "moving": [],
          "note": "先认清 pkg/api/impl.go 是测试实现。",
          "broken": []
        },
        {
          "visible": [
            "test",
            "tmpl"
          ],
          "active": [
            "tmpl"
          ],
          "moving": [],
          "note": "生产 CallContext 来自 tool/instrument/impl.tmpl。",
          "broken": []
        },
        {
          "visible": [
            "test",
            "tmpl",
            "slot"
          ],
          "active": [
            "slot"
          ],
          "moving": [
            0
          ],
          "note": "测试 getter 返回槽位地址；不要当成普通值或生产模板原文。",
          "broken": []
        },
        {
          "visible": [
            "test",
            "tmpl",
            "slot",
            "typed"
          ],
          "active": [
            "tmpl",
            "typed"
          ],
          "moving": [
            1
          ],
          "note": "真正构建按目标类型生成桥；测试实现用于理解接口。",
          "broken": []
        }
      ]
    },
    "linkname": {
      "mode": "call",
      "nodes": [
        {
          "id": "n0",
          "label": "目标包里的符号",
          "detail": "pkg.OtelPrintStackImpl",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "本地别名 _printstack",
          "detail": "go:linkname 指向目标符号",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "链接器",
          "detail": "把别名解析到目标",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "运行 _printstack",
          "detail": "实际调用目标实现",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "声明别名"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "符号解析"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "运行调用"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "先有目标包里的 OtelPrintStackImpl 符号。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "用 go:linkname 声明别名与目标符号的对应关系。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "链接阶段解析这两个名字的关系。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "运行时调用本地别名，实际到目标实现。",
          "broken": []
        }
      ]
    },
    "gls": {
      "mode": "tree",
      "nodes": [
        {
          "id": "worker",
          "label": "预创建 worker",
          "detail": "服务启动时没有请求",
          "x": 115,
          "y": 65
        },
        {
          "id": "request",
          "label": "后来请求 request-42",
          "detail": "普通 WithValue 教学值",
          "x": 340,
          "y": 65
        },
        {
          "id": "wrong",
          "label": "只传 RoomID:42",
          "detail": "没有传教学标识",
          "x": 565,
          "y": 65
        },
        {
          "id": "job",
          "label": "Job{Ctx:ctx}",
          "detail": "携带 request-42",
          "x": 340,
          "y": 255
        },
        {
          "id": "read",
          "label": "worker 读取值",
          "detail": "读到 request-42，不是 Span",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "request",
          "to": "wrong",
          "label": "只放 payload"
        },
        {
          "from": "wrong",
          "to": "worker",
          "label": "没有上下文"
        },
        {
          "from": "request",
          "to": "job",
          "label": "保存 ctx"
        },
        {
          "from": "job",
          "to": "read",
          "label": "读取 job.Ctx"
        }
      ],
      "stages": [
        {
          "visible": [
            "worker"
          ],
          "active": [
            "worker"
          ],
          "moving": [],
          "note": "worker 先创建，这时还不存在当前请求。",
          "broken": []
        },
        {
          "visible": [
            "worker",
            "request"
          ],
          "active": [
            "request"
          ],
          "moving": [],
          "note": "后来请求产生教学标识 request-42；它不是 TraceID。",
          "broken": []
        },
        {
          "visible": [
            "worker",
            "request",
            "wrong"
          ],
          "active": [
            "wrong"
          ],
          "moving": [
            1
          ],
          "note": "只传 payload 时，这个教学值没有被交接给 worker。",
          "broken": [
            1
          ]
        },
        {
          "visible": [
            "worker",
            "request",
            "wrong",
            "job",
            "read"
          ],
          "active": [
            "job",
            "read"
          ],
          "moving": [
            2,
            3
          ],
          "note": "任务显式携带 ctx 才能读回教学值；真实 Span 还要另外验证。",
          "broken": []
        }
      ]
    },
    "hook-rule": {
      "mode": "call",
      "nodes": [
        {
          "id": "json",
          "label": "http rule JSON",
          "detail": "RoundTrip/*Transport",
          "x": 100,
          "y": 80
        },
        {
          "id": "enter",
          "label": "clientOnEnter",
          "detail": "req + transport",
          "x": 300,
          "y": 80
        },
        {
          "id": "request",
          "label": "HTTP request",
          "detail": "原调用",
          "x": 300,
          "y": 230
        },
        {
          "id": "exit",
          "label": "clientOnExit",
          "detail": "response + error",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "json",
          "to": "enter",
          "label": "绑定"
        },
        {
          "from": "enter",
          "to": "request",
          "label": "继续调用"
        },
        {
          "from": "request",
          "to": "exit",
          "label": "返回值"
        }
      ],
      "stages": [
        {
          "visible": [
            "json"
          ],
          "active": [
            "json"
          ],
          "moving": [],
          "note": "JSON 只描述绑定"
        },
        {
          "visible": [
            "json",
            "enter"
          ],
          "active": [
            "enter"
          ],
          "moving": [
            0
          ],
          "note": "入口拿到 CallContext、Transport、Request"
        },
        {
          "visible": [
            "json",
            "enter",
            "request"
          ],
          "active": [
            "request"
          ],
          "moving": [
            1
          ],
          "note": "原 HTTP 请求继续执行"
        },
        {
          "visible": [
            "json",
            "enter",
            "request",
            "exit"
          ],
          "active": [
            "exit"
          ],
          "moving": [
            2
          ],
          "note": "退出拿 response 和 error"
        }
      ]
    },
    "rule-json": {
      "mode": "flow",
      "nodes": [
        {
          "id": "n0",
          "label": "net/http.RoundTrip",
          "detail": "ImportPath + Function",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "*Transport",
          "detail": "ReceiverType 条件",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "Enter / Exit",
          "detail": "指定两个观察函数",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "FindFuncDecl",
          "detail": "当前 Function 按字符串相等",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "核对方法"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "绑定动作"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "对照真实实现"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "先确定 net/http 包中的 RoundTrip。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "同名方法还要核对 *Transport 接收者。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "再把进入、退出观察动作接到目标上。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "文档与固定实现有差异：Function 在此版本按字符串相等查找。",
          "broken": []
        }
      ]
    },
    "otel-runtime": {
      "mode": "tree",
      "nodes": [
        {
          "id": "n0",
          "label": "request.Context()",
          "detail": "上游 Trace aaaa…",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "tracer.Start",
          "detail": "新 HTTP Span cccc…",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "业务日志读 ctx",
          "detail": "读取同一 TraceID",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "Span End → exporter",
          "detail": "记录结束后尝试导出",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "创建子操作"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "传新 ctx"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "结束并发送"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "请求携带的是父 Span 上下文，不是最终导出记录。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "Start 返回带新 Span 的 ctx，沿用父 TraceID。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "业务日志从这个 ctx 读到同一 TraceID。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "Span 结束后进入处理器和 exporter；是否入库仍需后端证据。",
          "broken": []
        }
      ]
    },
    "version-boundary": {
      "mode": "version",
      "nodes": [
        {
          "id": "app",
          "label": "demo-service version",
          "detail": "实际模块版本",
          "x": 100,
          "y": 80
        },
        {
          "id": "rule",
          "label": "rule range",
          "detail": "允许区间",
          "x": 300,
          "y": 80
        },
        {
          "id": "hit",
          "label": "hit bundle",
          "detail": "规则生效",
          "x": 500,
          "y": 80
        },
        {
          "id": "skip",
          "label": "skip",
          "detail": "无该规则 Span",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "app",
          "to": "rule",
          "label": "比较"
        },
        {
          "from": "rule",
          "to": "hit",
          "label": "满足"
        },
        {
          "from": "rule",
          "to": "skip",
          "label": "不满足"
        }
      ],
      "stages": [
        {
          "visible": [
            "app"
          ],
          "active": [
            "app"
          ],
          "moving": [],
          "note": "读业务实际版本"
        },
        {
          "visible": [
            "app",
            "rule"
          ],
          "active": [
            "rule"
          ],
          "moving": [
            0
          ],
          "note": "读规则区间"
        },
        {
          "visible": [
            "app",
            "rule",
            "hit"
          ],
          "active": [
            "hit"
          ],
          "moving": [
            1
          ],
          "note": "满足才命中"
        },
        {
          "visible": [
            "app",
            "rule",
            "skip"
          ],
          "active": [
            "skip"
          ],
          "moving": [
            2
          ],
          "note": "超范围则跳过"
        }
      ]
    }
  },
  "zero": {
    "observe": {
      "mode": "call",
      "nodes": [
        {
          "id": "caller",
          "label": "调用者",
          "detail": "想知道 room 与耗时",
          "x": 115,
          "y": 65
        },
        {
          "id": "fn",
          "label": "FindRoom(42)",
          "detail": "原业务仍只调用一次",
          "x": 340,
          "y": 65
        },
        {
          "id": "start",
          "label": "time.Now()",
          "detail": "新增：记住开始时间",
          "x": 115,
          "y": 255
        },
        {
          "id": "end",
          "label": "Since(start) + log",
          "detail": "新增：计算并输出",
          "x": 340,
          "y": 255
        },
        {
          "id": "many",
          "label": "HTTP / DB / 消息",
          "detail": "工具把观察动作接到多个目标",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "caller",
          "to": "fn",
          "label": "原调用"
        },
        {
          "from": "caller",
          "to": "start",
          "label": "调用前"
        },
        {
          "from": "start",
          "to": "fn",
          "label": "继续原函数"
        },
        {
          "from": "fn",
          "to": "end",
          "label": "返回后"
        },
        {
          "from": "many",
          "to": "start",
          "label": "自动接入进入动作"
        },
        {
          "from": "many",
          "to": "end",
          "label": "自动接入退出动作"
        }
      ],
      "stages": [
        {
          "visible": [
            "caller",
            "fn"
          ],
          "active": [
            "fn"
          ],
          "moving": [
            0
          ],
          "note": "最初只能得到房间名，没有耗时记录。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start"
          ],
          "active": [
            "start",
            "fn"
          ],
          "moving": [
            1,
            2
          ],
          "note": "调用前用 time.Now 记下开始时间，然后只执行一次原函数。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start",
            "end"
          ],
          "active": [
            "end"
          ],
          "moving": [
            3
          ],
          "note": "函数返回后计算 time.Since(start)，输出结果与耗时。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start",
            "end",
            "many"
          ],
          "active": [
            "many",
            "start",
            "end"
          ],
          "moving": [
            4,
            5
          ],
          "note": "工具要把类似前后观察动作，接到很多目标函数。"
        }
      ]
    },
    "packages": {
      "mode": "modules",
      "nodes": [
        {
          "id": "module",
          "label": "go.mod",
          "detail": "路径前缀 → demo/",
          "x": 100,
          "y": 80
        },
        {
          "id": "main",
          "label": "main.go",
          "detail": "package main",
          "x": 300,
          "y": 80
        },
        {
          "id": "room",
          "label": "room/find.go",
          "detail": "package room",
          "x": 300,
          "y": 220
        },
        {
          "id": "call",
          "label": "room.Find(42)",
          "detail": "房间名",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "module",
          "to": "room",
          "label": "定位 room/"
        },
        {
          "from": "main",
          "to": "room",
          "label": "import"
        },
        {
          "from": "room",
          "to": "call",
          "label": "调用"
        }
      ],
      "stages": [
        {
          "visible": [
            "main",
            "room"
          ],
          "active": [
            "main",
            "room"
          ],
          "moving": [],
          "note": "磁盘上有 main.go 和 room/find.go；先分清真实位置与 import 路径。"
        },
        {
          "visible": [
            "main",
            "room"
          ],
          "active": [
            "room"
          ],
          "moving": [],
          "note": "package room 给代码分组，还没有说明 example.com/demo 这个前缀对应哪里。"
        },
        {
          "visible": [
            "module",
            "main",
            "room"
          ],
          "active": [
            "module",
            "room"
          ],
          "moving": [
            0
          ],
          "note": "example.com/demo 对应 demo/；加上 /room，就找到 demo/room/。"
        },
        {
          "visible": [
            "module",
            "main",
            "room",
            "call"
          ],
          "active": [
            "call"
          ],
          "moving": [
            1,
            2
          ],
          "note": "main 的 import 找到本地 room 包，调用 Find(42)，输出“语聊房间”。"
        }
      ]
    },
    "gomod": {
      "mode": "modules",
      "nodes": [
        {
          "id": "project",
          "label": "demo/go.mod",
          "detail": "当前项目的一份文件",
          "x": 120,
          "y": 75
        },
        {
          "id": "identity",
          "label": "module demo",
          "detail": "我是谁（路径简写）",
          "x": 350,
          "y": 75
        },
        {
          "id": "require",
          "label": "require observer",
          "detail": "我需要谁（路径简写）",
          "x": 350,
          "y": 250
        },
        {
          "id": "code",
          "label": "main.go",
          "detail": "实际 import / 调用",
          "x": 560,
          "y": 250
        }
      ],
      "edges": [
        {
          "from": "project",
          "to": "identity",
          "label": "声明自己"
        },
        {
          "from": "code",
          "to": "require",
          "label": "需要外部库"
        },
        {
          "from": "project",
          "to": "require",
          "label": "同一份文件"
        }
      ],
      "stages": [
        {
          "visible": [
            "project",
            "identity"
          ],
          "active": [
            "identity"
          ],
          "moving": [
            0
          ],
          "note": "module 声明的是当前 demo 模块的身份。"
        },
        {
          "visible": [
            "project",
            "identity",
            "code"
          ],
          "active": [
            "code"
          ],
          "moving": [],
          "note": "源码要使用另一份 observer 代码；这才形成依赖关系。"
        },
        {
          "visible": [
            "project",
            "identity",
            "require",
            "code"
          ],
          "active": [
            "require"
          ],
          "moving": [
            1,
            2
          ],
          "note": "require 把外部依赖写进原来的 go.mod。"
        },
        {
          "visible": [
            "project",
            "identity",
            "require",
            "code"
          ],
          "active": [
            "project",
            "code"
          ],
          "moving": [],
          "note": "依赖清单不是函数调用；运行时才会执行 Record。"
        }
      ]
    },
    "build": {
      "mode": "build",
      "nodes": [
        {
          "id": "n0",
          "label": "main.go",
          "detail": "FindRoom 源码",
          "x": 115,
          "y": 65
        },
        {
          "id": "n1",
          "label": "go build",
          "detail": "普通构建先作对照",
          "x": 340,
          "y": 65
        },
        {
          "id": "n2",
          "label": "otel go build",
          "detail": "准备依赖并加工编译输入",
          "x": 340,
          "y": 255
        },
        {
          "id": "n3",
          "label": "启动业务产物",
          "detail": "请求到来才运行观察动作",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "n0",
          "to": "n1",
          "label": "普通构建"
        },
        {
          "from": "n1",
          "to": "n2",
          "label": "插桩构建对照"
        },
        {
          "from": "n2",
          "to": "n3",
          "label": "运行请求"
        }
      ],
      "stages": [
        {
          "visible": [
            "n0"
          ],
          "active": [
            "n0"
          ],
          "moving": [],
          "note": "源码先是文件中的文字。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1"
          ],
          "active": [
            "n1"
          ],
          "moving": [
            0
          ],
          "note": "普通 go build 生成原来的业务程序。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2"
          ],
          "active": [
            "n2"
          ],
          "moving": [
            1
          ],
          "note": "插桩构建在编译前加入观察代码。",
          "broken": []
        },
        {
          "visible": [
            "n0",
            "n1",
            "n2",
            "n3"
          ],
          "active": [
            "n3"
          ],
          "moving": [
            2
          ],
          "note": "启动插桩后的程序，请求才触发观察动作。",
          "broken": []
        }
      ]
    },
    "hooks": {
      "mode": "call",
      "nodes": [
        {
          "id": "rule",
          "label": "rule: FindRoom",
          "detail": "找谁",
          "x": 100,
          "y": 80
        },
        {
          "id": "enter",
          "label": "before",
          "detail": "进入 hook",
          "x": 300,
          "y": 80
        },
        {
          "id": "fn",
          "label": "FindRoom(42)",
          "detail": "原函数",
          "x": 300,
          "y": 220
        },
        {
          "id": "exit",
          "label": "after",
          "detail": "退出 hook",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "rule",
          "to": "enter",
          "label": "绑定"
        },
        {
          "from": "enter",
          "to": "fn",
          "label": "前置"
        },
        {
          "from": "fn",
          "to": "exit",
          "label": "后置"
        }
      ],
      "stages": [
        {
          "visible": [
            "rule"
          ],
          "active": [
            "rule"
          ],
          "moving": [],
          "note": "规则找位置"
        },
        {
          "visible": [
            "rule",
            "enter"
          ],
          "active": [
            "enter"
          ],
          "moving": [
            0
          ],
          "note": "进入动作"
        },
        {
          "visible": [
            "rule",
            "enter",
            "fn"
          ],
          "active": [
            "fn"
          ],
          "moving": [
            1
          ],
          "note": "原函数执行"
        },
        {
          "visible": [
            "rule",
            "enter",
            "fn",
            "exit"
          ],
          "active": [
            "exit"
          ],
          "moving": [
            2
          ],
          "note": "退出动作"
        }
      ]
    },
    "deps": {
      "mode": "dependency",
      "nodes": [
        {
          "id": "business",
          "label": "FindRoom",
          "detail": "业务代码",
          "x": 150,
          "y": 90
        },
        {
          "id": "observer",
          "label": "observer.Record",
          "detail": "外部记录代码",
          "x": 520,
          "y": 90
        },
        {
          "id": "config",
          "label": "业务 go.mod",
          "detail": "原来的一份清单",
          "x": 340,
          "y": 240
        }
      ],
      "edges": [
        {
          "from": "business",
          "to": "observer",
          "label": "FindRoom 新增调用需要它"
        },
        {
          "from": "config",
          "to": "observer",
          "label": "定位依赖"
        }
      ],
      "stages": [
        {
          "visible": [
            "business"
          ],
          "active": [
            "business"
          ],
          "moving": [],
          "note": "原来只需要业务代码，输出房间名。"
        },
        {
          "visible": [
            "business",
            "observer"
          ],
          "active": [
            "business"
          ],
          "moving": [
            0
          ],
          "broken": [
            0
          ],
          "note": "新调用已经写下，业务清单还没登记外部代码。"
        },
        {
          "visible": [
            "business",
            "observer"
          ],
          "active": [
            "business"
          ],
          "moving": [
            0
          ],
          "broken": [
            0
          ],
          "note": "构建报错：没有声明提供 observer 包的依赖。"
        },
        {
          "visible": [
            "business",
            "observer",
            "config"
          ],
          "active": [
            "config"
          ],
          "moving": [
            1
          ],
          "note": "补充原有 go.mod 后，Go 能找到 observer 的实现并完成构建。"
        },
        {
          "visible": [
            "business",
            "observer",
            "config"
          ],
          "active": [
            "business",
            "observer"
          ],
          "moving": [
            0
          ],
          "note": "运行新程序，先写观察记录，再返回原房间名。"
        }
      ]
    },
    "trace": {
      "mode": "tree",
      "nodes": [
        {
          "id": "up",
          "label": "请求链 A",
          "detail": "同一次查房请求",
          "x": 115,
          "y": 65
        },
        {
          "id": "server",
          "label": "01 服务入口",
          "detail": "Trace=A",
          "x": 340,
          "y": 65
        },
        {
          "id": "fn",
          "label": "02 FindRoom",
          "detail": "Trace=A Parent=01",
          "x": 340,
          "y": 255
        },
        {
          "id": "db",
          "label": "03 数据库查询",
          "detail": "Trace=A Parent=02",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "up",
          "to": "server",
          "label": "第一张记录"
        },
        {
          "from": "server",
          "to": "fn",
          "label": "01 调用 02"
        },
        {
          "from": "fn",
          "to": "db",
          "label": "02 调用 03"
        }
      ],
      "stages": [
        {
          "visible": [
            "up"
          ],
          "active": [
            "up"
          ],
          "moving": [],
          "note": "请求链 A：先确定哪些记录属于同一次查房请求。"
        },
        {
          "visible": [
            "up",
            "server"
          ],
          "active": [
            "server"
          ],
          "moving": [
            0
          ],
          "note": "入口操作：Trace=A，Span=01。"
        },
        {
          "visible": [
            "up",
            "server",
            "fn"
          ],
          "active": [
            "fn"
          ],
          "moving": [
            1
          ],
          "note": "查房间操作：Trace=A，Span=02，Parent=01。"
        },
        {
          "visible": [
            "up",
            "server",
            "fn",
            "db"
          ],
          "active": [
            "db"
          ],
          "moving": [
            2
          ],
          "note": "数据库操作：Trace=A，Span=03，Parent=02；按父操作连成树。"
        }
      ]
    }
  },
  "chapter": {
    "orientation": {
      "mode": "call",
      "nodes": [
        {
          "id": "caller",
          "label": "调用者",
          "detail": "想知道 room 与耗时",
          "x": 115,
          "y": 65
        },
        {
          "id": "fn",
          "label": "FindRoom(42)",
          "detail": "原业务仍只调用一次",
          "x": 340,
          "y": 65
        },
        {
          "id": "start",
          "label": "time.Now()",
          "detail": "新增：记住开始时间",
          "x": 115,
          "y": 255
        },
        {
          "id": "end",
          "label": "Since(start) + log",
          "detail": "新增：计算并输出",
          "x": 340,
          "y": 255
        },
        {
          "id": "many",
          "label": "HTTP / DB / 消息",
          "detail": "工具把观察动作接到多个目标",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "caller",
          "to": "fn",
          "label": "原调用"
        },
        {
          "from": "caller",
          "to": "start",
          "label": "调用前"
        },
        {
          "from": "start",
          "to": "fn",
          "label": "继续原函数"
        },
        {
          "from": "fn",
          "to": "end",
          "label": "返回后"
        },
        {
          "from": "many",
          "to": "start",
          "label": "自动接入进入动作"
        },
        {
          "from": "many",
          "to": "end",
          "label": "自动接入退出动作"
        }
      ],
      "stages": [
        {
          "visible": [
            "caller",
            "fn"
          ],
          "active": [
            "fn"
          ],
          "moving": [
            0
          ],
          "note": "最初只能得到房间名，没有耗时记录。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start"
          ],
          "active": [
            "start",
            "fn"
          ],
          "moving": [
            1,
            2
          ],
          "note": "调用前用 time.Now 记下开始时间，然后只执行一次原函数。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start",
            "end"
          ],
          "active": [
            "end"
          ],
          "moving": [
            3
          ],
          "note": "函数返回后计算 time.Since(start)，输出结果与耗时。"
        },
        {
          "visible": [
            "caller",
            "fn",
            "start",
            "end",
            "many"
          ],
          "active": [
            "many",
            "start",
            "end"
          ],
          "moving": [
            4,
            5
          ],
          "note": "工具要把类似前后观察动作，接到很多目标函数。"
        }
      ]
    },
    "go-foundations": {
      "mode": "flow",
      "nodes": [
        {
          "id": "httpctx",
          "label": "r.Context()",
          "detail": "请求 ctx",
          "x": 100,
          "y": 80
        },
        {
          "id": "find",
          "label": "FindRoom(ctx,42)",
          "detail": "显式参数",
          "x": 300,
          "y": 80
        },
        {
          "id": "query",
          "label": "query(ctx)",
          "detail": "继续传递",
          "x": 500,
          "y": 80
        },
        {
          "id": "cancel",
          "label": "取消/截止",
          "detail": "ctx 生效",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "httpctx",
          "to": "find",
          "label": "参数"
        },
        {
          "from": "find",
          "to": "query",
          "label": "继续"
        },
        {
          "from": "query",
          "to": "cancel",
          "label": "响应"
        }
      ],
      "stages": [
        {
          "visible": [
            "httpctx"
          ],
          "active": [
            "httpctx"
          ],
          "moving": [],
          "note": "HTTP 入口拿到 ctx"
        },
        {
          "visible": [
            "httpctx",
            "find"
          ],
          "active": [
            "find"
          ],
          "moving": [
            0
          ],
          "note": "显式传入 FindRoom"
        },
        {
          "visible": [
            "httpctx",
            "find",
            "query"
          ],
          "active": [
            "query"
          ],
          "moving": [
            1
          ],
          "note": "下层继续传"
        },
        {
          "visible": [
            "httpctx",
            "find",
            "query",
            "cancel"
          ],
          "active": [
            "cancel"
          ],
          "moving": [
            2
          ],
          "note": "取消信号到达"
        }
      ]
    },
    "build": {
      "mode": "build",
      "nodes": [
        {
          "id": "cmd",
          "label": "go build",
          "detail": "命令",
          "x": 100,
          "y": 80
        },
        {
          "id": "wrapper",
          "label": "toolexec",
          "detail": "包装 compiler",
          "x": 300,
          "y": 80
        },
        {
          "id": "compiler",
          "label": "compiler",
          "detail": "编译源码",
          "x": 500,
          "y": 80
        },
        {
          "id": "binary",
          "label": "demo-service binary",
          "detail": "产物",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "cmd",
          "to": "wrapper",
          "label": "调用"
        },
        {
          "from": "wrapper",
          "to": "compiler",
          "label": "转发"
        },
        {
          "from": "compiler",
          "to": "binary",
          "label": "链接"
        }
      ],
      "stages": [
        {
          "visible": [
            "cmd"
          ],
          "active": [
            "cmd"
          ],
          "moving": [],
          "note": "普通构建"
        },
        {
          "visible": [
            "cmd",
            "wrapper"
          ],
          "active": [
            "wrapper"
          ],
          "moving": [
            0
          ],
          "note": "包装器接管"
        },
        {
          "visible": [
            "cmd",
            "wrapper",
            "compiler"
          ],
          "active": [
            "compiler"
          ],
          "moving": [
            1
          ],
          "note": "compiler 收到参数"
        },
        {
          "visible": [
            "cmd",
            "wrapper",
            "compiler",
            "binary"
          ],
          "active": [
            "binary"
          ],
          "moving": [
            2
          ],
          "note": "生成程序"
        }
      ]
    },
    "ast": {
      "mode": "tree",
      "nodes": [
        {
          "id": "file",
          "label": "dst.File",
          "detail": "源码树",
          "x": 100,
          "y": 80
        },
        {
          "id": "decl",
          "label": "RoundTrip FuncDecl",
          "detail": "声明",
          "x": 300,
          "y": 80
        },
        {
          "id": "recv",
          "label": "*Transport",
          "detail": "receiver",
          "x": 300,
          "y": 220
        },
        {
          "id": "body",
          "label": "改写 Body",
          "detail": "插入 hook",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "file",
          "to": "decl",
          "label": "遍历"
        },
        {
          "from": "decl",
          "to": "recv",
          "label": "匹配"
        },
        {
          "from": "decl",
          "to": "body",
          "label": "修改"
        }
      ],
      "stages": [
        {
          "visible": [
            "file"
          ],
          "active": [
            "file"
          ],
          "moving": [],
          "note": "源码变成树"
        },
        {
          "visible": [
            "file",
            "decl"
          ],
          "active": [
            "decl"
          ],
          "moving": [
            0
          ],
          "note": "找到声明"
        },
        {
          "visible": [
            "file",
            "decl",
            "recv"
          ],
          "active": [
            "recv"
          ],
          "moving": [
            1
          ],
          "note": "核对 receiver"
        },
        {
          "visible": [
            "file",
            "decl",
            "recv",
            "body"
          ],
          "active": [
            "body"
          ],
          "moving": [
            2
          ],
          "note": "插入 hook"
        }
      ]
    },
    "otel": {
      "mode": "tree",
      "nodes": [
        {
          "id": "ctx",
          "label": "request.ctx",
          "detail": "server Span",
          "x": 100,
          "y": 80
        },
        {
          "id": "start",
          "label": "tracer.Start",
          "detail": "API",
          "x": 300,
          "y": 80
        },
        {
          "id": "span",
          "label": "FindRoom Span",
          "detail": "child",
          "x": 500,
          "y": 80
        },
        {
          "id": "export",
          "label": "exporter",
          "detail": "OTLP 后端",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "ctx",
          "to": "start",
          "label": "读取"
        },
        {
          "from": "start",
          "to": "span",
          "label": "创建"
        },
        {
          "from": "span",
          "to": "export",
          "label": "End"
        }
      ],
      "stages": [
        {
          "visible": [
            "ctx"
          ],
          "active": [
            "ctx"
          ],
          "moving": [],
          "note": "父上下文"
        },
        {
          "visible": [
            "ctx",
            "start"
          ],
          "active": [
            "start"
          ],
          "moving": [
            0
          ],
          "note": "API Start"
        },
        {
          "visible": [
            "ctx",
            "start",
            "span"
          ],
          "active": [
            "span"
          ],
          "moving": [
            1
          ],
          "note": "child Span"
        },
        {
          "visible": [
            "ctx",
            "start",
            "span",
            "export"
          ],
          "active": [
            "export"
          ],
          "moving": [
            2
          ],
          "note": "导出"
        }
      ]
    },
    "context": {
      "mode": "tree",
      "nodes": [
        {
          "id": "req",
          "label": "请求 ctx",
          "detail": "已有父 Span",
          "x": 115,
          "y": 65
        },
        {
          "id": "job",
          "label": "VoiceTask{Ctx:ctx}",
          "detail": "同进程任务交接",
          "x": 340,
          "y": 65
        },
        {
          "id": "worker",
          "label": "预创建 worker",
          "detail": "使用 task.Ctx",
          "x": 565,
          "y": 65
        },
        {
          "id": "props",
          "label": "消息 Properties",
          "detail": "traceparent / b3 字符串",
          "x": 340,
          "y": 255
        },
        {
          "id": "consumer",
          "label": "另一个进程",
          "detail": "Extract 后创建消费 Span",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "req",
          "to": "job",
          "label": "保存 ctx"
        },
        {
          "from": "job",
          "to": "worker",
          "label": "任务交接"
        },
        {
          "from": "req",
          "to": "props",
          "label": "Inject"
        },
        {
          "from": "props",
          "to": "consumer",
          "label": "Extract"
        }
      ],
      "stages": [
        {
          "visible": [
            "req"
          ],
          "active": [
            "req"
          ],
          "moving": [],
          "note": "worker 早于请求创建，任务原来没有上下文。",
          "broken": []
        },
        {
          "visible": [
            "req",
            "job",
            "worker"
          ],
          "active": [
            "job",
            "worker"
          ],
          "moving": [
            0,
            1
          ],
          "note": "同进程把 ctx 放进 VoiceTask，worker 使用 task.Ctx。",
          "broken": []
        },
        {
          "visible": [
            "req",
            "job",
            "worker",
            "props",
            "consumer"
          ],
          "active": [
            "props",
            "consumer"
          ],
          "moving": [
            2,
            3
          ],
          "note": "跨进程传字符串载体，不传 Go context 对象。",
          "broken": []
        },
        {
          "visible": [
            "req",
            "job",
            "worker",
            "props",
            "consumer"
          ],
          "active": [
            "worker",
            "consumer"
          ],
          "moving": [
            1,
            3
          ],
          "note": "对照普通 SDK / 无可继承 GLS 的路径，核对直接 ParentSpanID。",
          "broken": []
        }
      ]
    },
    "architecture": {
      "mode": "flow",
      "nodes": [
        {
          "id": "cli",
          "label": "CLI",
          "detail": "otel go build",
          "x": 100,
          "y": 80
        },
        {
          "id": "pre",
          "label": "Preprocess",
          "detail": "依赖/规则",
          "x": 300,
          "y": 80
        },
        {
          "id": "instrument",
          "label": "Instrument",
          "detail": "AST/DST",
          "x": 500,
          "y": 80
        },
        {
          "id": "run",
          "label": "运行时",
          "detail": "hook + OTel",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "cli",
          "to": "pre",
          "label": "参数"
        },
        {
          "from": "pre",
          "to": "instrument",
          "label": "bundles"
        },
        {
          "from": "instrument",
          "to": "run",
          "label": "二进制"
        }
      ],
      "stages": [
        {
          "visible": [
            "cli"
          ],
          "active": [
            "cli"
          ],
          "moving": [],
          "note": "命令入口"
        },
        {
          "visible": [
            "cli",
            "pre"
          ],
          "active": [
            "pre"
          ],
          "moving": [
            0
          ],
          "note": "编译前准备"
        },
        {
          "visible": [
            "cli",
            "pre",
            "instrument"
          ],
          "active": [
            "instrument"
          ],
          "moving": [
            1
          ],
          "note": "改写输入"
        },
        {
          "visible": [
            "cli",
            "pre",
            "instrument",
            "run"
          ],
          "active": [
            "run"
          ],
          "moving": [
            2
          ],
          "note": "运行记录"
        }
      ]
    },
    "rules": {
      "mode": "version",
      "nodes": [
        {
          "id": "dep",
          "label": "gorm v1.25.12",
          "detail": "业务版本",
          "x": 100,
          "y": 80
        },
        {
          "id": "range",
          "label": "[1.22.0,1.25.10)",
          "detail": "规则范围",
          "x": 300,
          "y": 80
        },
        {
          "id": "compare",
          "label": "上界比较",
          "detail": "超出",
          "x": 500,
          "y": 80
        },
        {
          "id": "skip",
          "label": "skip gorm",
          "detail": "无 bundle",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "dep",
          "to": "range",
          "label": "输入"
        },
        {
          "from": "range",
          "to": "compare",
          "label": "比较"
        },
        {
          "from": "compare",
          "to": "skip",
          "label": "不满足"
        }
      ],
      "stages": [
        {
          "visible": [
            "dep"
          ],
          "active": [
            "dep"
          ],
          "moving": [],
          "note": "实际版本"
        },
        {
          "visible": [
            "dep",
            "range"
          ],
          "active": [
            "range"
          ],
          "moving": [
            0
          ],
          "note": "规则范围"
        },
        {
          "visible": [
            "dep",
            "range",
            "compare"
          ],
          "active": [
            "compare"
          ],
          "moving": [
            1
          ],
          "note": "比较上界"
        },
        {
          "visible": [
            "dep",
            "range",
            "compare",
            "skip"
          ],
          "active": [
            "skip"
          ],
          "moving": [
            2
          ],
          "note": "规则跳过"
        }
      ]
    },
    "hooks": {
      "mode": "call",
      "nodes": [
        {
          "id": "rule",
          "label": "RoundTrip rule",
          "detail": "*Transport",
          "x": 100,
          "y": 80
        },
        {
          "id": "enter",
          "label": "clientOnEnter",
          "detail": "req + transport",
          "x": 300,
          "y": 80
        },
        {
          "id": "call",
          "label": "RoundTrip(req)",
          "detail": "原调用",
          "x": 300,
          "y": 220
        },
        {
          "id": "exit",
          "label": "clientOnExit",
          "detail": "response + error",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "rule",
          "to": "enter",
          "label": "绑定"
        },
        {
          "from": "enter",
          "to": "call",
          "label": "调用"
        },
        {
          "from": "call",
          "to": "exit",
          "label": "返回"
        }
      ],
      "stages": [
        {
          "visible": [
            "rule"
          ],
          "active": [
            "rule"
          ],
          "moving": [],
          "note": "规则契约"
        },
        {
          "visible": [
            "rule",
            "enter"
          ],
          "active": [
            "enter"
          ],
          "moving": [
            0
          ],
          "note": "进入 hook"
        },
        {
          "visible": [
            "rule",
            "enter",
            "call"
          ],
          "active": [
            "call"
          ],
          "moving": [
            1
          ],
          "note": "原调用"
        },
        {
          "visible": [
            "rule",
            "enter",
            "call",
            "exit"
          ],
          "active": [
            "exit"
          ],
          "moving": [
            2
          ],
          "note": "退出 hook"
        }
      ]
    },
    "runtime": {
      "mode": "tree",
      "nodes": [
        {
          "id": "worker",
          "label": "预创建 worker",
          "detail": "先于当前请求存在",
          "x": 115,
          "y": 65
        },
        {
          "id": "req",
          "label": "后来请求的 server",
          "detail": "带 Span 的 ctx",
          "x": 340,
          "y": 65
        },
        {
          "id": "job",
          "label": "Job{Ctx:ctx}",
          "detail": "提交时交接",
          "x": 565,
          "y": 65
        },
        {
          "id": "bg",
          "label": "Background()",
          "detail": "没有显式父 Span",
          "x": 340,
          "y": 255
        },
        {
          "id": "child",
          "label": "任务的 child Span",
          "detail": "核对 ParentSpanID",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "req",
          "to": "job",
          "label": "明确保存 ctx"
        },
        {
          "from": "job",
          "to": "child",
          "label": "显式父级"
        },
        {
          "from": "bg",
          "to": "child",
          "label": "无可继承 GLS 时新根"
        }
      ],
      "stages": [
        {
          "visible": [
            "worker",
            "req"
          ],
          "active": [
            "worker",
            "req"
          ],
          "moving": [],
          "note": "worker 创建时没有后来请求；不能靠创建时继承当前任务。",
          "broken": []
        },
        {
          "visible": [
            "worker",
            "req",
            "job"
          ],
          "active": [
            "job"
          ],
          "moving": [
            0
          ],
          "note": "提交每个任务时，把它所属请求的 ctx 放进去。",
          "broken": []
        },
        {
          "visible": [
            "worker",
            "req",
            "job",
            "bg",
            "child"
          ],
          "active": [
            "bg",
            "child"
          ],
          "moving": [
            2
          ],
          "note": "Background 不含显式父 Span；这里假设 worker 没有可继承 GLS。",
          "broken": [
            2
          ]
        },
        {
          "visible": [
            "worker",
            "req",
            "job",
            "bg",
            "child"
          ],
          "active": [
            "child"
          ],
          "moving": [
            1
          ],
          "note": "用导出 Span 的 ParentSpanID 证明任务接到了正确请求。",
          "broken": []
        }
      ]
    },
    "compatibility": {
      "mode": "dedup",
      "nodes": [
        {
          "id": "server",
          "label": "server 父 Span",
          "detail": "合法父节点要保留",
          "x": 115,
          "y": 65
        },
        {
          "id": "manual",
          "label": "已有 otelhttp client",
          "detail": "同一次 HTTP 操作",
          "x": 340,
          "y": 65
        },
        {
          "id": "downstream",
          "label": "下游请求",
          "detail": "parent = client SpanID",
          "x": 565,
          "y": 65
        },
        {
          "id": "check",
          "label": "确认同一 client 操作",
          "detail": "IsValid 本身不足以判断",
          "x": 340,
          "y": 255
        },
        {
          "id": "duplicate",
          "label": "重复的 auto client",
          "detail": "应跳过的同层记录",
          "x": 565,
          "y": 255
        }
      ],
      "edges": [
        {
          "from": "server",
          "to": "manual",
          "label": "合法子 Span"
        },
        {
          "from": "manual",
          "to": "check",
          "label": "检查作用域 / 标记"
        },
        {
          "from": "check",
          "to": "duplicate",
          "label": "重复创建？"
        },
        {
          "from": "manual",
          "to": "downstream",
          "label": "传播正确 client ctx"
        }
      ],
      "stages": [
        {
          "visible": [
            "server",
            "manual"
          ],
          "active": [
            "manual"
          ],
          "moving": [
            0
          ],
          "note": "这次 HTTP 调用已经由 otelhttp 创建了 client Span。",
          "broken": []
        },
        {
          "visible": [
            "server",
            "manual",
            "check"
          ],
          "active": [
            "check"
          ],
          "moving": [
            1
          ],
          "note": "必须确认是同一次 HTTP client 操作；有效 server Span 不能被当成重复入口。",
          "broken": []
        },
        {
          "visible": [
            "server",
            "manual",
            "check"
          ],
          "active": [
            "manual"
          ],
          "moving": [
            2
          ],
          "note": "保留已有 client，跳过同一操作的重复创建；传播仍由正确责任方完成。",
          "broken": [],
          "skipped": [
            2
          ]
        },
        {
          "visible": [
            "server",
            "manual",
            "check",
            "downstream"
          ],
          "active": [
            "manual",
            "downstream"
          ],
          "moving": [
            3
          ],
          "note": "验证恰好一个 client Span、直接 parent、传播头与业务结果。",
          "broken": []
        }
      ]
    },
    "debugging": {
      "mode": "flow",
      "nodes": [
        {
          "id": "build",
          "label": "build log",
          "detail": "rule hit",
          "x": 100,
          "y": 80
        },
        {
          "id": "run",
          "label": "runtime hook",
          "detail": "enter/exit",
          "x": 300,
          "y": 80
        },
        {
          "id": "export",
          "label": "OTLP export",
          "detail": "accepted?",
          "x": 500,
          "y": 80
        },
        {
          "id": "query",
          "label": "Victoria query",
          "detail": "ID + time range",
          "x": 500,
          "y": 230
        }
      ],
      "edges": [
        {
          "from": "build",
          "to": "run",
          "label": "产物"
        },
        {
          "from": "run",
          "to": "export",
          "label": "span.End"
        },
        {
          "from": "export",
          "to": "query",
          "label": "查询"
        }
      ],
      "stages": [
        {
          "visible": [
            "build"
          ],
          "active": [
            "build"
          ],
          "moving": [],
          "note": "构建命中"
        },
        {
          "visible": [
            "build",
            "run"
          ],
          "active": [
            "run"
          ],
          "moving": [
            0
          ],
          "note": "请求经过 hook"
        },
        {
          "visible": [
            "build",
            "run",
            "export"
          ],
          "active": [
            "export"
          ],
          "moving": [
            1
          ],
          "note": "检查 exporter"
        },
        {
          "visible": [
            "build",
            "run",
            "export",
            "query"
          ],
          "active": [
            "query"
          ],
          "moving": [
            2
          ],
          "note": "核对 ID、服务和范围"
        }
      ]
    },
    "capstone": {
      "mode": "dedup",
      "nodes": [
        {
          "id": "inventory",
          "label": "existing otelgorm",
          "detail": "已有入口",
          "x": 100,
          "y": 80
        },
        {
          "id": "version",
          "label": "gorm v1.25.12",
          "detail": "先核范围",
          "x": 300,
          "y": 80
        },
        {
          "id": "rule",
          "label": "safe rule",
          "detail": "兼容旧入口",
          "x": 300,
          "y": 220
        },
        {
          "id": "evidence",
          "label": "验收证据",
          "detail": "one span + parent",
          "x": 560,
          "y": 150
        }
      ],
      "edges": [
        {
          "from": "inventory",
          "to": "version",
          "label": "盘点"
        },
        {
          "from": "version",
          "to": "rule",
          "label": "评估"
        },
        {
          "from": "rule",
          "to": "evidence",
          "label": "测试"
        },
        {
          "from": "inventory",
          "to": "evidence",
          "label": "去重"
        }
      ],
      "stages": [
        {
          "visible": [
            "inventory"
          ],
          "active": [
            "inventory"
          ],
          "moving": [],
          "note": "盘点已有埋点"
        },
        {
          "visible": [
            "inventory",
            "version"
          ],
          "active": [
            "version"
          ],
          "moving": [
            0
          ],
          "note": "核对实际版本"
        },
        {
          "visible": [
            "inventory",
            "version",
            "rule"
          ],
          "active": [
            "rule"
          ],
          "moving": [
            1
          ],
          "note": "设计兼容规则"
        },
        {
          "visible": [
            "inventory",
            "version",
            "rule",
            "evidence"
          ],
          "active": [
            "evidence"
          ],
          "moving": [
            2,
            3
          ],
          "note": "验证数量、parent、回滚"
        }
      ]
    }
  }
};
