// 每篇文章使用具体实例；片段和 ID 均按各场景标注。
export const zeroDemos = {
  "observe": {
    "title": "观察 FindRoom(42)",
    "scenario": "直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。",
    "scope": "示意调用和输出；不连接 OTel 后端。",
    "lanes": [
      "业务调用",
      "开始记录",
      "结束记录",
      "看见结果"
    ],
    "terms": [
      {
        "term": "耗时",
        "meaning": "从开始到结束经过的时间。"
      },
      {
        "term": "记录点",
        "meaning": "程序执行时额外留下的一条观察信息。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。",
        "frames": [
          {
            "title": "只有业务调用",
            "explain": "FindRoom 直接返回房间名。此时功能可用，但排查慢请求没有证据。",
            "why": "先把“功能正确”和“过程可见”分开。",
            "focus": 0,
            "code": {
              "label": "业务代码",
              "language": "go",
              "text": "room := FindRoom(42)\nfmt.Println(room)\n// 输出：语聊房间",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "代码",
                "items": [
                  {
                    "text": "FindRoom(42) 被调用",
                    "state": "active"
                  },
                  {
                    "text": "还没有耗时记录",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "结果：语聊房间"
          },
          {
            "title": "记下开始时间",
            "explain": "在调用前增加一个开始记录点，仍然只调用一次原函数。",
            "why": "记录点必须围绕原调用，不能替换业务结果。",
            "focus": 1,
            "code": {
              "label": "加入开始记录",
              "language": "go",
              "text": "start := time.Now()\nroom := FindRoom(42)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "执行",
                "items": [
                  {
                    "text": "start = 10:00:00.100",
                    "state": "new"
                  },
                  {
                    "text": "FindRoom(42) 尚未结束",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "中间状态：正在查房间"
          },
          {
            "title": "调用结束后计算",
            "explain": "函数返回后计算 elapsed，并把结果一起写出。",
            "why": "退出位置才能知道完整耗时和最终结果。",
            "focus": 2,
            "code": {
              "label": "加入结束记录",
              "language": "go",
              "text": "elapsed := time.Since(start)\nlog.Printf(\"FindRoom room=%s elapsed=%s\", room, elapsed)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "记录",
                "items": [
                  {
                    "text": "room=语聊房间",
                    "state": "new"
                  },
                  {
                    "text": "elapsed=12ms",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "新增：FindRoom room=语聊房间 elapsed=12ms"
          },
          {
            "title": "工具要重复做这件事",
            "explain": "如果 HTTP、数据库、消息处理都需要同样的前后动作，手写会重复；插桩工具的目标就是把这类动作接到许多目标函数。",
            "why": "先理解自动化的动机，再读规则和 AST。",
            "focus": 3,
            "code": {
              "label": "观察到的最终效果",
              "language": "text",
              "text": "请求 → 进入记录 → 原函数 → 退出记录 → 响应",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "你能看到",
                "items": [
                  {
                    "text": "业务结果仍是语聊房间",
                    "state": "ok"
                  },
                  {
                    "text": "过程多了耗时证据",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。"
          }
        ],
        "verdict": "结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。"
      }
    ],
    "question": {
      "prompt": "两次查询都返回“语聊房间”，只看这个结果，能知道哪次更慢吗？",
      "options": [
        "不能，还需要记录每次调用的耗时",
        "能，返回文字相同就说明耗时相同",
        "能，多调用一次函数就知道上一次耗时"
      ],
      "answer": 0,
      "explanation": "业务结果和执行耗时是两类信息。",
      "feedback": [
        "对。计时和日志增加的是排查过程的信息。",
        "相同结果可以花不同时间；返回值没有包含耗时。",
        "再次调用得到的是另一次执行，不能还原上一次花了多久。"
      ]
    }
  },
  "packages": {
    "title": "import 写了路径，Go 怎么找到 room 文件夹？",
    "scenario": "main 已经写了 import，为什么还要 go.mod？用同一个 demo/ 目录，看“想用哪个包”和“去哪里找它”怎样接上。",
    "scope": "这是当前模块中导入本地子包的例子；本页只解释这个项目的路径怎样对应目录。",
    "lanes": [
      "目录",
      "package",
      "module",
      "import"
    ],
    "terms": [
      {
        "term": "import 路径",
        "meaning": "例如 example.com/demo/room：声明这个文件要用哪个包，不是相对于 main.go 的磁盘路径。"
      },
      {
        "term": "module 路径",
        "meaning": "例如 example.com/demo：当前这组包共用的路径前缀，由 go.mod 的 module 行声明。"
      },
      {
        "term": "模块根目录",
        "meaning": "放着这份 go.mod 的目录。本例就是 demo/，Go 据此把路径前缀和本地位置对应起来。"
      },
      {
        "term": "package 名",
        "meaning": "例如 package room：这份代码属于哪个包；它不会单独登记完整 import 路径。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "先看真实目录，再看 package、module 路径映射，最后让 main 的 import 找到 room 并调用。",
        "frames": [
          {
            "title": "先看磁盘：room 确实就在旁边",
            "explain": "假设你在 demo/ 目录执行 go run .。main.go 和 room/find.go 都存在，room 文件夹就在当前项目里。问题是：Go 如何知道 import 里的 example.com/demo 指的就是这里？",
            "why": "import 的字符串不是 main.go 旁边的相对文件夹名。Go 不会只看最后一个 room，就去磁盘各处找同名目录。",
            "focus": 0,
            "code": {
              "label": "本例目录：demo/ 是本地文件夹",
              "language": "text",
              "text": "demo/\n├── go.mod\n├── main.go\n└── room/\n    └── find.go",
              "highlight": [
                1,
                4,
                5
              ]
            },
            "panels": [
              {
                "label": "目录",
                "items": [
                  {
                    "text": "demo/ = 一个 module 根",
                    "state": "active"
                  },
                  {
                    "text": "room/ = 一个 package 目录",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "先记住真实位置：demo/room/find.go。接下来给它一个可用于 import 的完整路径。"
          },
          {
            "title": "package room 说明代码属于哪个包",
            "explain": "room/find.go 开头写 package room，并提供 Find 函数。main.go 开头写 package main，表示这里是可执行程序的包。",
            "why": "package room 只给这组代码命名；它没有声明 example.com/demo/room 对应这个目录。只凭 room 这个短名字，无法区分不同项目里的同名包。",
            "focus": 1,
            "code": {
              "label": "room/find.go：本例完整文件",
              "language": "go",
              "text": "package room\n\nfunc Find(id int) string {\n    return \"语聊房间\"\n}",
              "highlight": [
                1,
                3
              ]
            },
            "panels": [
              {
                "label": "身份",
                "items": [
                  {
                    "text": "main.go → main",
                    "state": "new"
                  },
                  {
                    "text": "find.go → room",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "room 包已经提供 Find；还需要让完整 import 路径能找到它。"
          },
          {
            "title": "go.mod 把路径前缀对应到当前目录",
            "explain": "demo/go.mod 写 module example.com/demo。Go 于是知道：在当前模块中，example.com/demo 这个前缀对应放着 go.mod 的 demo/ 目录。后面的 /room 就对应里面的 room/。",
            "why": "main 中的 import 只表达“我要用 example.com/demo/room”。module 声明补上“example.com/demo 指的是当前目录”这条对应关系；同一模块里的 room 不需要再写 require，也不需要先上传到网站。",
            "focus": 2,
            "code": {
              "label": "demo/go.mod：完整文件，两项分行写",
              "language": "go.mod",
              "text": "module example.com/demo\n\ngo 1.25.0",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "解析",
                "items": [
                  {
                    "text": "module 根 = example.com/demo",
                    "state": "ok"
                  },
                  {
                    "text": "room 子路径 = /room",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "路径拆开看：example.com/demo + /room → demo/ + room/ → demo/room/find.go。"
          },
          {
            "title": "现在 main 的 import 才能找到这个 room",
            "explain": "读取 import \"example.com/demo/room\" 时，Go 先认出当前 module 的前缀 example.com/demo，再用剩下的 room 子路径找到 demo/room/。找到源码后，main 才能调用里面导出的 Find 函数。",
            "why": "写下 import 是声明使用关系，构建时还要解析路径、找到源码并检查代码。如果把 module 改成 example.com/other 却不改这条 import，就失去了“这是当前模块里 room/”的对应关系。",
            "focus": 3,
            "code": {
              "label": "demo/main.go：完整文件",
              "language": "go",
              "text": "package main\n\nimport \"example.com/demo/room\"\n\nfunc main() {\n    name := room.Find(42)\n    println(name)\n}",
              "highlight": [
                3,
                6
              ]
            },
            "panels": [
              {
                "label": "依赖箭头",
                "items": [
                  {
                    "text": "main → example.com/demo/room",
                    "state": "new"
                  },
                  {
                    "text": "room.Find(42) 被调用",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "执行 go run .，程序输出：语聊房间。import 要用谁、go.mod 怎样定位、package 提供什么，这三步接上了。"
          }
        ],
        "verdict": "import 写“我要用哪个包”；go.mod 的 module 行帮助 Go 将当前模块的路径对应到本地目录。不是所有 Go 程序都必须先有 go.mod，后面的正文会说明范围。"
      }
    ],
    "question": {
      "prompt": "main 已写 import \"example.com/demo/room\"。哪一步把它对应到本地 demo/room/？",
      "options": [
        "demo/go.mod 声明 module example.com/demo，再拼上 room 子目录",
        "只要目录叫 room，Go 就会在整个磁盘自动找到它",
        "package room 会自动注册所有以 /room 结尾的路径"
      ],
      "answer": 0,
      "explanation": "import 给出要用的包路径；当前模块的 module 声明提供路径前缀与本地目录的对应。package room 负责代码分组。",
      "feedback": [
        "对。module 声明把当前项目的路径前缀与本地目录对应。",
        "Go 不会按 room 这个短名字遍历整个磁盘寻找目录。",
        "package room 给代码分组，不会注册所有以 /room 结尾的导入路径。"
      ]
    }
  },
  "gomod": {
    "title": "同一份 go.mod：我是谁，我需要谁",
    "scenario": "还是 demo 项目。它要使用一个外部 observer 库。先认清当前项目的名字，再看外部依赖怎样写进清单。",
    "scope": "版本和路径为教学示意。",
    "lanes": [
      "import",
      "require",
      "replace",
      "解析结果"
    ],
    "terms": [
      {
        "term": "module",
        "meaning": "声明当前这份代码的模块路径，例如 example.com/demo。"
      },
      {
        "term": "require",
        "meaning": "声明当前项目需要哪个外部模块和版本。被依赖的 observer 本身也是一个模块。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "区分当前模块身份、外部依赖声明和实际函数调用。",
        "frames": [
          {
            "title": "module：给当前项目声明名字",
            "explain": "demo/go.mod 写 module example.com/demo，声明的是 demo 自己。这里还没有增加外部库。",
            "why": "Go 需要知道当前这份代码的路径前缀，才能理解项目内的 import。",
            "focus": 0,
            "code": {
              "label": "demo/go.mod",
              "language": "go.mod",
              "text": "module example.com/demo\n\ngo 1.25.0",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "我是谁：example.com/demo。go 行声明这份模块要求的最低 Go 版本。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "我是谁：example.com/demo。go 行声明这份模块要求的最低 Go 版本。"
          },
          {
            "title": "源码：我现在需要 observer 的一个函数",
            "explain": "main.go 写 import example.com/observer，再调用它的 Record 函数。它是另一份独立提供的代码。",
            "why": "这次使用关系让 observer 成了 demo 的依赖；observer 和 demo 都是模块，“依赖”说的是它们之间的关系。",
            "focus": 1,
            "code": {
              "label": "main.go 的使用片段",
              "language": "go",
              "text": "import \"example.com/observer\"\n\n// 在函数内部调用\nobserver.Record(\"FindRoom\")",
              "highlight": [
                1,
                4
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "当前项目是 demo；它需要的外部模块是 observer。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "当前项目是 demo；它需要的外部模块是 observer。"
          },
          {
            "title": "require：把外部依赖写进清单",
            "explain": "在 demo 的同一份 go.mod 增加 require example.com/observer v1.0.0。这里用假设已发布的库说明版本要求。",
            "why": "module 说当前代码叫什么；require 说它依赖哪份外部代码。两个关键字说的是不同对象。",
            "focus": 2,
            "code": {
              "label": "demo/go.mod 增加依赖行",
              "language": "go.mod",
              "text": "module example.com/demo\n\ngo 1.25.0\n\nrequire example.com/observer v1.0.0",
              "highlight": [
                5
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "没有给 demo 新建第二份 go.mod，只是在原文件增加一行。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "没有给 demo 新建第二份 go.mod，只是在原文件增加一行。"
          },
          {
            "title": "清单准备好，也不会自动执行 Record",
            "explain": "有了依赖清单，Go 才能进一步找到代码并构建。真正打印记录，还需要程序运行并调用 Record。",
            "why": "配置文件中的 require 是声明，不是“现在调用这个函数”的命令。依赖声明、编译、执行是接下来的三个动作。",
            "focus": 3,
            "code": {
              "label": "把配置和执行分别读出来",
              "language": "text",
              "text": "module example.com/demo    → 当前项目是谁\nrequire observer v1.0.0    → 需要哪份外部代码（路径在此简写）\nobserver.Record(...)      → 程序运行时要执行的调用",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "先会读“我是谁、我需要谁”。本地源码从哪里取，在第 6 步单独解释。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "先会读“我是谁、我需要谁”。本地源码从哪里取，在第 6 步单独解释。"
          }
        ],
        "verdict": "module 声明当前项目；require 声明外部依赖。外部库也是模块，“依赖”是项目之间的使用关系。"
      }
    ],
    "question": {
      "prompt": "module example.com/demo 和 require example.com/observer v1.0.0，分别说的是谁？",
      "options": [
        "demo 是当前项目，observer 是它需要的外部模块",
        "两行都是给当前项目换名字",
        "写下 require 就会立刻运行 observer.Record"
      ],
      "answer": 0,
      "explanation": "module 管自己的身份，require 声明需要的外部模块。",
      "feedback": [
        "对。同一份清单同时说明当前项目和它的依赖。",
        "只有 module 声明当前项目的路径；require 说的是外部代码。",
        "require 不执行函数。它只是构建之前要读的依赖声明。"
      ]
    }
  },
  "build": {
    "title": "两段时间：构建与运行",
    "scenario": "同一份 FindRoom，先经过构建工具，再在服务启动后处理请求。",
    "scope": "命令是教学简化；不执行 Go。",
    "lanes": [
      "源码",
      "构建",
      "二进制",
      "运行请求"
    ],
    "terms": [
      {
        "term": "构建",
        "meaning": "把源码检查、编译并组合成可执行程序。"
      },
      {
        "term": "可执行文件",
        "meaning": "构建出来的程序；./demo 表示启动当前目录里的 demo。"
      },
      {
        "term": "运行",
        "meaning": "启动程序，真正执行其中的代码。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "同一份 FindRoom，先经过构建工具，再在服务启动后处理请求。",
        "frames": [
          {
            "title": "源码还只是文字",
            "explain": "main.go 中有 FindRoom，但电脑还没有可运行产物。",
            "why": "插桩工具要在编译输入阶段介入。",
            "focus": 0,
            "code": {
              "label": "源文件",
              "language": "go",
              "text": "func FindRoom(id int) string {\n    return \"语聊房间\"\n}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "当前",
                "items": [
                  {
                    "text": "main.go 存在",
                    "state": "active"
                  },
                  {
                    "text": "可执行文件不存在",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "状态：尚未运行"
          },
          {
            "title": "普通 go build",
            "explain": "Go 根据原来的源码生成可执行程序 demo。",
            "why": "先有基线，才能比较插桩后发生什么。",
            "focus": 1,
            "code": {
              "label": "普通构建",
              "language": "sh",
              "text": "go build -o demo-service .",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "构建产物",
                "items": [
                  {
                    "text": "demo-service 二进制",
                    "state": "new"
                  },
                  {
                    "text": "FindRoom 原样进入",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "产物：demo-service"
          },
          {
            "title": "otel 工具接管构建",
            "explain": "工具在构建前准备依赖并让编译器看到额外输入。",
            "why": "规则和 hook 必须在这一阶段接入。",
            "focus": 1,
            "code": {
              "label": "插桩构建",
              "language": "sh",
              "text": "otel go build -o demo-service .",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "新增",
                "items": [
                  {
                    "text": "规则命中 net/http",
                    "state": "new"
                  },
                  {
                    "text": "生成 hook import",
                    "state": "new"
                  },
                  {
                    "text": "编译继续",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "产物：包含业务与观察代码的 demo-service"
          },
          {
            "title": "启动后才产生记录",
            "explain": "程序启动后，走到查房间的代码时，加入的观察动作才真正执行。",
            "why": "不要把构建成功误认为已经有运行时 Trace。",
            "focus": 3,
            "code": {
              "label": "真实请求",
              "language": "text",
              "text": "启动 demo-service\n请求 /room/42\nFindRoom → hook → 返回",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "运行时",
                "items": [
                  {
                    "text": "构建阶段已结束",
                    "state": "muted"
                  },
                  {
                    "text": "请求产生运行记录",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：构建时接入，运行时执行。"
          }
        ],
        "verdict": "结论：构建时接入，运行时执行。"
      }
    ],
    "question": {
      "prompt": "修改规则后老进程会自动更新吗？",
      "options": [
        "不会，需要重新构建并启动新产物",
        "会，规则文件会被进程每秒读取",
        "只有响应头会更新"
      ],
      "answer": 0,
      "explanation": "这是构建时插桩；规则变化要进入新的二进制。",
      "feedback": [
        "对。新的观察动作要编入新程序，再运行新产物。",
        "这套工具在构建时接入代码，旧进程不会每秒重读规则文件。",
        "响应头也是程序运行时的行为，不会绕过重新构建这一步自动改变。"
      ]
    }
  },
  "hooks": {
    "title": "为 FindRoom 加入前后动作",
    "scenario": "规则找到 FindRoom 后，进入 hook 建立观察状态，退出 hook 写出结果。",
    "scope": "教学模型：下面用普通 Go 函数解释前后动作，省略真实 hook 签名与连接过程；后续源码页再看 LoongSuite 的实现。",
    "lanes": [
      "规则定位",
      "进入 hook",
      "原函数",
      "退出 hook"
    ],
    "terms": [
      {
        "term": "规则",
        "meaning": "给工具的说明：要找哪个函数、在前后接入哪些动作。"
      },
      {
        "term": "hook",
        "meaning": "在目标调用前后额外执行的函数。本例用 before 和 after 表示。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "规则找到 FindRoom 后，进入 hook 建立观察状态，退出 hook 写出结果。",
        "frames": [
          {
            "title": "规则先描述目标",
            "explain": "先明确要观察的是 FindRoom。before 和 after 是两段额外的记录代码，不是原来查房间的业务。",
            "why": "工具不能凭空知道哪些函数值得改。",
            "focus": 0,
            "code": {
              "label": "给工具的说明 · 不是可直接使用的规则配置",
              "language": "text",
              "text": "找到：FindRoom 函数\n进入时：调用 before\n退出时：调用 after",
              "highlight": [
                1,
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "匹配目标",
                "items": [
                  {
                    "text": "Function = FindRoom",
                    "state": "new"
                  },
                  {
                    "text": "before / after hook",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "规则只是一张说明"
          },
          {
            "title": "进入 hook",
            "explain": "运行路径先执行 before，记录开始时间。",
            "why": "进入动作能捕获调用参数和开始时刻。",
            "focus": 1,
            "code": {
              "label": "进入前的额外函数 · 教学示意",
              "language": "go",
              "text": "func before(id int) {\n    log.Printf(\"开始查询房间 %d\", id)\n}",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "时间线",
                "items": [
                  {
                    "text": "before 执行",
                    "state": "active"
                  },
                  {
                    "text": "原函数等待中",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "记录：start FindRoom"
          },
          {
            "title": "原函数照常计算",
            "explain": "FindRoom 仍返回房间名。",
            "why": "观察动作不能吞掉或重复业务调用。",
            "focus": 2,
            "code": {
              "label": "原函数",
              "language": "go",
              "text": "func FindRoom(id int) string {\n    return \"语聊房间\"\n}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "业务",
                "items": [
                  {
                    "text": "FindRoom(42)",
                    "state": "active"
                  },
                  {
                    "text": "返回语聊房间",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "业务结果：语聊房间"
          },
          {
            "title": "退出 hook 收尾",
            "explain": "查询返回后，after 写出结束记录。这里先观察执行顺序；计算耗时还需要保存开始时间，后面再学。",
            "why": "统一退出位置比只在最后一行追加更能覆盖 early return；真实桥接还有 panic 语义。",
            "focus": 3,
            "code": {
              "label": "返回后的额外函数 · 教学示意",
              "language": "go",
              "text": "func after(room string) {\n    log.Printf(\"查询结束，结果 %s\", room)\n}",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "时间线",
                "items": [
                  {
                    "text": "start FindRoom",
                    "state": "ok"
                  },
                  {
                    "text": "end FindRoom",
                    "state": "ok"
                  },
                  {
                    "text": "返回值未被替换",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：规则找位置，hook 做动作，改写把二者接上。"
          }
        ],
        "verdict": "结论：规则找位置，hook 做动作，改写把二者接上。"
      }
    ],
    "question": {
      "prompt": "只写“进入 FindRoom 时调用 before”这份说明，运行中的旧程序会自动多出记录吗？",
      "options": [
        "不会，还需要工具接入调用并重新构建程序",
        "会，Go 会自动把说明当成函数执行",
        "会，函数名字一样就能自动连上"
      ],
      "answer": 0,
      "explanation": "说明告诉工具做什么，实际接入后的代码才会执行。",
      "feedback": [
        "对。规则、接入代码和运行程序是连续的几步。",
        "这份文字是给工具读的说明，不是正在执行的 Go 函数。",
        "名字相同只够描述目标，还需要把额外函数接到实际调用路径里。"
      ]
    }
  },
  "deps": {
    "title": "多了一行记录调用，为什么就编译不过了？",
    "scenario": "用一个独立的 demo 小项目模拟业务：FindRoom(42) 原来能返回房间名。现在给它增加一行 observer.Record，沿着新增代码看问题怎样发生、怎样修好。",
    "scope": "教学模型：observer 是单独提供的示例库。这里只解释普通 Go 的编译依赖，不是 LoongSuite 的真实生成代码，也没有修改 业务项目。",
    "lanes": [
      "原业务",
      "新增调用",
      "查明错误",
      "补齐依赖",
      "构建和运行"
    ],
    "terms": [
      {
        "term": "observer.Record",
        "meaning": "示例库里的一段 Go 代码，调用它会打印“观察记录: FindRoom”。它只写日志，不创建 Trace，也不计算耗时。"
      },
      {
        "term": "业务的一份 go.mod",
        "meaning": "demo/ 目录里原有的文件。本例只给这份文件补充依赖，不在业务目录里再建一份。"
      },
      {
        "term": "外部库",
        "meaning": "独立提供、放在业务目录之外的代码。本例源码已经准备在相邻的 observer/ 目录。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "从失败到修好",
        "summary": "先增加一行调用，看见真实构建错误，再补充同一份业务 go.mod，最后区分构建与运行。",
        "frames": [
          {
            "title": "原程序：只查房间，能正常运行",
            "explain": "FindRoom(42) 只返回“语聊房间”。这里没有调用 observer，因此构建时也不需要找这个外部库。",
            "why": "只有程序实际需要的包，才需要为这次构建准备。先记住原业务结果，修好以后还要对照它。",
            "focus": 0,
            "code": {
              "label": "业务 main.go 中的函数 · 节选",
              "language": "go",
              "text": "func FindRoom(id int) string {\n    return \"语聊房间\"\n}",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "运行原程序，输出：语聊房间。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "运行原程序，输出：语聊房间。"
          },
          {
            "title": "新需求：调用 observer.Record 记录一次执行",
            "explain": "我们给函数增加 observer.Record(\"FindRoom\")，并在文件开头 import 它。observer 是外部库的包名，Record 是其中的函数名；这个调用会打印一条记录。",
            "why": "写出一个调用，还需要有实现这个函数的源码。那份源码已经单独提供，但业务的依赖清单还没登记它。",
            "focus": 1,
            "code": {
              "label": "新增的 import 与函数调用 · 节选",
              "language": "go",
              "text": "import \"example.com/observer\"\n\nfunc FindRoom(id int) string {\n    observer.Record(\"FindRoom\")\n    return \"语聊房间\"\n}",
              "highlight": [
                1,
                4
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "新问题只有一个：业务构建怎样找到 observer 的代码？",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "新问题只有一个：业务构建怎样找到 observer 的代码？"
          },
          {
            "title": "先构建一次：错误明确指向缺少 observer",
            "explain": "执行 go build，Go 看到了新 import，却没有找到业务模块声明的 observer 依赖。下面是同一组教学代码真实产生的错误关键部分。",
            "why": "错误发生在生成程序时，不是处理请求时。FindRoom 原来的代码没消失，整个程序因为新依赖没有准备好而构建失败。",
            "focus": 2,
            "code": {
              "label": "真实 Go 错误 · 省略文件行号和提示命令",
              "language": "text",
              "text": "$ go build -o demo .\nno required module provides package example.com/observer",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "没有成功生成新程序，所以还谈不上运行时写记录。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "没有成功生成新程序，所以还谈不上运行时写记录。"
          },
          {
            "title": "补同一份 go.mod：声明需要谁、到哪里找",
            "explain": "在 demo 原来的 go.mod 中补两行：require 声明需要 observer；replace 把它指向已经准备好的 ../observer 源码目录。这里只改这一份业务清单。",
            "why": "本例的 example.com/observer 是虚构地址，不能从网上下载；因此明确使用本地源码。真实 LoongSuite 会按实际位置准备它自己的观测库，精确路径留到源码页。",
            "focus": 3,
            "code": {
              "label": "demo/go.mod · 本例完整文件",
              "language": "go.mod",
              "text": "module example.com/demo\n\ngo 1.24.0\n\nrequire example.com/observer v0.0.0\nreplace example.com/observer => ../observer",
              "highlight": [
                5,
                6
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "再次 go build 成功。它完成了编译，还没有执行 Record。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "再次 go build 成功。它完成了编译，还没有执行 Record。"
          },
          {
            "title": "最后才运行：记录和原来的房间名都出现",
            "explain": "执行刚刚构建出来的程序，FindRoom 内的新调用才真正运行。先打印观察记录，再返回房间名，由 main 打印。",
            "why": "补依赖让新代码能参与构建；实际调用让它在运行时执行。原来的查询结果仍然是“语聊房间”。",
            "focus": 4,
            "code": {
              "label": "运行生成的程序 · 真实教学实验输出",
              "language": "text",
              "text": "$ ./demo\n观察记录: FindRoom\n语聊房间",
              "highlight": [
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "多了一条记录，原业务仍返回同一个房间名。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "多了一条记录，原业务仍返回同一个房间名。"
          }
        ],
        "verdict": "本页只解释一件事：工具增加了对外部代码的调用，就要同时让业务构建找得到那份代码。改的是原有业务 go.mod；构建成功之后，运行时才会执行新增动作。"
      }
    ],
    "question": {
      "prompt": "现在 go build 已经成功，但还没运行 ./demo，会出现“观察记录”吗？",
      "options": [
        "不会，Record 要等程序运行并走到这一行才执行",
        "会，require 一写进去就会打印记录",
        "会，编译器会把 FindRoom 查询执行一遍"
      ],
      "answer": 0,
      "explanation": "构建负责生成程序，运行负责执行函数。",
      "feedback": [
        "对。接下来运行 ./demo，才会执行 observer.Record。",
        "require 是依赖声明，不是函数调用。刚刚的构建没有打印观察记录。",
        "编译会检查并生成函数代码，不会按普通业务请求执行 FindRoom。"
      ]
    }
  },
  "trace": {
    "title": "把同一次请求的三张操作记录连起来",
    "scenario": "同一条查房请求先进入服务，再查房间，最后查数据库。用请求编号和每个动作的编号，把三张记录连成一棵树。",
    "scope": "ID 是短示意值；不代表真实后端查询。",
    "lanes": [
      "请求",
      "父 Span",
      "子 Span",
      "导出"
    ],
    "terms": [
      {
        "term": "Trace ID",
        "meaning": "同一条请求链共用的编号。本页用 A 示意。"
      },
      {
        "term": "Span ID",
        "meaning": "某一个操作自己的编号。本页用 01、02、03 示意。"
      },
      {
        "term": "Parent / 父操作",
        "meaning": "直接引发当前操作的上一操作。用它的 Span ID 表示。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "用一条请求链编号和每个动作的编号，理解父子关系。",
        "frames": [
          {
            "title": "收到一次查房请求，给整条链一个编号",
            "explain": "把这次查房请求相关的记录放在一起，统一标成 A。这个共同编号叫 Trace ID。",
            "why": "服务里同时有许多请求，需要先知道哪些记录属于同一条请求链。",
            "focus": 0,
            "code": {
              "label": "一条请求的共同编号",
              "language": "text",
              "text": "请求：查房间 42\n本条请求链的 Trace ID：A",
              "highlight": [
                2
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "后面每个操作都沿用 A，表示属于这一条链。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "后面每个操作都沿用 A，表示属于这一条链。"
          },
          {
            "title": "入口操作有自己的编号 01",
            "explain": "服务处理请求的这段操作叫一个 Span。它也有自己的编号，叫 Span ID。",
            "why": "A 用来区分整条请求链；01 用来区分链中的某个具体操作。",
            "focus": 1,
            "code": {
              "label": "第一张操作记录",
              "language": "text",
              "text": "操作：服务处理请求\nTrace ID：A\nSpan ID：01",
              "highlight": [
                2,
                3
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "同一张记录同时带整条链的编号 A 和自己的编号 01。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "同一张记录同时带整条链的编号 A 和自己的编号 01。"
          },
          {
            "title": "查房间是第二个操作，记录是谁叫了它",
            "explain": "入口操作 01 调用 FindRoom。查房间这张记录沿用 Trace ID A，自己的 Span ID 是 02，父操作写 01。",
            "why": "只有共同编号 A，还不知道谁调用谁。父操作编号把直接调用关系补上。",
            "focus": 2,
            "code": {
              "label": "第二张操作记录",
              "language": "text",
              "text": "操作：FindRoom\nTrace ID：A\nSpan ID：02\nParent：01",
              "highlight": [
                2,
                3,
                4
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "它属于请求链 A，并且是入口操作 01 的下一层。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "它属于请求链 A，并且是入口操作 01 的下一层。"
          },
          {
            "title": "数据库查询再接下一层，形成调用树",
            "explain": "FindRoom 02 调用数据库，数据库操作编号为 03，父操作是 02。现在三张记录能够按调用顺序连接。",
            "why": "各动作共享 Trace ID，同时保留各自的 Span ID 和父操作。后面的 context 课程会解释这些信息怎样随调用传递。",
            "focus": 3,
            "code": {
              "label": "把三张记录按父操作连起来",
              "language": "text",
              "text": "请求链 A\n└─ 01 服务处理请求\n   └─ 02 FindRoom       Parent=01\n      └─ 03 数据库查询  Parent=02",
              "highlight": [
                2,
                3,
                4
              ]
            },
            "panels": [
              {
                "label": "这一步得到什么",
                "items": [
                  {
                    "text": "同一 Trace 中多个 Span 表示多个动作；是否重复，要看是不是同一个动作被记录了两次。",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "同一 Trace 中多个 Span 表示多个动作；是否重复，要看是不是同一个动作被记录了两次。"
          }
        ],
        "verdict": "Trace ID 把记录归到同一条请求链；Span ID 区分动作；Parent 把直接调用关系接起来。"
      }
    ],
    "question": {
      "prompt": "数据库由 FindRoom 02 调用，数据库记录的 Parent 应该填什么？",
      "options": [
        "02，因为它直接由 FindRoom 调用",
        "A，因为这是整条请求链的编号",
        "01，因为所有动作都直接挂到入口"
      ],
      "answer": 0,
      "explanation": "父操作记录直接调用者的 Span ID。",
      "feedback": [
        "对。共同的 Trace ID 仍然是 A；Parent 则是直接调用者 02。",
        "A 是 Trace ID，只能说明属于同一条链，不能说明直接由哪个动作调用。",
        "本例入口 01 调用了 FindRoom，数据库由 FindRoom 02 调用，所以应挂在 02 下面。"
      ]
    }
  }
};

export const chapterDemos = {
  "orientation": {
    "title": "观察 FindRoom(42)",
    "scenario": "直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。",
    "scope": "示意调用和输出；不连接 OTel 后端。",
    "lanes": [
      "业务调用",
      "开始记录",
      "结束记录",
      "看见结果"
    ],
    "terms": [
      {
        "term": "耗时",
        "meaning": "从开始到结束经过的时间。"
      },
      {
        "term": "记录点",
        "meaning": "程序执行时额外留下的一条观察信息。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。",
        "frames": [
          {
            "title": "只有业务调用",
            "explain": "FindRoom 直接返回房间名。此时功能可用，但排查慢请求没有证据。",
            "why": "先把“功能正确”和“过程可见”分开。",
            "focus": 0,
            "code": {
              "label": "业务代码",
              "language": "go",
              "text": "room := FindRoom(42)\nfmt.Println(room)\n// 输出：语聊房间",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "代码",
                "items": [
                  {
                    "text": "FindRoom(42) 被调用",
                    "state": "active"
                  },
                  {
                    "text": "还没有耗时记录",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "结果：语聊房间"
          },
          {
            "title": "记下开始时间",
            "explain": "在调用前增加一个开始记录点，仍然只调用一次原函数。",
            "why": "记录点必须围绕原调用，不能替换业务结果。",
            "focus": 1,
            "code": {
              "label": "加入开始记录",
              "language": "go",
              "text": "start := time.Now()\nroom := FindRoom(42)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "执行",
                "items": [
                  {
                    "text": "start = 10:00:00.100",
                    "state": "new"
                  },
                  {
                    "text": "FindRoom(42) 尚未结束",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "中间状态：正在查房间"
          },
          {
            "title": "调用结束后计算",
            "explain": "函数返回后计算 elapsed，并把结果一起写出。",
            "why": "退出位置才能知道完整耗时和最终结果。",
            "focus": 2,
            "code": {
              "label": "加入结束记录",
              "language": "go",
              "text": "elapsed := time.Since(start)\nlog.Printf(\"FindRoom room=%s elapsed=%s\", room, elapsed)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "记录",
                "items": [
                  {
                    "text": "room=语聊房间",
                    "state": "new"
                  },
                  {
                    "text": "elapsed=12ms",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "新增：FindRoom room=语聊房间 elapsed=12ms"
          },
          {
            "title": "工具要重复做这件事",
            "explain": "如果 HTTP、数据库、消息处理都需要同样的前后动作，手写会重复；插桩工具的目标就是把这类动作接到许多目标函数。",
            "why": "先理解自动化的动机，再读规则和 AST。",
            "focus": 3,
            "code": {
              "label": "观察到的最终效果",
              "language": "text",
              "text": "请求 → 进入记录 → 原函数 → 退出记录 → 响应",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "你能看到",
                "items": [
                  {
                    "text": "业务结果仍是语聊房间",
                    "state": "ok"
                  },
                  {
                    "text": "过程多了耗时证据",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。"
          }
        ],
        "verdict": "结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。"
      }
    ],
    "question": {
      "prompt": "为什么先讲 FindRoom，而不是直接讲 Trace？",
      "options": [
        "因为要先看到“观察已有代码”的问题",
        "因为 FindRoom 会自动创建真实 Span",
        "因为普通函数不需要编译"
      ],
      "answer": 0,
      "explanation": "它只负责建立动机；真实 Span 的创建还要经过运行时库。"
    }
  },
  "go-foundations": {
    "title": "让函数带着 context 工作",
    "scenario": "FindRoom 收到请求上下文后，把它交给下一个查询操作。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "参数",
      "context",
      "返回",
      "检查"
    ],
    "terms": [
      {
        "term": "context.Context",
        "meaning": "Go 里显式传递取消、截止时间和请求范围数据的接口。"
      },
      {
        "term": "error",
        "meaning": "函数返回的错误结果。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "FindRoom 收到请求上下文后，把它交给下一个查询操作。",
        "frames": [
          {
            "title": "起点：普通函数",
            "explain": "先写普通函数，调用者没有办法传递请求取消。",
            "why": "取消信号必须从入口传到下一层，只有房间 ID 无法表达请求生命周期。",
            "focus": 0,
            "code": {
              "label": "普通函数",
              "language": "go",
              "text": "func FindRoom(id int) (string, error)\n\nroom, err := FindRoom(42)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "FindRoom(42)",
                    "state": "active"
                  },
                  {
                    "text": "没有 ctx 参数",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "结果能返回，但请求边界没有进入函数"
          },
          {
            "title": "增加 ctx 参数",
            "explain": "ctx 是调用者交接请求信息的明确通道。",
            "why": "ctx 参数使调用者能明确交接超时、取消和父 Span 所在上下文。",
            "focus": 1,
            "code": {
              "label": "签名变化",
              "language": "text",
              "text": "func FindRoom(ctx context.Context, id int) (string, error)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "ctx 由调用者传入",
                    "state": "new"
                  },
                  {
                    "text": "id 仍是业务参数",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "函数现在知道请求何时取消"
          },
          {
            "title": "调用者沿链传递",
            "explain": "只在入口拿到 ctx 还不够，下一层也要继续传。",
            "why": "中间某一层换成 Background，会丢掉显式交接的请求信息。",
            "focus": 2,
            "code": {
              "label": "链路",
              "language": "go",
              "text": "ctx := r.Context()\nroom, err := FindRoom(ctx, 42)\nquery(ctx, room)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "HTTP ctx",
                    "state": "active"
                  },
                  {
                    "text": "FindRoom ctx",
                    "state": "new"
                  },
                  {
                    "text": "query ctx",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "同一个请求上下文贯穿调用"
          },
          {
            "title": "核验：自检",
            "explain": "检查 error 和 ctx 是否真的被使用。",
            "why": "代码里有 ctx 参数还不够，调用的下层必须实际响应取消。",
            "focus": 3,
            "code": {
              "label": "自检",
              "language": "text",
              "text": "go vet ./...\n测试取消 ctx 后 query 是否停止",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "签名编译通过",
                    "state": "ok"
                  },
                  {
                    "text": "取消行为有测试",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：context 是显式参数，不是自动附着在任意 goroutine 上。"
          }
        ],
        "verdict": "结论：context 是显式参数，不是自动附着在任意 goroutine 上。"
      }
    ],
    "question": {
      "prompt": "Go context 最稳妥的交接位置是什么？",
      "options": [
        "作为函数参数或任务字段显式传递",
        "依赖全局变量",
        "只在 worker 创建时读取一次"
      ],
      "answer": 0,
      "explanation": "显式交接才能知道任务属于哪个请求。"
    }
  },
  "build": {
    "title": "用 toolexec 看一次真实编译",
    "scenario": "go build 会调用 compiler、linker；toolexec 是一个包装入口。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "go build",
      "toolexec",
      "compiler",
      "linker"
    ],
    "terms": [
      {
        "term": "toolexec",
        "meaning": "让 Go 在调用底层工具前经过一个包装程序。"
      },
      {
        "term": "compiler",
        "meaning": "把 Go 源文件编译成目标文件。"
      },
      {
        "term": "linker",
        "meaning": "把各目标文件连接成程序。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "go build 会调用 compiler、linker；toolexec 是一个包装入口。",
        "frames": [
          {
            "title": "起点：普通命令",
            "explain": "普通 build 直接调用底层编译工具，插桩工具看不到每次编译输入。",
            "why": "普通构建先理解清楚，才能定位 LoongSuite 在哪里加入加工。",
            "focus": 0,
            "code": {
              "label": "普通命令",
              "language": "sh",
              "text": "go build -o app .",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "go 命令",
                    "state": "active"
                  },
                  {
                    "text": "compiler 直接被调用",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "程序构建成功，但没有额外观测"
          },
          {
            "title": "加入包装器",
            "explain": "toolexec 接到 compiler/linker 命令后可以记录或转发。",
            "why": "toolexec 是 Go 暴露的入口，不用修改 Go 编译器二进制也能接到工具动作。",
            "focus": 1,
            "code": {
              "label": "命令",
              "language": "sh",
              "text": "go build -toolexec=/tmp/otel-tool -o app .",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "otel-tool 收到命令",
                    "state": "new"
                  },
                  {
                    "text": "原参数仍需转发",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "构建链多了一个可观察入口"
          },
          {
            "title": "包装器转发",
            "explain": "包装器必须保留退出码和参数，才能不破坏构建。",
            "why": "编译器收到的参数和失败状态是构建契约，包装器必须保留。",
            "focus": 2,
            "code": {
              "label": "转发",
              "language": "go",
              "text": "otel-tool compile args...\n→ compile args...\notel-tool link args...\n→ link args...",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "compile 记录",
                    "state": "new"
                  },
                  {
                    "text": "link 原样转发",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "Go 仍能生成 app"
          },
          {
            "title": "核验：日志",
            "explain": "用日志确认版本探测和实际命令都经过包装器。",
            "why": "只有看到真实 compile/link 经过包装器，才证明接入发生了。",
            "focus": 3,
            "code": {
              "label": "日志",
              "language": "text",
              "text": "-V=full\ncompile ...\nlink ...",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "版本探测保留 stdout",
                    "state": "ok"
                  },
                  {
                    "text": "失败退出码可复现",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：toolexec 是编译期入口，不是运行时 Span。"
          }
        ],
        "verdict": "结论：toolexec 是编译期入口，不是运行时 Span。"
      }
    ],
    "question": {
      "prompt": "toolexec 最不该忘记转发什么？",
      "options": [
        "底层工具参数和退出码",
        "只转发工具名字",
        "把所有 stdout 丢掉"
      ],
      "answer": 0,
      "explanation": "参数和退出码决定原始构建是否仍然正确。"
    }
  },
  "ast": {
    "title": "把 HTTP 方法定位成语法节点",
    "scenario": "规则要找 net/http 的 RoundTrip，而不是把注释和字符串里的文字一起改掉。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "源码文本",
      "AST",
      "receiver",
      "生成源码"
    ],
    "terms": [
      {
        "term": "FuncDecl",
        "meaning": "表示一个函数声明的语法节点。"
      },
      {
        "term": "receiver",
        "meaning": "方法声明绑定的接收者，如 *Transport。"
      },
      {
        "term": "语法节点",
        "meaning": "源码结构中的一个可定位对象。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "规则要找 net/http 的 RoundTrip，而不是把注释和字符串里的文字一起改掉。",
        "frames": [
          {
            "title": "起点：原始源码",
            "explain": "文本搜索会误命中注释、字符串和同名函数。",
            "why": "注释中的 RoundTrip 和真实方法声明不是一回事，文本搜索无法稳定区分。",
            "focus": 0,
            "code": {
              "label": "原始源码",
              "language": "go",
              "text": "// RoundTrip 只是注释\nfunc (t *Transport) RoundTrip(r *http.Request) (*http.Response, error) {\n    return t.next(r)\n}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "注释文字",
                    "state": "muted"
                  },
                  {
                    "text": "目标方法",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "需要按函数和 receiver 匹配"
          },
          {
            "title": "解析成树",
            "explain": "AST/DST 能分别看到注释、函数名和 receiver 节点。",
            "why": "语法树把名字、receiver 和函数体变成不同节点，便于精确选中。",
            "focus": 1,
            "code": {
              "label": "树节点",
              "language": "text",
              "text": "File\n└── FuncDecl\n    ├── Recv: *Transport\n    └── Name: RoundTrip",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "Name=RoundTrip",
                    "state": "new"
                  },
                  {
                    "text": "Recv=*Transport",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "目标身份明确"
          },
          {
            "title": "只改目标节点",
            "explain": "结构化改写能在函数体开头插入 hook。",
            "why": "只在选中的函数体插入动作，才能避免误改注释或其他同名函数。",
            "focus": 2,
            "code": {
              "label": "生成片段",
              "language": "go",
              "text": "func (t *Transport) RoundTrip(...) {\n    hookEnter(t, r)\n    return t.next(r)\n}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "hookEnter 新增",
                    "state": "new"
                  },
                  {
                    "text": "注释未变",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "生成代码仍保持方法 receiver"
          },
          {
            "title": "核验：验证",
            "explain": "重新格式化并编译生成文件。",
            "why": "看起来正确的生成文本仍可能类型不对，需要编译和行为检查。",
            "focus": 3,
            "code": {
              "label": "验证",
              "language": "text",
              "text": "gofmt -w generated.go\ngo test ./...",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "语法通过",
                    "state": "ok"
                  },
                  {
                    "text": "行为测试",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：树改写的第一证据是生成源码和编译结果。"
          }
        ],
        "verdict": "结论：树改写的第一证据是生成源码和编译结果。"
      }
    ],
    "question": {
      "prompt": "为什么要同时核对 Function 和 ReceiverType？",
      "options": [
        "同名自由函数与方法可能是不同目标",
        "receiver 只影响 Span 名称",
        "linker 会自动判断"
      ],
      "answer": 0,
      "explanation": "receiver 是方法身份的一部分。"
    }
  },
  "otel": {
    "title": "从 Start 到 exporter",
    "scenario": "FindRoom 创建一个 child Span，但 SDK、采样和 exporter 决定它是否最终可查询。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "API",
      "SDK",
      "采样",
      "导出"
    ],
    "terms": [
      {
        "term": "Tracer",
        "meaning": "创建 Span 的 API 对象。"
      },
      {
        "term": "Sampler",
        "meaning": "决定是否记录和采样。"
      },
      {
        "term": "Exporter",
        "meaning": "把结束的 Span 发送到后端。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "FindRoom 创建一个 child Span，但 SDK、采样和 exporter 决定它是否最终可查询。",
        "frames": [
          {
            "title": "起点：父上下文",
            "explain": "hook 需要一个已有请求 ctx 来创建 child。",
            "why": "Tracer 提供创建 Span 的入口；携带父 Span 的 ctx 决定从哪条链继续。",
            "focus": 0,
            "code": {
              "label": "父上下文",
              "language": "go",
              "text": "ctx := request.Context()\ntracer := otel.Tracer(\"demo-service\")",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "ctx 含 server Span",
                    "state": "active"
                  },
                  {
                    "text": "tracer 来自 API",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "具备创建 child 的输入"
          },
          {
            "title": "Start child",
            "explain": "Start 从 ctx 读取父 Span，生成新 SpanID。",
            "why": "Start 返回的新 ctx 含新 Span，下一层要用它才能成为当前操作的子节点。",
            "focus": 1,
            "code": {
              "label": "创建",
              "language": "text",
              "text": "ctx, span := tracer.Start(ctx, \"FindRoom\")\ndefer span.End()",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "TraceID 沿用",
                    "state": "ok"
                  },
                  {
                    "text": "SpanID 新建",
                    "state": "new"
                  },
                  {
                    "text": "Parent = server",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "FindRoom 是 server 的孩子"
          },
          {
            "title": "采样决定记录",
            "explain": "有效 ID 不代表一定 Recording。",
            "why": "有 TraceID 只是上下文有效；是否被 SDK 记录、是否导出还有其他条件。",
            "focus": 2,
            "code": {
              "label": "状态",
              "language": "go",
              "text": "span.SpanContext().IsValid() = true\nspan.IsRecording() = true  // 取决于 sampler",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "有效上下文",
                    "state": "ok"
                  },
                  {
                    "text": "是否记录",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "采样通过才进入 processor"
          },
          {
            "title": "核验：导出",
            "explain": "内存 exporter 直接检查树，避免只看日志。",
            "why": "后端不通时，内存 exporter 可以先证明 Span 本身和父子关系是否正确。",
            "focus": 3,
            "code": {
              "label": "导出",
              "language": "text",
              "text": "exported[\"FindRoom\"].ParentSpanID == server.SpanID",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "parent 正确",
                    "state": "ok"
                  },
                  {
                    "text": "exporter 收到",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：TraceID、Recording 和后端入库是三层证据。"
          }
        ],
        "verdict": "结论：TraceID、Recording 和后端入库是三层证据。"
      }
    ],
    "question": {
      "prompt": "有 TraceID 但查询不到 Span，先查什么？",
      "options": [
        "采样、processor/exporter 和查询范围",
        "立刻换 TraceID",
        "只改 Span 名"
      ],
      "answer": 0,
      "explanation": "这些层都可能让上下文存在但后端暂时没有数据。"
    }
  },
  "context": {
    "title": "任务交接和消息传播",
    "scenario": "预创建 worker 收到 VoiceTask；只有把 ctx 放进任务或 carrier，消费端才能接上生产端。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "请求入口",
      "任务字段",
      "消息 carrier",
      "消费端"
    ],
    "terms": [
      {
        "term": "carrier",
        "meaning": "承载 trace 字段的 HTTP header 或消息属性。"
      },
      {
        "term": "Inject",
        "meaning": "把当前上下文写进 carrier。"
      },
      {
        "term": "Extract",
        "meaning": "从 carrier 恢复上下文。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "预创建 worker 收到 VoiceTask；只有把 ctx 放进任务或 carrier，消费端才能接上生产端。",
        "frames": [
          {
            "title": "起点：生产请求",
            "explain": "worker pool 早于请求创建，不能依赖创建时的闭包上下文。",
            "why": "worker 比请求早创建，创建协程这一刻还不知道未来要处理谁的任务。",
            "focus": 0,
            "code": {
              "label": "生产请求",
              "language": "go",
              "text": "ctx := r.Context()\ntask := VoiceTask{RoomID:42}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "请求 ctx",
                    "state": "active"
                  },
                  {
                    "text": "task 没有 ctx",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "worker 无法知道任务来自哪个请求"
          },
          {
            "title": "任务显式带 ctx",
            "explain": "任务交接点是上下文传播的边界。",
            "why": "每个任务各自携带 ctx，才能把任务与正确请求关联。",
            "focus": 1,
            "code": {
              "label": "任务",
              "language": "text",
              "text": "task := VoiceTask{RoomID:42, Ctx:ctx}\nqueue <- task",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "Ctx 随任务进入队列",
                    "state": "new"
                  },
                  {
                    "text": "worker 已预创建",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "交接证据存在"
          },
          {
            "title": "消息跨进程用 carrier",
            "explain": "跨进程不能传 Go context 对象，要传字符串字段。",
            "why": "另一个进程不能读取本进程的 Go 对象，所以要把上下文编码成消息字段。",
            "focus": 2,
            "code": {
              "label": "消息属性",
              "language": "json",
              "text": "{ \"room_id\":42, \"traceparent\":\"00-aaaa...-bbbb...-01\" }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "producer Inject",
                    "state": "ok"
                  },
                  {
                    "text": "consumer Extract",
                    "state": "new"
                  },
                  {
                    "text": "也可使用 b3 单头或 X-B3-* 多头，取决于注册的传播器",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "消费端可从消息属性恢复远程父级"
          },
          {
            "title": "核验：对照",
            "explain": "在普通 SDK 或无可继承 GLS 的 worker 中，对照显式 ctx 与 Background；插桩环境还要检查运行时桥是否介入。",
            "why": "同一 Trace 可以有很多节点；必须检查直接 parent，才能证明交接点没有接错。",
            "focus": 3,
            "code": {
              "label": "对照",
              "language": "text",
              "text": "// 普通 OTel SDK / worker 无可继承 GLS 的对照\nworker(job.Ctx): parent=request\nworker(Background()): new root",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "显式交接",
                    "state": "ok"
                  },
                  {
                    "text": "Background 新根",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "结论：GLS 只能算补救机制，任务和消息边界仍要有 carrier。"
          }
        ],
        "verdict": "同进程任务可携带 ctx；跨进程消息携带字符串字段。两处边界都要验证 TraceID 与直接父 SpanID。"
      }
    ],
    "question": {
      "prompt": "预创建 worker 为什么不能自动继承每个请求？",
      "options": [
        "它创建时还没有当前请求，必须在提交任务时交接",
        "Go 会自动把所有请求广播给 worker",
        "只要 TraceID 相同就不需要 parent"
      ],
      "answer": 0,
      "explanation": "worker 的生命周期早于请求；交接点才知道任务属于哪个请求。"
    }
  },
  "architecture": {
    "title": "从 CLI 走到规则加载",
    "scenario": "用户输入 otel go build，命令层把参数交给 preprocess，再把规则交给 instrument。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "CLI",
      "Preprocess",
      "Rule",
      "Instrument"
    ],
    "terms": [
      {
        "term": "CLI",
        "meaning": "命令行入口，负责解析用户输入。"
      },
      {
        "term": "pipeline",
        "meaning": "按顺序连接多个处理阶段。"
      },
      {
        "term": "bundle",
        "meaning": "一次编译目标匹配到的一组规则。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "用户输入 otel go build，命令层把参数交给 preprocess，再把规则交给 instrument。",
        "frames": [
          {
            "title": "起点：用户输入",
            "explain": "命令行首先只有字符串参数。",
            "why": "命令输入只表明目标；还要确认工具如何把目标传给每个阶段。",
            "focus": 0,
            "code": {
              "label": "用户输入",
              "language": "sh",
              "text": "otel go build -o demo-service .",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "build",
                    "state": "active"
                  },
                  {
                    "text": "-o demo-service",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "CLI 解析出构建动作和参数"
          },
          {
            "title": "进入 Preprocess",
            "explain": "先准备 go.mod、依赖和规则，避免编译器看不到新增 import。",
            "why": "新增观察代码也有依赖，提前准备才能让后续编译找到它。",
            "focus": 1,
            "code": {
              "label": "前置阶段",
              "language": "text",
              "text": "precheck → updateGoMod →\nnewDeps/syncDeps/matchRules",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "go.mod 检查",
                    "state": "new"
                  },
                  {
                    "text": "规则匹配",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "得到最终 bundles"
          },
          {
            "title": "交给 Instrument",
            "explain": "toolexec 看到具体编译命令后才改写目标函数。",
            "why": "只有具体编译动作才知道本次处理哪个包、哪些源文件。",
            "focus": 2,
            "code": {
              "label": "编译阶段",
              "language": "go",
              "text": "runBuildWithToolexec(...)\n→ instrument package net/http",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "compile command",
                    "state": "new"
                  },
                  {
                    "text": "AST/DST 改写",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "生成改写后的目标包"
          },
          {
            "title": "核验：日志",
            "explain": "按日志的 PhaseTimer 对齐阶段。",
            "why": "阶段日志把失败缩小到准备、改写或真实编译，避免从头猜。",
            "focus": 3,
            "code": {
              "label": "日志",
              "language": "text",
              "text": "Preprocess: ...\nInstrument: ...\nBuild completed successfully",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "阶段顺序",
                    "state": "ok"
                  },
                  {
                    "text": "最终构建",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：每层有自己的输入输出，排障时先确定卡在哪层。"
          }
        ],
        "verdict": "结论：每层有自己的输入输出，排障时先确定卡在哪层。"
      }
    ],
    "question": {
      "prompt": "规则匹配发生在哪一段？",
      "options": [
        "Preprocess 依据 dry build 依赖查找规则",
        "运行时收到请求后才匹配",
        "OTLP exporter 里匹配"
      ],
      "answer": 0,
      "explanation": "规则匹配是编译前准备的一部分。"
    }
  },
  "rules": {
    "title": "版本范围决定是否尝试插桩",
    "scenario": "gorm 规则要求 gorm 版本落在范围内；版本不匹配时不是“hook 运行失败”，而是规则不会被选中。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "规则 JSON",
      "版本比较",
      "命中",
      "跳过"
    ],
    "terms": [
      {
        "term": "版本范围",
        "meaning": "规则允许处理的依赖版本区间。"
      },
      {
        "term": "命中",
        "meaning": "当前包和版本都满足规则条件。"
      },
      {
        "term": "跳过",
        "meaning": "条件不满足，因此不加入 bundle。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "gorm 规则要求 gorm 版本落在范围内；版本不匹配时不是“hook 运行失败”，而是规则不会被选中。",
        "frames": [
          {
            "title": "起点：依赖",
            "explain": "业务实际 gorm 版本先从构建依赖中得到。",
            "why": "规则根据本次实际构建版本判断，不能只看项目 README 中的版本说明。",
            "focus": 0,
            "code": {
              "label": "依赖",
              "language": "text",
              "text": "gorm.io/gorm v1.25.12",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "ImportPath = gorm.io/gorm",
                    "state": "active"
                  },
                  {
                    "text": "Version = 1.25.12",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "拿到真实版本"
          },
          {
            "title": "读取规则范围",
            "explain": "规则文件的范围是 [1.22.0,1.25.10)。",
            "why": "左边方括号包含 1.22.0，右边圆括号不包含 1.25.10，更不包含 1.25.12。",
            "focus": 1,
            "code": {
              "label": "规则 JSON",
              "language": "json",
              "text": "{ \"Version\":\"[1.22.0,1.25.10)\",\n  \"Function\":\"Open\" }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "下界满足",
                    "state": "ok"
                  },
                  {
                    "text": "上界 1.25.10 不包含",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "1.25.12 超出上界"
          },
          {
            "title": "不生成 gorm bundle",
            "explain": "匹配阶段跳过比强行改写更安全。",
            "why": "跳过这条规则不会自动阻止别的包插桩；构建成功也不能证明它被选中了。",
            "focus": 2,
            "code": {
              "label": "匹配结果",
              "language": "go",
              "text": "match(gorm v1.25.12) = no rule\nbundles = []",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "gorm hook",
                    "state": "muted"
                  },
                  {
                    "text": "其他命中规则仍保留",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "不会得到 gorm 插桩 Span"
          },
          {
            "title": "核验：排查",
            "explain": "升级版本后先检查规则范围和生成日志。",
            "why": "改版本范围只放开匹配条件，不能证明新版本内部函数仍兼容。",
            "focus": 3,
            "code": {
              "label": "排查",
              "language": "text",
              "text": "日志：skip gorm: version not in range\n验证：go list -m gorm.io/gorm",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "版本证据",
                    "state": "ok"
                  },
                  {
                    "text": "规则证据",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：扩展规则范围要配合签名和行为测试，不能只改数字。"
          }
        ],
        "verdict": "结论：扩展规则范围要配合签名和行为测试，不能只改数字。"
      }
    ],
    "question": {
      "prompt": "版本不匹配时最直接的结果是什么？",
      "options": [
        "规则被跳过，不生成该 bundle",
        "一定运行时 panic",
        "自动降级到任意旧版本"
      ],
      "answer": 0,
      "explanation": "匹配阶段会跳过不满足范围的规则。"
    }
  },
  "hooks": {
    "title": "OnEnter / OnExit 的调用约定",
    "scenario": "net/http RoundTrip 的 hook 在进入时拿到 Transport 和 request，退出时拿到 response 与 error。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "规则签名",
      "OnEnter",
      "原调用",
      "OnExit"
    ],
    "terms": [
      {
        "term": "OnEnter",
        "meaning": "目标函数开始时调用的 hook。"
      },
      {
        "term": "OnExit",
        "meaning": "目标函数返回后调用的 hook。"
      },
      {
        "term": "CallContext",
        "meaning": "插桩桥传入的调用信息对象，不是 context.Context。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "net/http RoundTrip 的 hook 在进入时拿到 Transport 和 request，退出时拿到 response 与 error。",
        "frames": [
          {
            "title": "起点：http 规则",
            "explain": "规则先指定目标方法和 hook 名称。",
            "why": "规则把目标函数与观察函数连接；之后签名必须与生成桥一致。",
            "focus": 0,
            "code": {
              "label": "http 规则",
              "language": "json",
              "text": "{ \"Function\":\"RoundTrip\", \"ReceiverType\":\"\\\\*Transport\",\n  \"OnEnter\":\"clientOnEnter\", \"OnExit\":\"clientOnExit\" }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "RoundTrip",
                    "state": "active"
                  },
                  {
                    "text": "*Transport",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "目标身份和 hook 名称确定"
          },
          {
            "title": "进入签名",
            "explain": "OnEnter 要看到请求，才能创建客户端 Span 和注入 header。",
            "why": "进入时需要原方法的 receiver 与参数，才能观察对应请求。",
            "focus": 1,
            "code": {
              "label": "OnEnter",
              "language": "text",
              "text": "func clientOnEnter(call api.CallContext,\n    t *http.Transport, req *http.Request)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "CallContext",
                    "state": "new"
                  },
                  {
                    "text": "request",
                    "state": "new"
                  },
                  {
                    "text": "transport",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "入口可以读取 request"
          },
          {
            "title": "退出签名",
            "explain": "OnExit 接收返回值；receiver 不会再次作为第二个参数出现。",
            "why": "退出时关注返回值，当前形状不会把 receiver 再作为返回参数传一次。",
            "focus": 2,
            "code": {
              "label": "OnExit",
              "language": "go",
              "text": "func clientOnExit(call api.CallContext,\n    res *http.Response, err error)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "response",
                    "state": "new"
                  },
                  {
                    "text": "error",
                    "state": "new"
                  },
                  {
                    "text": "没有重复 receiver",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "可结束 Span 并标记错误"
          },
          {
            "title": "核验：检查",
            "explain": "编译和实际请求验证参数顺序。",
            "why": "日志出现不代表签名和退出行为都正确，要对真实调用结果做断言。",
            "focus": 3,
            "code": {
              "label": "检查",
              "language": "text",
              "text": "go test ./pkg/rules/http/...\nRoundTrip GET → enter → exit",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "签名匹配",
                    "state": "ok"
                  },
                  {
                    "text": "请求结果保留",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：hook 契约是规则开发的硬边界。"
          }
        ],
        "verdict": "结论：hook 契约是规则开发的硬边界。"
      }
    ],
    "question": {
      "prompt": "CallContext 是什么？",
      "options": [
        "插桩桥提供的调用信息对象",
        "Go 标准库的 context.Context",
        "HTTP response header"
      ],
      "answer": 0,
      "explanation": "两者职责不同，不能把 CallContext 当请求上下文。"
    }
  },
  "runtime": {
    "title": "GLS 不是 Go 自动继承",
    "scenario": "预创建 worker 使用 Background 时，GLS 可能提供额外关联，但显式 ctx 才是任务交接的清晰证据。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "请求 ctx",
      "GLS",
      "worker",
      "parent"
    ],
    "terms": [
      {
        "term": "GLS",
        "meaning": "LoongSuite runtime 维护的额外 goroutine 关联机制。"
      },
      {
        "term": "Background",
        "meaning": "没有父值的根 context。"
      },
      {
        "term": "parent",
        "meaning": "当前 Span 的直接上级。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "预创建 worker 使用 Background 时，GLS 可能提供额外关联，但显式 ctx 才是任务交接的清晰证据。",
        "frames": [
          {
            "title": "起点：入口",
            "explain": "请求入口有 server Span，但 worker 在请求前已经创建。",
            "why": "worker 的创建时间与请求不同；创建时继承覆盖不了未来每个任务。",
            "focus": 0,
            "code": {
              "label": "入口",
              "language": "go",
              "text": "// 服务启动时（先发生）\nworkerPool.Start()\n\n// 请求到来时（后发生）\nctx, server := tracer.Start(r.Context(), \"request\")",
              "highlight": [
                2,
                5
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "server Span",
                    "state": "active"
                  },
                  {
                    "text": "worker 已存在",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "创建时不能把未来请求绑定进去"
          },
          {
            "title": "提交任务时保存 ctx",
            "explain": "提交时才知道这项任务属于哪个请求。",
            "why": "提交任务时才知道它属于谁，这里是把 ctx 放进任务的时机。",
            "focus": 1,
            "code": {
              "label": "任务字段",
              "language": "text",
              "text": "jobs <- Job{Ctx:ctx, RoomID:42}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "Job.Ctx=request",
                    "state": "new"
                  },
                  {
                    "text": "GLS 可作补充",
                    "state": "muted"
                  }
                ]
              }
            ],
            "result": "worker 读取到正确父级"
          },
          {
            "title": "对照 Background",
            "explain": "没有可继承的 GLS 上下文时，Background 不含显式父 Span，通常成为新根；插桩后还要核实 GLS 是否参与。",
            "why": "Background 没有显式父 Span；额外运行时机制是否补上关联必须另外验证。",
            "focus": 2,
            "code": {
              "label": "两条路径",
              "language": "go",
              "text": "// 普通 OTel SDK / 没有可继承的 GLS 上下文\nchild(job.Ctx): parent=server\nchild(context.Background()): parent=<root>",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "显式 ctx",
                    "state": "ok"
                  },
                  {
                    "text": "Background",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "两种 parent 不同"
          },
          {
            "title": "核验：验证",
            "explain": "用导出 Span 的 ParentSpanID 检查，不只打印 TraceID。",
            "why": "相同 TraceID 不能区分并列节点和正确父子，检查 parent 才能看出接错。",
            "focus": 3,
            "code": {
              "label": "验证",
              "language": "text",
              "text": "assert child.ParentSpanID == server.SpanID",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "parent 对齐",
                    "state": "ok"
                  },
                  {
                    "text": "同 TraceID 不能替代 parent",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "结论：GLS 不是 Go 自带的上下文传播；任务交接仍需显式适配。"
          }
        ],
        "verdict": "结论：GLS 不是 Go 自带的上下文传播；任务交接仍需显式适配。"
      }
    ],
    "question": {
      "prompt": "GLS 能否覆盖所有 worker 实现？",
      "options": [
        "不能，显式任务交接更可靠",
        "能，Go runtime 自动读取任意队列",
        "只要 TraceID 相同就能覆盖"
      ],
      "answer": 0,
      "explanation": "不同池和队列的交接点不同，不能假设运行时机制覆盖全部实现。"
    }
  },
  "compatibility": {
    "title": "已有 OTel 与自动 hook 去重",
    "scenario": "服务已经有 otelhttp client Span，自动 net/http hook 需要识别已有 Span，避免一次调用生成两个相同入口。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。 本例是需要二开与验证的兼容策略，不是上游默认去重保证。",
    "lanes": [
      "已有 Span",
      "自动 hook",
      "去重判断",
      "保留一条"
    ],
    "terms": [
      {
        "term": "去重",
        "meaning": "同一操作只保留一个目标 Span。"
      },
      {
        "term": "入口 Span",
        "meaning": "代表一次 HTTP 请求或调用的顶层操作。"
      },
      {
        "term": "provider",
        "meaning": "创建和管理 Tracer 的实现来源。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "服务已经有 otelhttp client Span，自动 net/http hook 需要识别已有 Span，避免一次调用生成两个相同入口。",
        "frames": [
          {
            "title": "起点：已有埋点",
            "explain": "手动 otelhttp 已经在 request ctx 中创建 client Span。",
            "why": "同一调用已有 otelhttp client Span，兼容目标是保留它并避免重复创建。",
            "focus": 0,
            "code": {
              "label": "已有埋点",
              "language": "go",
              "text": "ctx, span := otelhttpTracer.Start(ctx, \"HTTP GET\")\nreq = req.WithContext(ctx)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "client Span 已存在",
                    "state": "active"
                  },
                  {
                    "text": "TraceID = aaaa…",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "自动 hook 不应再创建同层入口"
          },
          {
            "title": "自动 hook 先检查",
            "explain": "用经过验证的作用域、标记或包装关系识别：当前 Span 是否就是这次 otelhttp 客户端操作。",
            "why": "有效 Span 可能是 server/internal 父节点，只有确认同一 client 操作才应去重。",
            "focus": 1,
            "code": {
              "label": "去重判断",
              "language": "text",
              "text": "// 兼容策略伪代码：辅助识别函数需要自己实现\nif isSameOtelhttpClientOperation(req) {\n    skipAutoClientSpan = true\n} else {\n    startAutoClientSpan()\n}",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "确认是同一次 otelhttp client 操作",
                    "state": "new"
                  },
                  {
                    "text": "自动创建跳过",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "同一调用只保留手动入口"
          },
          {
            "title": "仍可做补充动作",
            "explain": "保留已有客户端 Span；谁负责注入请求头、结束 Span 和处理错误，需要按已有包装器与兼容策略验证。",
            "why": "跳过重复创建后仍要确保原包装器完成传播和生命周期，避免少记录或断链。",
            "focus": 2,
            "code": {
              "label": "结果",
              "language": "go",
              "text": "request server span\n└─ existing otelhttp client span\n   duplicate auto client span: skipped",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "重复入口",
                    "state": "muted"
                  },
                  {
                    "text": "传播 header",
                    "state": "ok"
                  },
                  {
                    "text": "业务结果",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "目标：同一 HTTP 操作只有一个 client Span，合法父子 Span 仍保留。"
          },
          {
            "title": "核验：测试",
            "explain": "用同一请求比较 Span 数量、parent 和 header。",
            "why": "Span 数量、直接 parent、传播头和业务结果一起通过，才能证明兼容。",
            "focus": 3,
            "code": {
              "label": "测试",
              "language": "text",
              "text": "断言：server span 保留\n断言：本次 HTTP call 恰好一个 client span\n断言：下游 parent == client SpanID\n断言：响应/错误语义保持",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "去重",
                    "state": "ok"
                  },
                  {
                    "text": "传播",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：去重需要检查上下文和入口职责，不是简单关闭所有自动埋点。"
          }
        ],
        "verdict": "结论：去重需要检查上下文和入口职责，不是简单关闭所有自动埋点。"
      }
    ],
    "question": {
      "prompt": "去重的目标是什么？",
      "options": [
        "避免同一 HTTP 操作重复生成入口 Span",
        "让所有 Span 都变成同一个 SpanID",
        "关闭整个 OTel provider"
      ],
      "answer": 0,
      "explanation": "要保留一条正确入口，同时继续完成必要传播和业务记录。"
    }
  },
  "debugging": {
    "title": "从“没有 Span”定位层次",
    "scenario": "一次 /profile 请求没有查询到 Trace；按构建、运行、导出、查询四层排查。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "构建",
      "运行",
      "导出",
      "查询"
    ],
    "terms": [
      {
        "term": "采样",
        "meaning": "决定某条 Span 是否被记录或保留。"
      },
      {
        "term": "exporter",
        "meaning": "发送 Span 的组件。"
      },
      {
        "term": "查询范围",
        "meaning": "日志系统查询使用的时间、服务和条件。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "一次 /profile 请求没有查询到 Trace；按构建、运行、导出、查询四层排查。",
        "frames": [
          {
            "title": "起点：构建证据",
            "explain": "先确认当前二进制是否真由插桩构建产生。",
            "why": "二进制没有包含 hook 时，调整 exporter 不会让目标调用突然被记录。",
            "focus": 0,
            "code": {
              "label": "构建证据",
              "language": "text",
              "text": "build log\nmatched rule: net/http.RoundTrip\nRun Instrument",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "规则命中",
                    "state": "active"
                  },
                  {
                    "text": "Instrument 阶段",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "构建层暂时通过"
          },
          {
            "title": "运行证据",
            "explain": "请求必须真正经过目标入口，且 hook 没有 panic。",
            "why": "命中的规则只有在真实调用经过目标函数时才会执行。",
            "focus": 1,
            "code": {
              "label": "请求日志",
              "language": "text",
              "text": "request /profile\nenter hook\nexit hook status=200",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "入口执行",
                    "state": "new"
                  },
                  {
                    "text": "业务返回",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "运行层暂时通过"
          },
          {
            "title": "导出证据",
            "explain": "Span 结束后还要经过 processor/exporter；短进程、采样和地址都可能影响入库。",
            "why": "Span 结束、采样、处理器和发送链路都影响后端能否看到数据。",
            "focus": 2,
            "code": {
              "label": "发送",
              "language": "go",
              "text": "span.End()\nBatchSpanProcessor → OTLP exporter\nexport result: accepted",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "结束",
                    "state": "ok"
                  },
                  {
                    "text": "export accepted",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "后端应能收到，但还需查询"
          },
          {
            "title": "核验：查询",
            "explain": "最后固定 TraceID、service.name 和时间范围查询。",
            "why": "查询用错时间或服务也会像没有数据；固定同一组 ID 能排除查询偏差。",
            "focus": 3,
            "code": {
              "label": "查询",
              "language": "text",
              "text": "trace_id=aaaa…\nservice.name=demo-service-test\nrange=±5m",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "ID 一致",
                    "state": "ok"
                  },
                  {
                    "text": "范围正确",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：没有 Span 不是一个原因，要逐层找证据。"
          }
        ],
        "verdict": "结论：没有 Span 不是一个原因，要逐层找证据。"
      }
    ],
    "question": {
      "prompt": "日志有 TraceID 但后端为空，最不该先做什么？",
      "options": [
        "立刻生成一个新 TraceID 覆盖原 ID",
        "检查采样和 exporter",
        "核对查询时间和 service.name"
      ],
      "answer": 0,
      "explanation": "换 ID 会破坏原请求的关联，不能替代排查。"
    }
  },
  "capstone": {
    "title": "为已有 OTel 服务加一条安全规则",
    "scenario": "给已有手动 HTTP 埋点的服务增加一个数据库规则，要求先验证版本、入口和去重。",
    "scope": "示例输出和代码为教学快照；需要运行时请使用对应实验。",
    "lanes": [
      "现状盘点",
      "规则",
      "兼容",
      "验证"
    ],
    "terms": [
      {
        "term": "回归测试",
        "meaning": "确认新改动没有破坏原有行为。"
      },
      {
        "term": "边界",
        "meaning": "自动插桩无法替你交接 ctx 的地方。"
      },
      {
        "term": "证据",
        "meaning": "可重复观察的日志、Span 树或测试结果。"
      }
    ],
    "cases": [
      {
        "id": "normal",
        "label": "一个完整例子",
        "summary": "给已有手动 HTTP 埋点的服务增加一个数据库规则，要求先验证版本、入口和去重。",
        "frames": [
          {
            "title": "起点：现状表",
            "explain": "先列出现有 otelgorm/手动 Span 与目标数据库版本。",
            "why": "先盘点已有埋点和实际版本，才能知道是缺少观察还是已经重复。",
            "focus": 0,
            "code": {
              "label": "现状表",
              "language": "text",
              "text": "existing: otelgorm enabled\nmanual tracer: db.query\ngorm: v1.25.12\nrule range: [1.22.0,1.25.10)",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输入",
                "items": [
                  {
                    "text": "已有埋点",
                    "state": "active"
                  },
                  {
                    "text": "版本超范围",
                    "state": "error"
                  }
                ]
              }
            ],
            "result": "不能直接宣布兼容"
          },
          {
            "title": "规则先做最小改动",
            "explain": "先决定规则是否能命中，再决定如何去重。",
            "why": "扩展范围让规则有机会命中；函数签名和行为是否兼容还需要实测。",
            "focus": 1,
            "code": {
              "label": "方案",
              "language": "json",
              "text": "{ \"Version\":\"[1.22.0,1.26.0)\",\n  \"OnExit\":\"afterGormOpen\" }",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "变化",
                "items": [
                  {
                    "text": "范围变更需评审",
                    "state": "new"
                  },
                  {
                    "text": "hook 签名需编译",
                    "state": "active"
                  }
                ]
              }
            ],
            "result": "规则准备进入验证"
          },
          {
            "title": "兼容策略",
            "explain": "保留指标和必要旧逻辑，跳过重复数据库入口；不要同时安装两套同层 server 入口。",
            "why": "保留原有指标与必要埋点时，应给同一操作明确唯一的记录职责。",
            "focus": 2,
            "code": {
              "label": "链路",
              "language": "go",
              "text": "request Span\n└─ one DB entry span\n   └─ SQL attributes",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "输出",
                "items": [
                  {
                    "text": "重复 DB span",
                    "state": "muted"
                  },
                  {
                    "text": "已有 metrics",
                    "state": "ok"
                  },
                  {
                    "text": "parent 正确",
                    "state": "new"
                  }
                ]
              }
            ],
            "result": "职责没有重叠"
          },
          {
            "title": "核验：验收清单",
            "explain": "测试命中、Span 数、parent、响应头和任务边界。",
            "why": "可重复的对照与回滚步骤，才能把一次试验变成可维护的二开改动。",
            "focus": 3,
            "code": {
              "label": "验收清单",
              "language": "text",
              "text": "version hit ✓\none entry span ✓\nparent/span IDs ✓\nworker ctx handoff documented ✓",
              "highlight": [
                1
              ]
            },
            "panels": [
              {
                "label": "验收",
                "items": [
                  {
                    "text": "可回滚",
                    "state": "ok"
                  },
                  {
                    "text": "证据已保存",
                    "state": "ok"
                  }
                ]
              }
            ],
            "result": "结论：二开不是只改一条规则，要把版本、旧埋点、边界和证据一起锁定。"
          }
        ],
        "verdict": "结论：二开不是只改一条规则，要把版本、旧埋点、边界和证据一起锁定。"
      }
    ],
    "question": {
      "prompt": "二开完成的最低证据是什么？",
      "options": [
        "规则命中、行为不重复、父子关系和回滚路径都有记录",
        "只看构建成功",
        "只看到一个 TraceID"
      ],
      "answer": 0,
      "explanation": "构建成功不证明运行兼容；同 TraceID 也不证明 parent 正确。"
    }
  }
};
