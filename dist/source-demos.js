// 逐帧教学模拟；不是浏览器执行 Go 的输出。
export const sourceDemos = {
  "go-mod": {
    "title": "让一个小项目找到它需要的代码",
    "scenario": "业务项目 example.com/live 有 go.mod；插桩工具要额外使用 hook 包。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "项目地址",
      "依赖清单",
      "解析结果"
    ],
    "terms": [
      {
        "term": "module",
        "meaning": "项目的模块地址，像邮寄地址，外部包用它找到项目。"
      },
      {
        "term": "require",
        "meaning": "告诉 Go：这个项目需要某个模块及其版本。"
      },
      {
        "term": "replace",
        "meaning": "告诉 Go：这个地址暂时改从另一个本地目录读取。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "先只有业务代码，再把本地规则模块接入 go.mod，最后 Go 才能解析生成的 import。",
        "frames": [
          {
            "title": "1. 只有业务模块",
            "explain": "Go 先读取项目地址。",
            "why": "没有 module，依赖路径无法确定。",
            "focus": 0,
            "code": {
              "label": "go.mod（教学片段）",
              "language": "text",
              "text": "module example.com/live\n\ngo 1.25.0",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "文件",
                "items": [
                  {
                    "text": "go.mod",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "Go 的理解",
                "items": [
                  {
                    "text": "项目地址 = example.com/live",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "项目有了可被引用的地址。"
          },
          {
            "title": "2. 规则生成 import",
            "explain": "工具准备一个空白导入文件，想使用 HTTP hook。",
            "why": "生成代码出现得很早，依赖也必须提前可解析。",
            "focus": 1,
            "code": {
              "label": "otel.runtime.go（教学片段）",
              "language": "go",
              "text": "package main\nimport _ \"github.com/alibaba/loongsuite-go/pkg/rules/http\"",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "新增",
                "items": [
                  {
                    "text": "pkg/rules/http",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "当前问题",
                "items": [
                  {
                    "text": "go.mod 还不知道它",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "只写 import 还不够，编译器会找不到模块。"
          },
          {
            "title": "3. 加 require 与 replace",
            "explain": "工具把规则模块加入依赖，并把它指向本地工具目录。",
            "why": "http 规则模块自己有 go.mod，不能只替换它路径的上级 pkg；上层 replace 不会自动替换嵌套模块。",
            "focus": 1,
            "code": {
              "label": "go.mod 变化（教学片段）",
              "language": "text",
              "text": "require github.com/alibaba/loongsuite-go/pkg/rules/http v0.0.0-00010101000000-000000000000\nreplace github.com/alibaba/loongsuite-go/pkg/rules/http => ../loongsuite/pkg/rules/http\nreplace github.com/alibaba/loongsuite-go/pkg => ../loongsuite/pkg",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "require",
                "items": [
                  {
                    "text": "规则模块 = 已登记",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "replace",
                "items": [
                  {
                    "text": "http 规则模块与 pkg 基础模块分别指向本地",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "模块地址和本地位置都能解析。"
          },
          {
            "title": "4. Go 重新计算依赖",
            "explain": "go mod tidy 刷新依赖图，之后编译器才能读到规则代码。",
            "why": "依赖图稳定后再插桩，避免半途缺包。",
            "focus": 2,
            "code": {
              "label": "模拟输出",
              "language": "text",
              "text": "go: found github.com/alibaba/loongsuite-go/pkg/rules/http\nbuild: dependency graph ready",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "依赖图",
                "items": [
                  {
                    "text": "example.com/live",
                    "state": "ok"
                  },
                  {
                    "text": "pkg/rules/http",
                    "state": "ok"
                  }
                ]
              },
              {
                "label": "下一步",
                "items": [
                  {
                    "text": "进入规则匹配",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "go build 现在能看到工具导入。"
          }
        ],
        "verdict": "go.mod 不是“配置装饰”，它决定生成代码能不能被编译器找到。"
      }
    ],
    "question": {
      "prompt": "为什么规则代码已经在工具目录里，业务项目还要写 require/replace？",
      "options": [
        "因为编译器按业务项目的模块图找 import",
        "因为 replace 会自动改写所有业务代码",
        "因为 require 会启动 goroutine"
      ],
      "answer": 0,
      "explanation": "生成的 import 属于业务这次构建，必须进入业务项目的模块解析范围。"
    }
  },
  "cli": {
    "title": "命令入口怎样把参数交给下一站",
    "scenario": "用户输入 otel go build ./cmd/live，入口程序要识别 go 与 build。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "命令行",
      "动作分派",
      "构建参数"
    ],
    "terms": [
      {
        "term": "CLI",
        "meaning": "命令行程序；你在终端输入的文字会变成参数。"
      },
      {
        "term": "dispatch",
        "meaning": "根据动作名选择要执行的函数。"
      },
      {
        "term": "args",
        "meaning": "程序收到的参数数组。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "命令入口不做所有工作，只负责识别动作并把原始参数交给 Preprocess。",
        "frames": [
          {
            "title": "1. 终端输入",
            "explain": "用户输入一条带子命令的命令。",
            "why": "工具要知道用户想 build 还是执行别的动作。",
            "focus": 0,
            "code": {
              "label": "终端（模拟）",
              "language": "sh",
              "text": "otel go build ./cmd/live",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "args",
                "items": [
                  {
                    "text": "go",
                    "state": "new"
                  },
                  {
                    "text": "build",
                    "state": "new"
                  },
                  {
                    "text": "./cmd/live",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "参数被拆成三个部分。"
          },
          {
            "title": "2. 识别动作",
            "explain": "入口读取第二个参数 build。",
            "why": "动作名决定是否进入插桩流程。",
            "focus": 1,
            "code": {
              "label": "main（示意）",
              "language": "go",
              "text": "if args[1] == \"build\" {\n    return preprocess(args[2:])\n}",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "动作",
                "items": [
                  {
                    "text": "build",
                    "state": "active"
                  }
                ]
              },
              {
                "label": "分支",
                "items": [
                  {
                    "text": "进入 preprocess",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "build 被路由到准备阶段。"
          },
          {
            "title": "3. 保留剩余参数",
            "explain": "目标包和 build flags 原样留下。",
            "why": "工具不能悄悄吞掉用户的 -tags 或 -o。",
            "focus": 2,
            "code": {
              "label": "传递（示意）",
              "language": "text",
              "text": "goBuildCmd = [\"go\", \"build\", \"./cmd/live\"]",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "保留",
                "items": [
                  {
                    "text": "./cmd/live",
                    "state": "ok"
                  }
                ]
              },
              {
                "label": "约束",
                "items": [
                  {
                    "text": "原参数顺序",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "下一站拿到完整构建意图。"
          },
          {
            "title": "4. 进入 Preprocess",
            "explain": "入口只交接，不在这里改 AST。",
            "why": "职责分开后，参数错误和依赖错误更容易定位。",
            "focus": 2,
            "code": {
              "label": "日志（模拟）",
              "language": "text",
              "text": "[cli] action=build\n[cli] next=preprocess",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "阶段",
                "items": [
                  {
                    "text": "CLI 完成",
                    "state": "ok"
                  },
                  {
                    "text": "Preprocess 待开始",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "命令入口完成交接。"
          }
        ],
        "verdict": "CLI 是前台接待：识别意图、保留参数、交给真正的流水线。"
      }
    ],
    "question": {
      "prompt": "入口程序为什么不直接在 main 里改函数？",
      "options": [
        "为了把命令分派和源码改写分开",
        "因为 main 不能调用 Go 函数",
        "因为参数不需要传递"
      ],
      "answer": 0,
      "explanation": "分层让每一步都有清晰输入输出。"
    }
  },
  "toolexec": {
    "title": "把每一次编译动作接到工具上",
    "scenario": "go build 会调用 compile 和 link；-toolexec 让包装器先看到这些调用。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "Go build",
      "工具包装",
      "原工具"
    ],
    "terms": [
      {
        "term": "toolexec",
        "meaning": "Go 提供的编译工具包装入口。"
      },
      {
        "term": "compile",
        "meaning": "把一个 Go 源文件包编成目标文件。"
      },
      {
        "term": "passthrough",
        "meaning": "包装器处理后仍把参数交给原工具。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "包装器不替代 compiler，而是在它前面观察和改写。",
        "frames": [
          {
            "title": "1. 普通构建",
            "explain": "Go 直接安排 compile。",
            "why": "先看原始动作，才能知道包装器接在哪里。",
            "focus": 0,
            "code": {
              "label": "模拟命令",
              "language": "sh",
              "text": "go build ./cmd/live\n→ compile package main",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "调用链",
                "items": [
                  {
                    "text": "go build",
                    "state": "active"
                  },
                  {
                    "text": "compile",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "编译器收到原始源码。"
          },
          {
            "title": "2. 加 -toolexec",
            "explain": "Go 把 compile 先交给 otel 工具。",
            "why": "工具获得统一入口，可以读取 package 和源文件。",
            "focus": 1,
            "code": {
              "label": "模拟命令",
              "language": "sh",
              "text": "go build -toolexec=/otel ./cmd/live\n→ /otel compile ...",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "新节点",
                "items": [
                  {
                    "text": "/otel wrapper",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "原动作",
                "items": [
                  {
                    "text": "compile",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "wrapper 成为中间站。"
          },
          {
            "title": "3. wrapper 识别版本探测",
            "explain": "wrapper 先原样处理 -V=full。",
            "why": "Go 用版本探测确认工具兼容；stdout 不能被日志污染。",
            "focus": 2,
            "code": {
              "label": "wrapper（示意）",
              "language": "go",
              "text": "if arg == \"-V=full\" {\n    exec(original, args...)\n}",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "stdout",
                "items": [
                  {
                    "text": "版本信息原样输出",
                    "state": "ok"
                  }
                ]
              },
              {
                "label": "日志",
                "items": [
                  {
                    "text": "写到文件或 stderr",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "探测仍能成功。"
          },
          {
            "title": "4. wrapper 再交给 compiler",
            "explain": "普通编译参数被完整转发。",
            "why": "不转发参数会导致编译失败或行为改变。",
            "focus": 2,
            "code": {
              "label": "日志（模拟）",
              "language": "text",
              "text": "wrapper: tool=compile package=main\nwrapper: exec=/usr/local/go/pkg/tool/.../compile",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "结果",
                "items": [
                  {
                    "text": "源码改写机会出现",
                    "state": "new"
                  },
                  {
                    "text": "原 compiler 仍执行",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "工具接入但没有吞掉编译。"
          }
        ],
        "verdict": "toolexec 是编译期的门口，不是运行时的 Span。"
      }
    ],
    "question": {
      "prompt": "包装器最重要的安全动作是什么？",
      "options": [
        "保留并转发原工具参数和退出码",
        "删除 Go build cache",
        "把所有函数改成 goroutine"
      ],
      "answer": 0,
      "explanation": "它必须像透明中间层一样工作。"
    }
  },
  "rule-load": {
    "title": "JSON 规则先变成 Go 能读取的对象",
    "scenario": "规则文件写 net/http 的 RoundTrip；加载器把文本转换为结构体。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "JSON 文本",
      "解析",
      "规则对象"
    ],
    "terms": [
      {
        "term": "JSON",
        "meaning": "给人和程序都能读的结构化文本。"
      },
      {
        "term": "unmarshal",
        "meaning": "把 JSON 文本填进 Go 结构体。"
      },
      {
        "term": "validation",
        "meaning": "检查必填字段是否合法。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "规则文本只是数据，匹配器需要类型化对象。",
        "frames": [
          {
            "title": "1. 文件中的文字",
            "explain": "规则文件写出目标包、函数和 hook 名。",
            "why": "文件适合配置，但代码不能直接调用一段文字。",
            "focus": 0,
            "code": {
              "label": "nethttp.json",
              "language": "json",
              "text": "{\"ImportPath\":\"net/http\",\"Function\":\"RoundTrip\",\"OnEnter\":\"clientOnEnter\",\"OnExit\":\"clientOnExit\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "字段",
                "items": [
                  {
                    "text": "ImportPath",
                    "state": "new"
                  },
                  {
                    "text": "Function",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "得到原始 JSON。"
          },
          {
            "title": "2. 解析字段",
            "explain": "加载器读取字段名。",
            "why": "拼写错误要在早期暴露。",
            "focus": 1,
            "code": {
              "label": "Rule（示意）",
              "language": "go",
              "text": "type Rule struct {\n ImportPath string\n Function string\n OnEnter string\n}",
              "highlight": [
                1,
                2,
                3,
                4
              ]
            },
            "panels": [
              {
                "label": "类型",
                "items": [
                  {
                    "text": "Rule",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "值",
                "items": [
                  {
                    "text": "RoundTrip",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "文字变成 Go 值。"
          },
          {
            "title": "3. 检查必填项",
            "explain": "本例讨论函数规则：缺少目标函数名时，不能按这条配置去匹配 RoundTrip。结构体和文件规则另有自己的字段。",
            "why": "错误规则进入编译阶段会更难定位。",
            "focus": 1,
            "code": {
              "label": "本例函数规则检查 · 教学伪代码",
              "language": "go",
              "text": "if r.ImportPath == \"\" || r.Function == \"\" {\n    return errInvalidRule\n}",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "校验",
                "items": [
                  {
                    "text": "ImportPath ✓",
                    "state": "ok"
                  },
                  {
                    "text": "Function ✓",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "规则通过基础检查。"
          },
          {
            "title": "4. 交给 matcher",
            "explain": "结构化规则进入匹配器。",
            "why": "后面才会结合真实编译命令判断版本和包。",
            "focus": 2,
            "code": {
              "label": "日志（模拟）",
              "language": "text",
              "text": "loaded rule: net/http.RoundTrip → clientOnEnter/clientOnExit",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "下一步",
                "items": [
                  {
                    "text": "RuleSet",
                    "state": "new"
                  },
                  {
                    "text": "match",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "加载完成，不代表已经命中。"
          }
        ],
        "verdict": "加载只回答“规则写得像不像对象”，不回答“当前项目是否适用”。"
      }
    ],
    "question": {
      "prompt": "JSON 加载成功是否代表一定会插桩？",
      "options": [
        "不代表，还要匹配包、函数和版本",
        "代表，所有 JSON 都会改写",
        "只要文件名相同就会命中"
      ],
      "answer": 0,
      "explanation": "加载和匹配是两个阶段。"
    }
  },
  "rule-model": {
    "title": "一条规则其实带着多个限制",
    "scenario": "同一个 Open 函数在不同版本库里签名可能不同。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "规则字段",
      "版本条件",
      "命中判断"
    ],
    "terms": [
      {
        "term": "ImportPath",
        "meaning": "目标包的完整导入路径。"
      },
      {
        "term": "Version range",
        "meaning": "允许规则生效的版本区间。"
      },
      {
        "term": "ReceiverType",
        "meaning": "方法接收者类型，例如 *Transport。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "规则不是只有函数名，还要限制包、版本和接收者。",
        "frames": [
          {
            "title": "1. 只有函数名",
            "explain": "粗略规则写 Open。",
            "why": "同名函数可能属于不同包。",
            "focus": 0,
            "code": {
              "label": "规则（不足）",
              "language": "json",
              "text": "{\"Function\":\"Open\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "信息",
                "items": [
                  {
                    "text": "函数名",
                    "state": "active"
                  },
                  {
                    "text": "包 = 缺失",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "可能误命中。"
          },
          {
            "title": "2. 加包路径",
            "explain": "限制到 gorm.io/gorm。",
            "why": "完整路径避免跨库混淆。",
            "focus": 0,
            "code": {
              "label": "规则（教学）",
              "language": "json",
              "text": "{\"ImportPath\":\"gorm.io/gorm\",\"Function\":\"Open\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "限制",
                "items": [
                  {
                    "text": "包路径 ✓",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "范围变窄。"
          },
          {
            "title": "3. 加版本区间",
            "explain": "只允许兼容版本。",
            "why": "hook 签名变了，旧规则可能不安全。",
            "focus": 1,
            "code": {
              "label": "规则（教学）",
              "language": "json",
              "text": "{\"Version\":\"[1.22.0,1.25.10)\",\"Function\":\"Open\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "版本",
                "items": [
                  {
                    "text": "1.24.0 → 命中",
                    "state": "ok"
                  },
                  {
                    "text": "1.25.12 → 跳过",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "规则可拒绝不兼容版本。"
          },
          {
            "title": "4. 加 receiver",
            "explain": "方法目标还要确认接收者。",
            "why": "RoundTrip 必须是 *Transport 的方法。",
            "focus": 2,
            "code": {
              "label": "规则（教学）",
              "language": "json",
              "text": "{\"Function\":\"RoundTrip\",\"ReceiverType\":\"\\\\*Transport\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "目标",
                "items": [
                  {
                    "text": "*Transport.RoundTrip",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "多项条件共同决定命中。"
          }
        ],
        "verdict": "规则越具体，越能避免把相似函数错误改写。"
      }
    ],
    "question": {
      "prompt": "版本条件主要保护什么？",
      "options": [
        "避免不兼容签名被错误改写",
        "让所有旧版本自动升级",
        "控制日志颜色"
      ],
      "answer": 0,
      "explanation": "规则依赖目标库的结构和签名。"
    }
  },
  "bundle": {
    "title": "把一个编译包的命中规则装进工作篮子",
    "scenario": "一次业务构建分别编译 net/http 与 gorm.io/gorm。工具为每个编译包保存自己的规则篮子。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "编译包",
      "命中规则",
      "工作篮子"
    ],
    "terms": [
      {
        "term": "bundle",
        "meaning": "同一个编译单元要一起处理的一组规则。"
      },
      {
        "term": "package",
        "meaning": "一组一起编译的 Go 源文件。"
      },
      {
        "term": "rule set",
        "meaning": "某个包上可执行的规则集合。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "匹配结果按 package 收拢，后续改写时可以一次取齐。",
        "frames": [
          {
            "title": "1. 编译一个包",
            "explain": "构建会产生多条编译动作，每条有自己的精确 package 路径。",
            "why": "工具先知道当前正在编译谁。",
            "focus": 0,
            "code": {
              "label": "编译日志（模拟）",
              "language": "text",
              "text": "compile -p net/http ...\ncompile -p gorm.io/gorm ...",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "package",
                "items": [
                  {
                    "text": "net/http",
                    "state": "new"
                  },
                  {
                    "text": "gorm.io/gorm",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "得到工作对象。"
          },
          {
            "title": "2. 发现 HTTP 规则",
            "explain": "处理 net/http 的编译动作时，选中它自己的 RoundTrip 规则。",
            "why": "HTTP 调用可能需要客户端 hook。",
            "focus": 1,
            "code": {
              "label": "命中结果",
              "language": "text",
              "text": "rule: net/http.RoundTrip → clientOnEnter/clientOnExit",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "net/http 的 bundle",
                "items": [
                  {
                    "text": "RoundTrip / ServeHTTP",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "net/http 的篮子收到 HTTP 规则。"
          },
          {
            "title": "3. 发现 GORM 规则",
            "explain": "处理 gorm.io/gorm 的编译动作时，另外选中 Open 规则。",
            "why": "调用 GORM 的业务包与定义 Open 的 GORM 包是不同编译包；规则按目标定义所在的包收拢。",
            "focus": 1,
            "code": {
              "label": "命中结果",
              "language": "text",
              "text": "rule: gorm.io/gorm.Open → afterGormOpen",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "gorm.io/gorm 的 bundle",
                "items": [
                  {
                    "text": "Open",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "另一个 net/http bundle",
                "items": [
                  {
                    "text": "仍保留自己的 HTTP 规则",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "GORM 有另一个篮子，两个包的规则不会混装。"
          },
          {
            "title": "4. 交给改写器",
            "explain": "Instrument 编译哪个包，就读取哪个包的规则集合。",
            "why": "避免只改一条规则而漏掉同包其他目标。",
            "focus": 2,
            "code": {
              "label": "Bundle（示意）",
              "language": "text",
              "text": "bundle[net/http] = [RoundTrip, ServeHTTP]\nbundle[gorm.io/gorm] = [Open]",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "状态",
                "items": [
                  {
                    "text": "package ready",
                    "state": "ok"
                  },
                  {
                    "text": "instrument next",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "每个包拿到自己的规则集合。"
          }
        ],
        "verdict": "bundle 是“这次编译包要一起处理什么”的清单。"
      }
    ],
    "question": {
      "prompt": "业务 room 包调用了 HTTP 与 GORM，三者会合成同一个 bundle 吗？",
      "options": [
        "不会，规则按目标定义所在的编译包分别收拢",
        "会，所有 import 都属于 room 的同一个包",
        "只有文件名相同才合并"
      ],
      "answer": 0,
      "explanation": "调用者和被调用库是不同 package。net/http 的规则跟随 net/http 的编译动作，GORM 同理。"
    }
  },
  "match": {
    "title": "从编译命令找到当前目标包",
    "scenario": "工具看到 compile -p net/http 与 compile -p example.com/live。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "编译命令",
      "包路径",
      "规则匹配"
    ],
    "terms": [
      {
        "term": "-p",
        "meaning": "Go 编译命令中表示 package import path 的参数。"
      },
      {
        "term": "dry run",
        "meaning": "只列出动作，不真正生成最终二进制。"
      },
      {
        "term": "match",
        "meaning": "把实际编译对象与规则条件比较。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "matcher 不猜业务意图，而是从真实编译 action 识别 package。",
        "frames": [
          {
            "title": "1. 记录 dry run",
            "explain": "Go 只列出将执行的 compile。",
            "why": "不用先改源码就能知道依赖和包。",
            "focus": 0,
            "code": {
              "label": "dry_run.log（模拟）",
              "language": "text",
              "text": "compile -p net/http ...\ncompile -p example.com/live ...",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "actions",
                "items": [
                  {
                    "text": "net/http",
                    "state": "new"
                  },
                  {
                    "text": "example.com/live",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "拿到候选包。"
          },
          {
            "title": "2. 取出 -p",
            "explain": "matcher 从每条 action 取 package。",
            "why": "规则的 ImportPath 要和这个值比较。",
            "focus": 1,
            "code": {
              "label": "解析（示意）",
              "language": "go",
              "text": "pkg := flagValue(args, \"-p\")\n// pkg = \"net/http\"",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "当前",
                "items": [
                  {
                    "text": "net/http",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "得到明确路径。"
          },
          {
            "title": "3. 比较规则",
            "explain": "net/http 满足 HTTP 规则，业务包本身可能不满足。",
            "why": "不是所有 compile action 都该插桩。",
            "focus": 2,
            "code": {
              "label": "比较（模拟）",
              "language": "text",
              "text": "net/http == rule.ImportPath → yes\nexample.com/live == net/http → no",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "命中",
                "items": [
                  {
                    "text": "net/http → yes",
                    "state": "ok"
                  },
                  {
                    "text": "example.com/live → no",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "只保留相关规则。"
          },
          {
            "title": "4. 形成结果",
            "explain": "命中结果按 action 返回给后续阶段。",
            "why": "后续才会准备对应 hook 依赖。",
            "focus": 2,
            "code": {
              "label": "结果（模拟）",
              "language": "text",
              "text": "matched packages: [net/http]\nmatched rules: [RoundTrip]",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "下一步",
                "items": [
                  {
                    "text": "newDeps",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "匹配阶段结束。"
          }
        ],
        "verdict": "match 依赖真实编译动作，所以 dry run 是它的输入。"
      }
    ],
    "question": {
      "prompt": "为什么工具要先做 dry run？",
      "options": [
        "先了解实际会编译哪些包和依赖",
        "为了跳过最终编译",
        "为了把所有包都当成 net/http"
      ],
      "answer": 0,
      "explanation": "它需要真实 action 才能做精确匹配。"
    }
  },
  "instrument": {
    "title": "插桩总流程：从文件找到函数",
    "scenario": "compile action 带着 room.go；工具要找到 Handle 函数。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "文件",
      "语法树",
      "目标函数",
      "改写"
    ],
    "terms": [
      {
        "term": "AST",
        "meaning": "Go 源码的结构化语法树。"
      },
      {
        "term": "instrument",
        "meaning": "在既有代码周围加入观察或 hook 行为。"
      },
      {
        "term": "FuncDecl",
        "meaning": "语法树中代表函数声明的节点。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "工具先解析文件，再以结构节点定位目标，不靠全局文本替换。",
        "frames": [
          {
            "title": "1. 编译器给文件",
            "explain": "toolexec 看到 room.go。",
            "why": "文件是改写的入口。",
            "focus": 0,
            "code": {
              "label": "action（模拟）",
              "language": "text",
              "text": "compile -p example.com/live/room room.go",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "room.go",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "开始读取源码。"
          },
          {
            "title": "2. 解析成树",
            "explain": "函数、参数和 body 成为节点。",
            "why": "树能区分注释、字符串和真正的函数。",
            "focus": 1,
            "code": {
              "label": "结构（简化）",
              "language": "text",
              "text": "File\n└─ FuncDecl Handle\n   └─ Body [return result]",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "节点",
                "items": [
                  {
                    "text": "FuncDecl Handle",
                    "state": "new"
                  },
                  {
                    "text": "return",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "目标不再只是文字。"
          },
          {
            "title": "3. 定位目标",
            "explain": "规则条件与 FuncDecl 对上。",
            "why": "只改命中的函数。",
            "focus": 2,
            "code": {
              "label": "匹配（教学）",
              "language": "text",
              "text": "ImportPath = example.com/live/room\nFunction = Handle → matched",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "状态",
                "items": [
                  {
                    "text": "Handle matched",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "目标函数被选中。"
          },
          {
            "title": "4. 写回结构",
            "explain": "在 body 中放入 enter/exit 桥接调用。",
            "why": "最后再格式化成 Go 源码给 compiler。",
            "focus": 3,
            "code": {
              "label": "改写后（示意）",
              "language": "go",
              "text": "func Handle() int {\n    call.Enter()\n    defer call.Exit()\n    return result\n}",
              "highlight": [
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "Enter + Exit",
                    "state": "new"
                  },
                  {
                    "text": "原 return 保留",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "AST 改写完成。"
          }
        ],
        "verdict": "插桩是结构化改写流程，结果仍要回到正常 Go 编译。"
      }
    ],
    "question": {
      "prompt": "为什么不直接 strings.Replace(\"return\")？",
      "options": [
        "AST 能区分语法节点，避免误改注释和字符串",
        "因为字符串不能保存",
        "因为 AST 只用于日志"
      ],
      "answer": 0,
      "explanation": "结构化节点让目标更可靠。"
    }
  },
  "func-ast": {
    "title": "在函数入口和返回路径接上 hook",
    "scenario": "Handle 有两个 return；工具要保证 exit 能看到返回值。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "原函数",
      "入口",
      "返回路径",
      "Hook"
    ],
    "terms": [
      {
        "term": "defer",
        "meaning": "函数返回时执行注册的收尾动作。"
      },
      {
        "term": "return value",
        "meaning": "函数交给调用者的结果。"
      },
      {
        "term": "receiver",
        "meaning": "方法名前面的对象，例如 func (t *Transport)。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "入口创建共享状态，defer 在返回时收尾。",
        "frames": [
          {
            "title": "1. 原始函数",
            "explain": "函数有成功和失败两个返回。",
            "why": "每条路径都可能需要收尾。",
            "focus": 0,
            "code": {
              "label": "原始 Go（教学）",
              "language": "go",
              "text": "func Handle(ok bool) (int, error) {\n    if !ok { return 0, errBad }\n    return 42, nil\n}",
              "highlight": [
                2,
                3,
                4
              ]
            },
            "panels": [
              {
                "label": "路径",
                "items": [
                  {
                    "text": "error return",
                    "state": "new"
                  },
                  {
                    "text": "success return",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "存在两条返回路径。"
          },
          {
            "title": "2. 入口 hook",
            "explain": "函数开始时建立 CallContext。",
            "why": "enter 记录输入并准备共享信封。",
            "focus": 1,
            "code": {
              "label": "插入片段（示意）",
              "language": "go",
              "text": "call := hook.Enter()\nif !ok { return 0, errBad }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "状态",
                "items": [
                  {
                    "text": "call created",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "入口状态已创建。"
          },
          {
            "title": "3. defer 覆盖返回",
            "explain": "defer 在两条 return 前都能执行。",
            "why": "避免只给最后一行 return 加逻辑。",
            "focus": 2,
            "code": {
              "label": "插入片段（示意）",
              "language": "go",
              "text": "call := hook.Enter()\ndefer hook.Exit(call)\nif !ok { return 0, errBad }",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "覆盖",
                "items": [
                  {
                    "text": "error path",
                    "state": "ok"
                  },
                  {
                    "text": "success path",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "两条路径都能到 exit。"
          },
          {
            "title": "4. 保留 receiver",
            "explain": "方法 hook 的 enter 会拿到 receiver 与请求。",
            "why": "规则签名必须和生成桥接一致。",
            "focus": 3,
            "code": {
              "label": "签名（真实形状简化）",
              "language": "go",
              "text": "func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "参数",
                "items": [
                  {
                    "text": "CallContext",
                    "state": "ok"
                  },
                  {
                    "text": "*Transport",
                    "state": "ok"
                  },
                  {
                    "text": "*Request",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "hook 能读到方法上下文。"
          }
        ],
        "verdict": "函数 AST 改写的核心是覆盖所有返回路径，并保持原签名约定。"
      }
    ],
    "question": {
      "prompt": "为什么常用 defer 做 exit？",
      "options": [
        "它能覆盖多个 return 路径",
        "因为 defer 会自动创建 TraceID",
        "因为 return 不能被读取"
      ],
      "answer": 0,
      "explanation": "defer 是 Go 的函数收尾机制，具体是否记录 Span 由 hook 决定。"
    }
  },
  "trampoline": {
    "title": "Trampoline 是一座调用桥",
    "scenario": "改写后要在原函数前后调用 hook，但不能丢掉原参数和返回值。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "调用者",
      "桥接函数",
      "原函数",
      "返回"
    ],
    "terms": [
      {
        "term": "trampoline",
        "meaning": "生成的桥接函数，负责 enter→原调用→exit。"
      },
      {
        "term": "proxy",
        "meaning": "代替原入口接收调用再转发。"
      },
      {
        "term": "signature",
        "meaning": "函数参数和返回值的形状。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "桥接函数把观察逻辑包在原函数外侧。",
        "frames": [
          {
            "title": "1. 调用者看见原入口",
            "explain": "调用者仍调用 Handle(7)。",
            "why": "业务调用点可以保持不变。",
            "focus": 0,
            "code": {
              "label": "调用（教学）",
              "language": "go",
              "text": "result := Handle(7)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "调用者",
                "items": [
                  {
                    "text": "Handle(7)",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "调用进入桥。"
          },
          {
            "title": "2. 进入 trampoline",
            "explain": "桥接函数先接收参数并调用 enter。",
            "why": "它保存参数，供后续 hook 使用。",
            "focus": 1,
            "code": {
              "label": "桥（示意）",
              "language": "go",
              "text": "func Handle_trampoline(x int) int {\n    call := enter(x)",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "桥",
                "items": [
                  {
                    "text": "x = 7",
                    "state": "new"
                  },
                  {
                    "text": "enter",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "共享状态产生。"
          },
          {
            "title": "3. 调用原函数",
            "explain": "桥把 x 原样传给真正的实现。",
            "why": "透明转发是保持业务行为的关键。",
            "focus": 2,
            "code": {
              "label": "桥（示意）",
              "language": "go",
              "text": "    result := Handle_original(x)\n    returnValue := result",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "原函数",
                "items": [
                  {
                    "text": "Handle_original(7)",
                    "state": "active"
                  },
                  {
                    "text": "result = 8",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "业务结果保持 8。"
          },
          {
            "title": "4. exit 再返回",
            "explain": "exit 读取共享结果，桥返回给调用者。",
            "why": "Span 结束等记录应发生在结果已知之后。",
            "focus": 3,
            "code": {
              "label": "桥（示意）",
              "language": "go",
              "text": "    exit(call, result)\n    return result\n}",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "时序",
                "items": [
                  {
                    "text": "exit(result=8)",
                    "state": "new"
                  },
                  {
                    "text": "caller gets 8",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "观察逻辑和原返回都完成。"
          }
        ],
        "verdict": "Trampoline 连接的是调用约定，不是把函数指针神奇替换掉。"
      }
    ],
    "question": {
      "prompt": "桥接函数最不能改变什么？",
      "options": [
        "参数、返回值和调用结果的契约",
        "所有函数名都必须变成 main",
        "日志格式必须固定"
      ],
      "answer": 0,
      "explanation": "桥要保持业务调用可用。"
    }
  },
  "call-context": {
    "title": "CallContext 是 enter 到 exit 的小信封",
    "scenario": "HTTP enter 读请求，exit 需要拿到同一次调用的响应。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "Enter",
      "共享信封",
      "Exit",
      "结果"
    ],
    "terms": [
      {
        "term": "CallContext",
        "meaning": "生成桥用于保存同一次调用状态的对象，不是标准库 context.Context。"
      },
      {
        "term": "SetData / GetData",
        "meaning": "给同一次调用存放与取出一份 hook 自己的共享数据。"
      },
      {
        "term": "SetParam / GetReturnVal",
        "meaning": "前者改写原函数参数，后者读取返回值；它们不是存放 hook 自有数据的普通字典。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "同一次函数调用的参数、返回值和临时状态通过 CallContext 对接。",
        "frames": [
          {
            "title": "1. enter 收到调用",
            "explain": "HTTP enter 同时收到 CallContext、receiver、request。",
            "why": "它需要访问业务调用的输入。",
            "focus": 0,
            "code": {
              "label": "签名（简化）",
              "language": "go",
              "text": "func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "method=GET",
                    "state": "new"
                  },
                  {
                    "text": "url=/rooms/42",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "请求数据进入信封。"
          },
          {
            "title": "2. 保存共享值",
            "explain": "Enter 把已经创建 Span 后的 ctx 和请求信息放进共享 Data，给 Exit 收尾使用。",
            "why": "Enter 和 Exit 是两个函数；同一次调用需要一处存放观察状态的地方。SetParam 会改写业务参数，不该拿它当字典。",
            "focus": 1,
            "code": {
              "label": "状态（示意）",
              "language": "go",
              "text": "call.SetData(map[string]interface{}{\n    \"ctx\": ctx,\n    \"request\": req,\n})",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "本次调用的 Data",
                "items": [
                  {
                    "text": "ctx + request",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "原函数参数",
                "items": [
                  {
                    "text": "没有用 SetParam 充当共享字典",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "共享状态与原函数参数分开保存。"
          },
          {
            "title": "3. 原函数执行",
            "explain": "Transport.RoundTrip 返回 response。",
            "why": "返回值稍后由桥接层放回状态。",
            "focus": 2,
            "code": {
              "label": "模拟输出",
              "language": "text",
              "text": "RoundTrip(req) → status=200, err=nil",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "返回",
                "items": [
                  {
                    "text": "*Response",
                    "state": "new"
                  },
                  {
                    "text": "error=nil",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "响应产生。"
          },
          {
            "title": "4. exit 读取信封",
            "explain": "Exit 直接收到 response 和 error，再从 Data 读出 Enter 保存的 ctx 与请求信息。",
            "why": "HTTP Exit 已有返回值参数，不需要虚构 call.Return 方法；一般接口读取返回值的方法名是 GetReturnVal。",
            "focus": 3,
            "code": {
              "label": "exit（示意）",
              "language": "go",
              "text": "func clientOnExit(call api.CallContext, res *http.Response, err error) {\n    data := call.GetData().(map[string]interface{})\n    // 用 data[\"ctx\"]、data[\"request\"] 和 res 完成观察收尾\n}",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "结果",
                "items": [
                  {
                    "text": "status=200",
                    "state": "ok"
                  },
                  {
                    "text": "Span end",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "一次调用的前后被连起来。"
          }
        ],
        "verdict": "CallContext 是插桩桥的调用状态；不要把它当成 Go 的 context.Context。"
      }
    ],
    "question": {
      "prompt": "CallContext 和 context.Context 是同一个东西吗？",
      "options": [
        "不是，前者是 hook 调用状态接口",
        "是，名字不同而已",
        "前者只保存 TraceID"
      ],
      "answer": 0,
      "explanation": "hook 可以把 context.Context 放进 CallContext，但两者职责不同。"
    }
  },
  "call-context-impl": {
    "title": "先看测试版，再追真正生成的 CallContext",
    "scenario": "源码中 pkg/api/impl.go 便于测试，但生产桥接来自模板生成。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "测试实现",
      "生成模板",
      "运行时对象"
    ],
    "terms": [
      {
        "term": "test implementation",
        "meaning": "为了测试 API 行为写的简化实现，不一定是生产路径。"
      },
      {
        "term": "template",
        "meaning": "生成多个相似桥接函数的代码模板。"
      },
      {
        "term": "generated code",
        "meaning": "构建过程中由模板产生的 Go 文件。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "读代码时要分清“测试帮助类”和真正运行时生成代码。",
        "frames": [
          {
            "title": "1. 看到测试实现",
            "explain": "pkg/api/impl.go 提供一个简化 CallContext。",
            "why": "它适合理解接口，但标注了 testing purpose。",
            "focus": 0,
            "code": {
              "label": "源码提示（概念）",
              "language": "go",
              "text": "// For testing purpose only\ntype CallContextImpl struct { Params []any }",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "身份",
                "items": [
                  {
                    "text": "测试辅助",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "先不要把它当生产桥。"
          },
          {
            "title": "2. 生产入口在模板",
            "explain": "tool/instrument/impl.tmpl 定义生成形状。",
            "why": "实际编译会按目标函数生成具体代码。",
            "focus": 1,
            "code": {
              "label": "模板（示意）",
              "language": "text",
              "text": "{{ generateCallContext .Params .Returns }}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "来源",
                "items": [
                  {
                    "text": "impl.tmpl",
                    "state": "new"
                  }
                ]
              },
              {
                "label": "产物",
                "items": [
                  {
                    "text": "generated CallContext",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "模板成为生产来源。"
          },
          {
            "title": "3. 绑定参数位置",
            "explain": "测试实现返回槽位地址；生产模板按目标函数类型生成访问。普通槽位不能代替真实签名。",
            "why": "hook 需要知道第几个位置对应什么。",
            "focus": 2,
            "code": {
              "label": "生成结果（教学）",
              "language": "go",
              "text": "// 下面是测试实现帮助理解的槽位，不是模板原文\nGetParam(0)    → &c.Params[0]\nGetReturnVal(0) → &c.ReturnVals[0]\n// 生产模板会生成符合具体目标类型的访问方法",
              "highlight": [
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "槽位",
                "items": [
                  {
                    "text": "Params[0] = request",
                    "state": "new"
                  },
                  {
                    "text": "ReturnVals[0] = response",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "知道接口在访问什么，再去看生产模板；泛型 setter 仍不支持。"
          },
          {
            "title": "4. 对照两份代码",
            "explain": "测试实现帮助读接口，模板帮助读生产链路。",
            "why": "两者都读，才能避免错误结论。",
            "focus": 2,
            "code": {
              "label": "阅读路线",
              "language": "text",
              "text": "api/impl.go → 看接口行为\ntool/instrument/impl.tmpl → 看生产生成",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "结论",
                "items": [
                  {
                    "text": "测试 != 生产",
                    "state": "ok"
                  },
                  {
                    "text": "都可作为阅读入口",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "源码地图指向正确层。"
          }
        ],
        "verdict": "阅读实现时要先问：这是测试替身，还是构建时真正生成的代码？"
      }
    ],
    "question": {
      "prompt": "生产版 CallContext 应优先追哪条线？",
      "options": [
        "tool/instrument/impl.tmpl 的生成链",
        "只看 pkg/api/impl.go",
        "只看 JSON 文件"
      ],
      "answer": 0,
      "explanation": "测试实现解释 API，模板解释生产桥接。"
    }
  },
  "linkname": {
    "title": "go:linkname 是一座很窄的跨包桥",
    "scenario": "规则包需要连接目标包中的生成符号。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "目标符号",
      "链接声明",
      "运行调用"
    ],
    "terms": [
      {
        "term": "symbol",
        "meaning": "编译链接阶段识别的函数或变量名字。"
      },
      {
        "term": "go:linkname",
        "meaning": "允许在特殊情况下把本地名字连到另一个符号。"
      },
      {
        "term": "unsafe",
        "meaning": "绕开部分类型安全保证的 Go 能力。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "linkname 连接的是编译链接符号，不能当作通用 API。",
        "frames": [
          {
            "title": "1. 目标包有符号",
            "explain": "生成桥接在目标包中暴露符号。",
            "why": "规则包需要一个稳定连接点。",
            "focus": 0,
            "code": {
              "label": "目标（示意）",
              "language": "go",
              "text": "func OtelPrintStackImpl(bt []byte) { ... }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "符号",
                "items": [
                  {
                    "text": "OtelPrintStackImpl",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "目标符号存在。"
          },
          {
            "title": "2. 声明 linkname",
            "explain": "规则包声明本地名字映射到目标符号。",
            "why": "名字不同也能连接到同一个链接符号。",
            "focus": 1,
            "code": {
              "label": "声明（简化）",
              "language": "go",
              "text": "//go:linkname _printstack pkg.OtelPrintStackImpl\nvar _printstack func([]byte)",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "桥",
                "items": [
                  {
                    "text": "_printstack → target",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "链接关系建立。"
          },
          {
            "title": "3. 编译器链接",
            "explain": "link 阶段把两边合并。",
            "why": "只声明不代表运行时自动执行。",
            "focus": 2,
            "code": {
              "label": "模拟日志",
              "language": "text",
              "text": "link: _printstack resolves to pkg.OtelPrintStackImpl",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "状态",
                "items": [
                  {
                    "text": "resolved",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "符号解析成功。"
          },
          {
            "title": "4. 运行时调用",
            "explain": "hook 调本地别名，实际到目标实现。",
            "why": "这条桥很窄，符号签名必须一致。",
            "focus": 2,
            "code": {
              "label": "调用（示意）",
              "language": "go",
              "text": "_printstack(debug.Stack())",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "风险",
                "items": [
                  {
                    "text": "签名不一致 → 构建/运行问题",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "跨包调用完成。"
          }
        ],
        "verdict": "linkname 能解决特定连接问题，也增加了版本和签名风险。"
      }
    ],
    "question": {
      "prompt": "linkname 连接的是什么？",
      "options": [
        "链接器符号",
        "HTTP Header",
        "context.Value"
      ],
      "answer": 0,
      "explanation": "它是编译链接层的机制。"
    }
  },
  "gls": {
    "title": "GLS 只能帮助特定协程上下文路径",
    "scenario": "worker pool 在启动时创建，请求后来才来。先用普通字符串教学标识演示传值，不把它当作 OTel TraceID。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。 本例 WithValue 中的字符串只是教学标识；没有创建 OTel Span。",
    "lanes": [
      "请求 ctx",
      "任务交接",
      "worker",
      "读取结果"
    ],
    "terms": [
      {
        "term": "GLS",
        "meaning": "工具提供的协程本地上下文桥，不是 Go 自动继承机制。"
      },
      {
        "term": "worker pool",
        "meaning": "提前创建、反复处理任务的协程集合。"
      },
      {
        "term": "handoff",
        "meaning": "把请求上下文随任务一起交给另一个执行者。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "预创建 worker 不会凭空知道后来请求的 trace；任务交接仍要传 ctx。",
        "frames": [
          {
            "title": "1. worker 先启动",
            "explain": "池在服务启动时创建。",
            "why": "此时没有任何请求上下文。",
            "focus": 0,
            "code": {
              "label": "启动（示意）",
              "language": "go",
              "text": "go workerLoop() // 服务启动时\n// 当前没有 request ctx",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "worker",
                "items": [
                  {
                    "text": "created early",
                    "state": "new"
                  },
                  {
                    "text": "ctx = root",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "worker 先于请求存在。"
          },
          {
            "title": "2. 请求有 ctx",
            "explain": "请求往 context 放了一个字符串教学标识 request-42；这个值不是 TraceID。",
            "why": "这个 ctx 只在当前调用链有效。",
            "focus": 0,
            "code": {
              "label": "请求（教学）",
              "language": "go",
              "text": "ctx := context.WithValue(req.Context(), key, \"request-42\")",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "请求",
                "items": [
                  {
                    "text": "教学标识 = request-42（不是 OTel TraceID）",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "请求上下文里有了教学标识。"
          },
          {
            "title": "3. 错误交接",
            "explain": "任务只放 payload，worker 用 Background。",
            "why": "没有 carrier，关系在这里断开。",
            "focus": 1,
            "code": {
              "label": "错误示例",
              "language": "go",
              "text": "tasks <- Payload{RoomID: 42}\n// worker: context.Background()",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "worker读取",
                "items": [
                  {
                    "text": "读不到教学标识",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "没有交接这个值，worker 就读不到它。"
          },
          {
            "title": "4. 正确交接",
            "explain": "任务结构显式带 ctx。",
            "why": "边界处传播是可靠做法。",
            "focus": 2,
            "code": {
              "label": "正确示例",
              "language": "go",
              "text": "tasks <- Job{Ctx: ctx, RoomID: 42}\n// worker uses job.Ctx",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "worker读取",
                "items": [
                  {
                    "text": "教学标识 = request-42",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "证明值能随 ctx 交接；真实 Span 父子关系还要用 OTel 实验检查。"
          }
        ],
        "verdict": "GLS 不是“所有 goroutine 自动继承”的保证；任务交接仍需设计 carrier。"
      }
    ],
    "question": {
      "prompt": "预创建 worker 为什么不会自动拿到后来请求的 ctx？",
      "options": [
        "它创建时请求还不存在，交接没有携带 ctx",
        "因为 goroutine 不能运行函数",
        "因为 TraceID 只能在 HTTP 中存在"
      ],
      "answer": 0,
      "explanation": "上下文必须在任务边界显式传递。"
    }
  },
  "hook-rule": {
    "title": "自定义 Hook 也必须遵守连接约定",
    "scenario": "为 net/http.Transport.RoundTrip 写 enter/exit hook。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "规则",
      "Enter",
      "原调用",
      "Exit"
    ],
    "terms": [
      {
        "term": "OnEnter",
        "meaning": "原函数执行前运行的 hook。"
      },
      {
        "term": "OnExit",
        "meaning": "原函数返回后运行的 hook。"
      },
      {
        "term": "receiver",
        "meaning": "方法所属对象，RoundTrip 的 receiver 是 *http.Transport。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "hook 名称能被找到还不够，签名和参数顺序必须匹配。",
        "frames": [
          {
            "title": "1. 规则指定 hook",
            "explain": "JSON 指定 clientOnEnter/clientOnExit。",
            "why": "工具需要知道改写时调用谁。",
            "focus": 0,
            "code": {
              "label": "nethttp.json",
              "language": "json",
              "text": "{\"Function\":\"RoundTrip\",\"ReceiverType\":\"\\\\*Transport\",\"OnEnter\":\"clientOnEnter\",\"OnExit\":\"clientOnExit\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "目标",
                "items": [
                  {
                    "text": "*Transport.RoundTrip",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "规则目标明确。"
          },
          {
            "title": "2. Enter 签名",
            "explain": "Enter 拿到 CallContext、receiver、request。",
            "why": "receiver 只在方法 enter 形状中出现。",
            "focus": 1,
            "code": {
              "label": "hook（简化）",
              "language": "go",
              "text": "func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "参数",
                "items": [
                  {
                    "text": "call",
                    "state": "new"
                  },
                  {
                    "text": "t",
                    "state": "new"
                  },
                  {
                    "text": "req",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "输入顺序固定。"
          },
          {
            "title": "3. 原方法返回",
            "explain": "RoundTrip 返回 response 和 error。",
            "why": "exit 需要读取这两个结果。",
            "focus": 2,
            "code": {
              "label": "原调用（模拟）",
              "language": "text",
              "text": "RoundTrip(req) → response(status=200), err=nil",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "返回",
                "items": [
                  {
                    "text": "status=200",
                    "state": "new"
                  },
                  {
                    "text": "err=nil",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结果进入 exit。"
          },
          {
            "title": "4. Exit 签名",
            "explain": "Exit 接收 CallContext、response、error，不再重复传 receiver。",
            "why": "签名错位会导致 hook 无法正确连接。",
            "focus": 3,
            "code": {
              "label": "hook（简化）",
              "language": "go",
              "text": "func clientOnExit(call api.CallContext, res *http.Response, err error)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "参数",
                "items": [
                  {
                    "text": "call",
                    "state": "ok"
                  },
                  {
                    "text": "res",
                    "state": "ok"
                  },
                  {
                    "text": "err",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "生命周期闭合。"
          }
        ],
        "verdict": "自定义 hook 的第一条测试不是“有没有日志”，而是“签名是否匹配生成桥”。"
      }
    ],
    "question": {
      "prompt": "clientOnExit 还要再次接收 *http.Transport 吗？",
      "options": [
        "按当前生成形状不需要，只接收 call、response、error",
        "必须接收两次 receiver",
        "只接收 TraceID 字符串"
      ],
      "answer": 0,
      "explanation": "Exit 的返回签名和 Enter 的 receiver 形状不同。"
    }
  },
  "rule-json": {
    "title": "用 JSON 表达“改哪个函数”",
    "scenario": "HTTP 规则写明 net/http 的 RoundTrip 和两个 hook。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "规则文本",
      "条件",
      "生成调用"
    ],
    "terms": [
      {
        "term": "Function",
        "meaning": "目标函数名。"
      },
      {
        "term": "ReceiverType",
        "meaning": "方法接收者类型条件。"
      },
      {
        "term": "OnExit",
        "meaning": "返回后要调用的 hook 名。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "JSON 是规则的声明层，真正匹配要看工具实现。",
        "frames": [
          {
            "title": "1. 规则写目标",
            "explain": "文件声明包和函数。",
            "why": "先表达意图，再由工具解释。",
            "focus": 0,
            "code": {
              "label": "JSON（教学）",
              "language": "json",
              "text": "{\"ImportPath\":\"net/http\",\"Function\":\"RoundTrip\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "声明",
                "items": [
                  {
                    "text": "目标 = RoundTrip",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "有了最小目标。"
          },
          {
            "title": "2. 增加方法条件",
            "explain": "加入 *Transport。",
            "why": "避免命中其他同名函数。",
            "focus": 1,
            "code": {
              "label": "JSON（教学）",
              "language": "json",
              "text": "{\"ReceiverType\":\"\\\\*Transport\",\"Function\":\"RoundTrip\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "约束",
                "items": [
                  {
                    "text": "receiver = *Transport",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "方法条件收紧。"
          },
          {
            "title": "3. 增加生命周期",
            "explain": "指定 enter 与 exit。",
            "why": "工具会把名字放进生成桥。",
            "focus": 2,
            "code": {
              "label": "完整片段",
              "language": "json",
              "text": "{\"OnEnter\":\"clientOnEnter\",\"OnExit\":\"clientOnExit\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "hook",
                "items": [
                  {
                    "text": "enter",
                    "state": "new"
                  },
                  {
                    "text": "exit",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "声明完整。"
          },
          {
            "title": "4. 真实匹配要看实现",
            "explain": "文档可能描述 Function 是 regex，但当前 FindFuncDecl 实现按字符串相等比较。",
            "why": "阅读二开代码要以当前版本实现为准。",
            "focus": 2,
            "code": {
              "label": "匹配事实",
              "language": "text",
              "text": "actual: decl.Name == rule.Function\ndocs: Function described as regex",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "结论",
                "items": [
                  {
                    "text": "当前版本按 equality",
                    "state": "ok"
                  },
                  {
                    "text": "不要写宽泛 regex 期待自动展开",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "规则行为以版本源码为准。"
          }
        ],
        "verdict": "规则 JSON 表达意图，matcher 的实现决定实际语义；两者都要读。"
      }
    ],
    "question": {
      "prompt": "当前版本 Function 字段应该按什么理解？",
      "options": [
        "按实际实现的函数名相等匹配",
        "一定按正则展开",
        "只按文件名匹配"
      ],
      "answer": 0,
      "explanation": "文档与实现存在表述差异时，固定版本代码是依据。"
    }
  },
  "otel-runtime": {
    "title": "运行时才真正创建 Span context",
    "scenario": "一个 HTTP 请求进入 server hook，运行时要从当前 context 开始。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "请求进入",
      "context",
      "Span",
      "导出"
    ],
    "terms": [
      {
        "term": "Span",
        "meaning": "一段操作的开始、结束和属性记录。"
      },
      {
        "term": "TraceID",
        "meaning": "把同一条分布式链路的多个 Span 归到一起的 ID。"
      },
      {
        "term": "context.Context",
        "meaning": "Go 中携带取消、截止时间和请求范围值的接口。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "编译期只是加入调用；运行时 hook 才调用 OTel API 生成记录。",
        "frames": [
          {
            "title": "1. 请求进入",
            "explain": "server hook 拿到 request.Context。",
            "why": "上游可能已经带有父 Span。",
            "focus": 0,
            "code": {
              "label": "请求（教学）",
              "language": "go",
              "text": "ctx := req.Context()\ntraceparent = \"00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01\"",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "parent TraceID = aaaa…",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "已有或为空的父上下文进入 hook。"
          },
          {
            "title": "2. Start child",
            "explain": "运行时 tracer 从 ctx 启动 server Span。",
            "why": "这是“创建当前操作记录”的时刻。",
            "focus": 1,
            "code": {
              "label": "OTel（示意）",
              "language": "go",
              "text": "ctx, span := tracer.Start(ctx, \"HTTP /rooms\")\ndefer span.End()",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "context",
                "items": [
                  {
                    "text": "parent = aaaa…",
                    "state": "ok"
                  },
                  {
                    "text": "current span = cccc…",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "当前 Span 产生。"
          },
          {
            "title": "3. 业务日志读取 context",
            "explain": "业务函数沿 ctx 继续执行。",
            "why": "手动日志可读取当前 SpanContext。",
            "focus": 2,
            "code": {
              "label": "业务（教学）",
              "language": "go",
              "text": "traceID := trace.SpanContextFromContext(ctx).TraceID()\nlog.Printf(\"trace=%s\", traceID)",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "日志",
                "items": [
                  {
                    "text": "trace=aaaa… / cccc…",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "日志与当前上下文相连。"
          },
          {
            "title": "4. exporter 接收",
            "explain": "span.End 后 SDK 才把记录交给 exporter。",
            "why": "日志出现不等于后端已收到，导出是另一层。",
            "focus": 3,
            "code": {
              "label": "模拟输出",
              "language": "text",
              "text": "span ended: HTTP /rooms\nexporter: accepted trace=aaaa… span=cccc…",
              "highlight": [
                1,
                2
              ]
            },
            "panels": [
              {
                "label": "后端",
                "items": [
                  {
                    "text": "Span exported",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "一次请求形成可查询记录。"
          }
        ],
        "verdict": "插桩让 Start/End 调用出现；Trace 是否连贯还取决于 context 和传播器。"
      }
    ],
    "question": {
      "prompt": "什么时候真正创建当前 HTTP Span？",
      "options": [
        "运行时 hook 调 tracer.Start 时",
        "go.mod 写入时",
        "JSON 加载时"
      ],
      "answer": 0,
      "explanation": "前两者是编译前准备，Span 是运行时对象。"
    }
  },
  "version-boundary": {
    "title": "三种版本要一起核对",
    "scenario": "业务使用 gorm 1.25.12，而默认规则范围到 1.25.10 之前。",
    "scope": "教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。",
    "lanes": [
      "业务版本",
      "规则范围",
      "结果"
    ],
    "terms": [
      {
        "term": "dependency version",
        "meaning": "业务实际安装的库版本。"
      },
      {
        "term": "rule version",
        "meaning": "规则允许处理的版本区间。"
      },
      {
        "term": "runtime version",
        "meaning": "工具和运行时支持库自身版本。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个具体场景",
        "summary": "工具版本新不代表每条规则都适用于业务库版本。",
        "frames": [
          {
            "title": "1. 业务锁定版本",
            "explain": "go.mod 使用 gorm 1.25.12。",
            "why": "这是 matcher 看到的事实。",
            "focus": 0,
            "code": {
              "label": "业务 go.mod（教学）",
              "language": "text",
              "text": "require gorm.io/gorm v1.25.12",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "业务",
                "items": [
                  {
                    "text": "gorm 1.25.12",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "进入版本比较。"
          },
          {
            "title": "2. 规则声明范围",
            "explain": "gorm 规则是 [1.22.0,1.25.10)。",
            "why": "右边开区间不包含 1.25.10。",
            "focus": 1,
            "code": {
              "label": "gorm.json",
              "language": "json",
              "text": "{\"Version\":\"[1.22.0,1.25.10)\",\"Function\":\"Open\"}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "范围",
                "items": [
                  {
                    "text": "1.22.0 ≤ v < 1.25.10",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "规则范围固定。"
          },
          {
            "title": "3. matcher 判断",
            "explain": "1.25.12 超出范围。",
            "why": "工具应跳过该规则，避免未知签名改写。",
            "focus": 2,
            "code": {
              "label": "判断（模拟）",
              "language": "text",
              "text": "compare: 1.25.12 ∈ [1.22.0,1.25.10) → false",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "结果",
                "items": [
                  {
                    "text": "gorm rule skipped",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "不会自动生成 GORM Span。"
          },
          {
            "title": "4. 兼容动作",
            "explain": "可升级规则、改写范围并验证签名。",
            "why": "不要只改版本字符串而跳过行为测试。",
            "focus": 2,
            "code": {
              "label": "检查清单",
              "language": "text",
              "text": "1. inspect API signature\n2. update rule range\n3. run instrumentation test",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "下一步",
                "items": [
                  {
                    "text": "需要规则维护",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "版本边界被显式看见。"
          }
        ],
        "verdict": "兼容性是业务版本、规则范围、工具运行时三者的交集。"
      }
    ],
    "question": {
      "prompt": "为什么工具能运行仍可能没有 GORM Span？",
      "options": [
        "业务版本不在 GORM 规则允许范围内",
        "因为 HTTP 规则会覆盖 GORM",
        "因为 go.mod 不支持日志"
      ],
      "answer": 0,
      "explanation": "匹配会先检查规则条件。"
    }
  }
};
