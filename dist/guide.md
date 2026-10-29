# LoongSuite Go：从原理到二开

基于 v1.15.0 / cac400935add57d8219122ba32857b8f55ac6eb1。网页含交互图解；本文是便于离线检索的正文。


# 从零 1：先有一个普通函数

## 函数能正常返回，为什么还需要“插桩”？

假设直播页面要查房间。下面的 `FindRoom` 返回了房间名，说明功能成功了。但只看返回值，你不知道这一次调用花了多久、卡在哪一步。排查慢请求时，这些信息才是你需要的。

最直接的办法是在调用前记时间，调用后算耗时，再写一条记录。“埋点”或“插桩”，在这里就是给原有程序增加这类观察动作。业务仍然查房间，额外的代码负责记录它怎么执行。

- **观测**：收集程序执行的信息，帮助回答慢在哪里、错在哪里。
- **插桩 / instrumentation**：在程序执行的某些位置加入观察动作。这个词本身不限定是手写还是工具生成。

### 只有业务：能得到结果

```go
func FindRoom(id int) string {
    return "语聊房间"
}

room := FindRoom(42)
```

### 手动观察：还想知道用了多久

```go
start := time.Now()
room := FindRoom(42)
fmt.Println("FindRoom 用时", time.Since(start))
```

两段均为阅读片段，省略所在函数和 import；这里用计时说明动机，还没有使用 LoongSuite 或链路追踪库。

自问：这段观察代码改变了什么？原来的查询还会执行吗？

参考解释：增加了执行信息。示意代码仍调用一次 FindRoom，业务结果继续来自原函数。插桩是否保留原有行为，后面要靠前后对照验证。

带走一句话：先记住目的：我们想观察已有程序的执行。暂时不需要认识任何探针内部函数。


# 从零 2：代码为什么会分成包和模块

## 看到 import、package、module，它们分别管什么？

一个函数写不下整个项目，我们会把相关代码放在一起。Go 把一起编译的一组源文件组织成一个“包”（package）；通常对应一个目录。`import` 表示当前文件要使用另一个包。

你可能会问：main 都写了 `import "example.com/demo/room"`，为什么还要 go.mod？因为这里写的是包的完整路径，不是“找 main.go 旁边的 room 文件夹”。Go 还需要知道 `example.com/demo` 对应本地哪个目录。

本例的 `demo/go.mod` 声明 `module example.com/demo`，于是这个前缀对应放着 go.mod 的 `demo/`。完整路径减去这个前缀，剩下 `room`，便找到 `demo/room/`。这是当前模块里的包，不需要先把 example.com/demo 发布到网站，也不需要为 room 另写 require。

模块（module）还负责把一组相关包及其外部依赖版本组织在一起。本例的模块里有 main 和 room 两个包。文件夹名 demo 是磁盘位置；example.com/demo 是声明的模块路径，两者不是必须同名。

没有 go.mod 并不是任何 Go 代码都不能运行。比如只使用标准库的单文件，可以直接运行。本例要从一个项目目录导入 room 子包，所以用 go.mod 说明这个项目的路径。先记住这个用途即可。

- **package（包）**：组织 Go 代码的单位。你调用的函数属于某个包。
- **module（模块）**：管理一组包及其依赖版本的单位，由 go.mod 声明。
- **import（导入）**：在一个 Go 文件里声明要使用哪个包。标准库 fmt、net/http 也通过它导入。

### 目录：一个模块，两个包

```text
demo/
├── go.mod         # module example.com/demo
├── main.go        # package main
└── room/
    └── find.go    # package room
```

### main.go 使用 room 包：阅读示意

```go
package main

import "example.com/demo/room"

func main() {
    name := room.Find(42)
    println(name)
}
```

路径解析：example.com/demo/room → 当前模块 example.com/demo + 子目录 room → demo/room/。目录不用叫 example.com，也不用在本地创建 demo/example.com/demo/room。完整 room/find.go 见上面的第 2 段。依据：Go 官方《How to Write Go Code》。

自问：如果把 go.mod 改成 module example.com/other，main 还 import example.com/demo/room，它会自动认出旁边的 room 吗？

参考解释：在本例没有额外依赖或替换配置时不会。旧 import 已经不属于当前模块的路径前缀。应把 import 一起改成 example.com/other/room；不能只凭包的短名字 room 自动定位。

带走一句话：import 声明要用哪个包；module 声明帮助把当前模块的路径对应到本地目录；package 给代码分组。


# 从零 3：go.mod 到底在告诉 Go 什么

## import 写了包路径，Go 去哪里找哪一版代码？

使用自己模块里的包时，Go 先识别 module 行声明的路径前缀，再沿剩下的子目录找到源码。使用别人发布的包时，还需要确定它属于哪个模块、使用哪一版。`go.mod` 是这份模块说明和依赖清单。

`require` 声明所需模块及其版本要求；它不是一条函数调用，也不等于把清单上的所有代码都编进程序。源码中的 import 和后续构建决定实际需要哪些包。

最后记住边界：`go.mod` 只是告诉 Go 模块和依赖怎么解析；它不会自动给函数增加记录动作。记录动作要等后面讲构建工具时再接入。

- **依赖（dependency）**：当前代码要用到的其他代码。
- **require**：在 go.mod 里声明一个模块的版本要求；最终选用版本还要结合其他模块的要求。

### 先认三行：项目名、语言版本、外部依赖

```go.mod
module example.com/demo

go 1.25.0

require example.com/observer v1.0.0
```

### 翻译成人话

```text
module：我的模块叫 example.com/demo。
go：构建这个模块所需的最低 Go 版本。
require：我需要外部 observer 模块。
import：仍然写在 .go 文件里，表示实际使用哪个包。
```

example.com/observer 是教学名称。replace 会在后面的“补齐构建依赖”例子里单独出现；现在先把 require 看成“项目需要谁”。

自问：把库名加进 require，就已经在业务函数前后自动记录了吗？

参考解释：没有。require 解决代码依赖的声明问题，自动记录还需要实际的观察代码，以及把观察代码接入函数执行的改写步骤。

带走一句话：先分开两件事：go.mod 帮助找到代码，调用和插桩决定代码怎样执行。


# 从零 4：编译时和运行时是两段时间

## otel go build 做的事，什么时候才会影响请求？

你写的是 `.go` 文本，电脑运行的是构建出来的可执行程序。`go build` 会组织包的编译，再把程序需要的部分连接成可执行文件。我们先把“准备和生成程序”的这段叫构建阶段。

执行这个文件、启动服务、接收请求，是之后的运行阶段。LoongSuite 的 `otel` 工具先在构建时参与准备依赖、修改编译输入；生成后的程序在运行时才执行观察动作。

因此要分清两类错误：构建时“找不到包”，程序还没有生成；程序已运行却没有打印记录，则要检查记录动作有没有执行。先判断问题发生在哪个时刻。

- **构建**：把源码检查、编译并组合成可执行程序。
- **可执行文件**：构建出来的程序，例如 demo。./demo 表示启动当前目录里的这个程序。
- **运行**：启动生成的程序，让它真正执行代码。

### 普通 Go：构建，再启动

```sh
go build -o demo .
./demo
```

### LoongSuite：让工具参与构建，再启动产物

```sh
otel go build -o demo .
./demo
```

以上是命令形态示意，当前步骤不要求安装工具。实际工具版本、示例目录与验证命令见动手实验 04。

自问：业务二进制已经生成，之后又改了一条插桩规则，老进程会自动用上吗？

参考解释：这套构建时插桩不会把新规则热更新进老二进制。需要用新规则重新构建产物，再运行新产物。

带走一句话：构建工具负责“让代码接进去”，运行中的程序负责“真正执行并记录”。


# 从零 5：工具怎样替我加上前后动作

## 不逐个手写计时，工具怎么知道改哪里、加什么？

回到第一步：手写计时很容易，但每个 HTTP、数据库调用都手写，维护起来很重。工具把这个工作拆成两份：规则告诉它“找谁”，观察函数告诉它“找到以后做什么”。

观察函数通常叫 hook（钩子）：目标函数进入时或退出时调用它。例如进入时记时间，退出时记录结果。hook 仍然是 Go 代码，不是 JSON 里的一段说明。

工具找到目标函数后，把这些额外调用写入交给编译器的代码。于是运行新程序时，原函数前后就多了观察动作。规则说明“找谁”，hook 函数里才有真正要执行的代码。

- **规则（rule）**：告诉工具要找哪个包、哪个函数。
- **hook（钩子）**：找到目标后额外执行的 Go 函数，例如记录开始和结束。

### 原来的执行路径

```text
调用 FindRoom
    → 执行原函数体
    → 返回结果
```

### 插桩后的路径：概念简图

```text
调用 FindRoom
    → 执行进入 hook
    → 执行原函数体
    → 执行退出 hook
    → 返回结果
```

这是帮助理解的正常执行路径。上游还用跳板代码组织调用，支持跳过原函数等能力；它的真实实现放在后续源码页，不能用本简图代替。

自问：只写了“找到 FindRoom 后记录一下”，却没有提供记录函数，也没有重新构建，会自动打印记录吗？

参考解释：不会。说明只告诉工具要做什么；还需要可执行的记录函数、把调用接进代码，并重新构建和运行。

带走一句话：规则负责找位置，hook 负责做动作，构建工具把额外调用接进去。


# 从零 6：为什么还要“补上依赖”

## 给业务加了一行观察调用，为什么还要改 go.mod？

继续用教学项目 demo：原来 `FindRoom(42)` 返回“语聊房间”；现在在这个函数里面加一行 `observer.Record("FindRoom")`，让它先打印一条执行记录，再返回原来的房间名。

observer 是另一份已经准备好的小库，放在 demo 目录外。只写 import 还不够：demo 原来的 go.mod 没有声明需要这个库，Go 不知道怎样把这份代码接进来，构建就失败了。上面的报错对应的就是这个缺口。

修复时，修改的是 demo 原来那一份 go.mod。require 说明“我需要 observer”，本例的 replace 说明“源码就在相邻的 ../observer”。业务项目 也可以只有自己的一份 go.mod；外部库的文件不等于业务仓库多出一份 go.mod。

回到 LoongSuite：工具自动加进来的观察代码，同样需要找到它使用的外部库。因此构建工具除了接入调用，还要补齐构建依赖。本页的小程序只解释这个理由；真实规则的代码组织与准备次数，在源码章节再读。

- **业务项目**：本页是教学项目 demo，可以类比你自己的 业务项目；没有修改真实 业务项目。
- **外部库**：放在 demo 目录外的 observer 代码。
- **replace**：本例中，用它告诉 Go 到哪个现成的本地目录找 observer。

### 原来的业务：能编译、能运行

```go
package main

func main() {
    room := FindRoom(42)
    println(room)
}
```

### 新增调用在 FindRoom 里面：阅读片段

```go
import "example.com/observer"

func FindRoom(id int) string {
    observer.Record("FindRoom")
    return "语聊房间"
}
```

这里的 observer 只是教学用外部库；图中“工具”表示构建准备动作，不代表浏览器正在执行 LoongSuite。

自问：如果只生成了 observer.Record 调用，却不补依赖，会发生什么？

参考解释：业务程序原来的 FindRoom 代码仍然存在，但编译器找不到 observer 包，整个构建会失败；补依赖不是为了多生成一条 Trace，而是为了让新增代码有来源。

带走一句话：这一页只记住：改了业务的编译输入，就要让新增 import 对应的外部代码也能被找到。


# 从零 7：从一条耗时记录，到一整条请求

## 怎样判断三张操作记录属于同一次请求，又是谁调用了谁？

直播页面发起一次请求，服务可能先查房间、再查用户、再调用别的服务。单独一条耗时记录只能说明一个动作；我们还想知道这些动作属于同一次请求，谁调用了谁。

把这次请求相关的记录放在同一条链路（Trace）里，用 Trace ID 标识它。每个有起止时间的操作是一段 Span，也有自己的 Span ID。新操作沿用同一个 Trace ID，并记录父 Span ID，就能组成调用树。

例子里三张记录都写 Trace=A，说明属于同一次请求；数据库记录写 Parent=02，说明是查房间这一步调用了数据库。只有相同的 Trace ID 还不能知道调用顺序，必须再看父操作。A、01、02、03 是便于阅读的教学编号。

程序怎样把这些编号传给下一步，是后面的 context 与传播章节要解决的问题。这里先学会读这三张记录，不需要先记请求头格式。

- **Trace / Trace ID**：一次请求相关记录的集合 / 标识这个集合的 ID。
- **Span / Span ID**：链路里的一个操作记录 / 标识这个操作的 ID。
- **父 Span**：直接引发当前操作的上一层操作。相同 Trace ID 不代表父子关系一定正确。

### 只比较 Trace ID 不够

```text
HTTP 请求          Trace=A  Span=01
└── 查房间           Trace=A  Span=02  Parent=01
    └── 数据库查询    Trace=A  Span=03  Parent=02
```

### 沿着 Parent 读调用关系

```text
记录 03 的 Parent=02：查房间调用数据库。
记录 02 的 Parent=01：服务入口调用查房间。
三张记录的 Trace 都是 A：属于同一次请求。
```

A、01、02、03 是便于阅读的教学标识，不是合法的 OTel ID 编码。并非同一 Trace 下的多个 Span 都是重复。

自问：只要当前有 Trace ID，就完全不创建新的 Span，可以吗？

参考解释：不能一概这样做。不同操作应有自己的 Span，保持同一 Trace 的父子关系；应避免的是同一个操作被重复记录。如何兼容已有埋点，要按入口、HTTP、数据库等位置逐项验证。

带走一句话：你接下来的目标是理解“怎样接对父节点”，而不只是“有没有相同的 ID”。


入门来源：
- [Go 官方：代码、包与模块的组织](https://go.dev/doc/code)
- [Go 官方：管理依赖](https://go.dev/doc/modules/managing-dependencies)
- [固定版本：依赖准备的真实实现](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/add.go)

# 从一个普通 Go 函数开始：为什么需要插桩

先会跑一个小程序，再逐步理解 package、module、构建和观测

建议时间：55 分钟

## 学习目标
- 能从一个普通函数读懂 package、import 和 module 的基本关系
- 能用 go build 生成并运行一个二进制文件
- 能说出“观察函数执行”为什么需要在代码中增加记录点，并理解自动插桩要解决的重复劳动


## 为什么学这一章

你已经知道：你会读并调用普通 Go 函数。

遇到的问题：函数只给结果，调用过程、耗时和错误不容易看见。

本章的办法：先手动记录，再理解编译期工具如何按规则自动加记录点。

- **package**：一起编译的一组 Go 文件
- **module**：有名字、可被依赖的一组 package
- **binary**：编译后可直接运行的程序

先看懂源代码怎样变成程序，才知道插桩插在哪里。


## 先看懂一个普通函数

先把“观测”放一边。下面的函数接收一个数字，返回一个数字；调用者只能看到返回值，不知道函数何时开始、用了多久、走了哪条分支。

示意（可运行）：

```go
package main

import "fmt"

func addOne(n int) int { return n + 1 }

func main() { fmt.Println(addOne(2)) }
```

说明：保存为 main.go 后可运行：go run main.go；输出 3。


## 从 package 和 import 到 module

package 是一组一起编译的 Go 文件；import 表示“我要使用另一个 package”；module 是一组有名字、可被依赖的 package，module 名称和外部依赖的版本要求写在 go.mod 里。先只记住关系：文件属于 package，package 属于 module。

创建练习模块：mkdir hello-observe && cd hello-observe && go mod init example.com/hello-observe；把上一个 main.go 放进去后运行 go run .。

说明：example.com/hello-observe 只是练习名称，不是线上地址。


## go build 做了什么，输出在哪里

go run 会编译后临时运行；go build 会编译并留下可执行文件。-o 明确指定输出文件，便于你看到“源代码如何变成程序”。

```sh
go build -o hello .
./hello
```

说明：macOS/Linux 执行 ./hello；Windows 建议用 go build -o hello.exe .，再执行 .\hello.exe。


## 为什么要观察函数执行

如果只看 addOne 的返回值，我们不知道它是否被调用、调用了几次、耗时多久或返回了什么错误。最直接的办法是在函数前后手动写记录：开始时记时间，结束时打印结果。

这能解决一个函数的问题，却会让很多库调用都重复写同样的代码；而且提前 return、错误和并发都容易漏记。自动插桩的动机，就是在编译时把类似的记录点按规则加进去，仍交给普通 Go 编译器检查。

```go
func addOne(n int) int {
    fmt.Println("addOne: start")
    result := n + 1
    fmt.Println("addOne: end", result)
    return result
}
```


## 从手动记录走到 LoongSuite

LoongSuite Go 的固定上游版本是 v1.15.0，commit 为 cac400935add57d8219122ba32857b8f55ac6eb1。它不是运行时凭空扫描已经编译好的程序，而是在 otel go build 过程中准备依赖、匹配规则、改写目标源码，再交给 Go 编译器生成二进制。

先记住因果链：函数本身没有观察记录 → 手动加记录点 → 重复劳动变多 → 编译期工具按明确规则自动加点。

```text
源代码 -> go build ->（规则命中时改写）-> Go 编译器 -> 二进制 -> 运行时产生记录
```


## 源码阅读

- [README.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/README.md)：确认 otel go build 是编译期入口，并记录 Go 版本要求
- [docs/user/compilation-time.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/compilation-time.md)：理解 preprocess、instrument、原始编译的时间组成
- [go.mod](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/go.mod)：区分根模块、pkg 模块和测试依赖


## 练习：运行一个普通函数，再手动加观察

1. 下载并解压实验包，进入 labs/00-start；先读 main.go 的 addOne。
2. 运行 go run .，比较 plain result 与 observed result，找出额外的 start/end 记录。
3. 用 go build 留下可执行文件，再直接运行它；观察结果相同。

```sh
cd labs/00-start
go run .
mkdir -p .bin
go build -o .bin/observe .
.bin/observe
```

预期：两个结果都是 3；带观察的路径额外打印 observe: start 和 observe: end，耗时可能每次不同。这里只手写普通 Go 记录，没有 OTel Span。

挑战：把 main 中两处输入都改成 8，确认普通结果、观察结果和记录中的结果都是 9。


问题：只运行 go build 后，下面哪项最能说明“已经得到一个可运行程序”？

1. 目录中出现二进制文件，并执行它看到预期输出
2. 只看终端没有报错，不检查输出文件
3. 只查看 go.mod，不运行程序

参考答案：1。go build 的直接结果是可执行文件；运行它才能验证输出。


问题：为什么一个函数的手动开始/结束打印会推动自动插桩？

1. 因为每个函数都必须改名
2. 因为大量函数都重复需要相同记录，手写容易漏掉分支和错误
3. 因为 go.mod 会自动记录函数耗时

参考答案：2。自动插桩解决的是重复且易漏的记录劳动；module 文件不负责运行时观测。


# Go 最小阅读底座：从函数到可观察函数

先掌握普通 Go 的调用、错误、包和模块，再看工具如何改写它

建议时间：75 分钟

## 学习目标
- 能读函数、package、import、module、指针和 interface 的最小例子
- 能用 defer 覆盖函数结束，并正确处理多返回值和 error
- 能解释 context.Context 为什么要显式传递，并知道 CallContext 是工具接口而非 context.Context


## 为什么学这一章

你已经知道：你已经能运行小程序并理解 module 的位置。

遇到的问题：读 hook 时会遇到多返回值、接口、defer 和 context。

本章的办法：补齐这些普通 Go 机制，再把工具接口和标准库接口分开。

- **error**：作为返回值交给调用者处理的错误信息
- **defer**：函数返回前执行的一次收尾调用
- **interface**：只规定需要哪些方法的类型
- **context.Context**：显式传递取消、期限和值的标准库接口

先会读普通 Go 的调用约定，才能判断生成 hook 是否正确。


## 函数的输入、输出和错误

Go 函数可以有多个返回值，最常见的约定是“结果 + error”。error 是一个值，不是自动抛出的异常；调用者要检查它。

```go
package main

import "fmt"

func divide(a, b int) (int, error) {
    if b == 0 { return 0, fmt.Errorf("divide by zero") }
    return a / b, nil
}

func main() {
    result, err := divide(6, 2)
    if err != nil {
        fmt.Println("failed:", err)
        return
    }
    fmt.Println(result)
}
```

说明：完整小程序；可单独保存为 main.go 后用 go run main.go 运行。


## defer：无论从哪里 return，都做收尾

defer 会把一个调用安排到当前函数即将返回时执行。它适合关闭文件、结束计时或结束一个观测记录；进程被强制终止时不会执行。

```go
func work() (result int) {
    start := time.Now()
    defer func() { fmt.Println("elapsed:", time.Since(start)) }()
    return 42
}
```

说明：函数阅读片段；放入含 fmt、time 导入的完整程序，并在 main 中调用 work 才能运行。


## package、import、module 的阅读顺序

读陌生 Go 目录时，先看每个 .go 文件的 package 行，再看 import，最后看最近的 go.mod。go.mod 中的 module 行是本模块名字，require 行表示依赖；replace 是“本地或指定位置替代某个依赖”的构建指示，不是 Go 语言语法。

```go.mod
module example.com/app
go 1.25
require example.com/lib v1.2.3
replace example.com/lib => ../lib
```

说明：这是结构示意，不代表本课程上游 go.mod 的完整内容。


## interface、指针和工具自己的 CallContext

interface 可以理解为“只声明我需要哪些方法”。如果方法写在 *T（指针类型）上，通常是 *T 满足接口，而 T 不一定满足；编译器会在赋值时检查。

```go
type Greeter interface { Greet() string }
type User struct { Name string }
func (u *User) Greet() string { return "hi " + u.Name }
var g Greeter = &User{Name: "Go"}
```


## context.Context 要显式传，CallContext 不是它

context.Context 是标准库接口，用来传取消信号、deadline 和请求范围的值；Go 不会因 go f() 自动复制它。需要把 ctx 作为参数传给子函数或任务。

LoongSuite 的 CallContext 是插桩 hook 用来读写目标函数参数、返回值和共享数据的工具接口；它不等于 context.Context，也不能替代 context 的取消或传播。GLS 同样是工具/runtime 的额外机制，不是 Go 原生自动 context。

```go
func child(ctx context.Context) { fmt.Println(ctx.Value("request")) }
ctx := context.WithValue(context.Background(), "request", "demo")
child(ctx)
```


## 源码阅读

- [pkg/api/api.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/api/api.go)：阅读 hook 与被拦截函数之间的数据契约
- [pkg/api/impl.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/api/impl.go)：用简化实现理解字段存取；真实生成实现继续看 tool/instrument/impl.tmpl
- [docs/user/context-propagation.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/context-propagation.md)：比较原生 context 与 GLS 补救机制


## 练习：亲眼比较传 ctx 和重新开始

1. 进入 labs/01-context，找到 request 中保存的字符串 trace-request；这只是教学标识。
2. 比较把 request 显式交给新协程，与使用 context.Background() 的两条路径。
3. 找到预先启动的 worker：任务通过 jobs channel 传入 context，检查它拿到的是哪一份。

```sh
cd labs/01-context
go run .
```

预期：顺序可能变化，但共有两行 trace-request 和一行 <root>；Background 没有教学标识。此实验不创建 OTel Span，真实 Span 在第 05 章的 labs/05-otel 验证。

挑战：把 jobs <- request 改成 jobs <- context.Background()，先预测输出，再运行；完成后恢复。


问题：阅读一个接收 context.Context 的 hook 时，哪种调用最能保持父链？

1. 把当前 ctx 作为参数传入并在子操作中继续使用
2. 在子操作开始时用 context.Background()，再把 TraceID 写入日志
3. 把 ctx 存到全局变量，供所有 goroutine 读取

参考答案：1。显式传递保留取消、deadline 和 SpanContext；Background 会丢父链，全局变量又会造成并发串链和生命周期问题。


问题：某类型只有指针 receiver 的方法，为什么值 T 作为接口参数可能编译失败？

1. 接口方法集只收集导出方法，指针 receiver 不会自动属于 T 的方法集
2. 编译器会为所有值自动复制一份指针方法，因此不会失败
3. 方法集只影响运行时反射，不影响接口赋值

参考答案：1。指针和值的方法集不同，接口赋值在编译期检查；第二项混淆了自动取址场景，第三项错误地把静态类型检查归为反射。


# 从 otel go build 到目标二进制

理解 -toolexec、缓存和为什么编译时间会增加

建议时间：60 分钟

## 学习目标
- 能解释 go build 的 toolchain 调用层级
- 能找到预处理与 instrument 阶段的日志
- 能区分 Go 缓存命中与插桩缓存策略


## 为什么学这一章

你已经知道：你知道 go build 会生成二进制。

遇到的问题：普通构建不会自动进入 LoongSuite 的预处理和改写阶段。

本章的办法：用 otel go build 包住构建，并观察 -toolexec 如何接入 compiler。

- **toolchain**：编译器、链接器等构建工具链
- **-toolexec**：让 go 命令调用一个工具包装器
- **cache**：可复用的构建结果

插桩先进入构建链，才有机会改变编译输入。


## go build 的真实入口

普通 go build 会解析 go.mod、构建依赖包并调用编译器和链接器。LoongSuite 的 otel 命令包住这次构建，通过 Go 的 -toolexec 或等效工具链钩子拦截编译动作，识别哪些 package 应被改写，再把结果交给原始 compiler。

阅读入口时先找命令参数解析和子进程执行，而不是先看某个 Redis hook。你要能回答“这个 package 何时被发现、源码何时被解析、失败如何返回给 go build”。


## 预处理与 instrument

预处理阶段通常准备依赖、生成配置或注入基础支持代码；instrument 阶段读取目标包、匹配规则、修改 AST/DST 并写入临时源码或编译输入。最终仍需让 go compiler 检查类型，所以插桩失败通常表现为编译失败。

文档明确说明自动插桩在原始编译前增加 Preprocessing 和 Instrument 两个阶段。用日志时间戳拆分这三段，才能判断是网络拉依赖慢、AST 改写慢，还是 Go 本身慢。


## 为什么缓存不能简单照搬

Go build cache 以输入文件、编译参数、工具版本等为依据。插桩会改变源码、增加依赖和标准库支持文件；如果工具没有把规则版本和 probe 内容纳入缓存键，就可能复用错误产物。因此上游文档曾选择更保守的全量重编译。

优化缓存的正确问题不是“能不能复用旧 .a”，而是“规则、probe、SDK、Go 版本和目标源码都相同时能否证明产物等价”。在 CI 中保留模块下载缓存和 Go build cache 可以缩短依赖准备，但不能掩盖插桩输入变化。


## 动手读日志

用一个小模块执行 go build -x 或 -work，保存命令；再执行 otel go build，比较 compiler 参数、临时目录和生成文件。不要把缓存目录提交到业务仓库。

每次实验记录 GOTOOLCHAIN、GOOS、GOARCH、工具版本、规则快照和输出 hash。这样你才能复现“昨天通过、今天失败”的构建。

```sh
go env GOMOD GOTOOLCHAIN GOOS GOARCH GOCACHE GOPATH
go build -x -work ./...
otel go build -x -work ./...
```


## 源码阅读

- [tool/otel/main.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/otel/main.go)：定位 otel 命令的入口和参数转发
- [docs/user/compilation-time.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/compilation-time.md)：将文档的时间模型映射到日志
- [pkg/otel_setup.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/otel_setup.go)：看注入侧 SDK 依赖与版本固定说明


## 练习：做一次编译对照

1. 用同一个 demo 分别运行普通 go build 和 -toolexec 包装器。
2. 把命令输出按 compile、link 分类。
3. 删除只属于本地工具的临时输出后比较二进制 hash。

```sh
cd labs/03-toolexec && mkdir -p .bin && go build -o .bin/toolexec ./wrapper && TOOLEXEC_LOG=$PWD/toolexec.log go build -toolexec=$PWD/.bin/toolexec -o .bin/app . && .bin/app && grep -E "compile|link" toolexec.log
```

预期：实验输出包含 compile、link 调用；这只验证 toolexec 边界，不等同于完整 LoongSuite 插桩。

挑战：提出一个安全缓存键，至少包含 Go 版本、工具 commit、规则 hash、probe hash、go.mod 和目标源码 hash。


问题：要证明 -toolexec 已进入 Go 构建链，哪项证据最直接？

1. 运行后的 Trace 数量增加
2. wrapper 日志中出现 go tool 的 compile/link 调用且程序仍能运行
3. 只看到 go build 命令返回 0

参考答案：2。toolexec 首先是工具链包装边界；Trace 还受规则、运行时和采样影响，单看退出码也不能证明包装器实际处理了目标动作。


问题：插桩编译缓存键缺少规则文件 hash，最可能出现什么？

1. 源码不变时总会重新编译，只有性能损失
2. 规则修改后仍复用旧的生成产物，导致行为与源码配置不一致
3. 链接器会自动读取新规则并修复缓存

参考答案：2。规则是插桩输入，不能省略；第一项方向相反，第三项把构建缓存和运行时配置混为一谈。


# AST 与 DST：把源码变成可安全改写的树

从 token、节点、位置到生成可编译代码

建议时间：75 分钟

## 学习目标
- 能在 dst.File 中寻找函数和 receiver
- 能构造调用、defer、return、import 节点
- 能解释源码位置保留和类型检查的重要性


## 为什么学这一章

你已经知道：你知道工具会在编译前处理源码。

遇到的问题：字符串替换无法可靠区分函数、方法、return 和 import。

本章的办法：把 Go 源码解析成树，按节点改写后再交给编译器。

- **AST**：表示语法结构的树
- **DST**：保留格式和注释信息的可改写树
- **receiver**：方法声明中绑定接收者的部分

安全改写依赖结构化节点，不依赖猜字符串。


## 为什么不是字符串替换

字符串替换不知道注释、泛型、作用域、嵌套函数和多返回值。AST 把 package、声明、函数、表达式和语句表示为结构；DST 在 AST 基础上保留装饰信息，使改写后格式和注释更可控。

插桩工具必须避免把同名函数、方法 receiver 和不同 package 混在一起。本课程固定版本的 FindFuncDecl 对 function 使用字符串相等，对 receiverType 使用正则；上游文档说 Function 可用正则，与这里的实现并不一致。二开时必须沿真实匹配函数核验。


## AST 与 DST 的差别要逐行看

标准 go/ast 表示语法结构，适合分析声明和位置；类型信息需结合 go/types 或项目的类型处理，单靠 AST 不等于完成语义分析。dave/dst 额外保存空白、注释和装饰信息，适合改完仍保留原文件结构。DST 不是另一门语言，节点仍然代表 Go 语法。

调试时可先用 go/parser 验证语法，再用 dst.Clone 和项目 helper 修改；改写后重新格式化并重新解析验证。


## 读 parser 和 shared helper

tool/ast/parser.go 负责 ParseSource、ParseFile、WriteFile；tool/ast/shared.go 提供 FindFuncDecl、FindStructDecl、AddImportForcely 和类型判断。先理解这些小函数，再读复杂 rule；否则你会把“树遍历问题”误判为“某个库的业务逻辑”。

泛型带来 IndexExpr 和 IndexListExpr，指针 receiver 带来 StarExpr。版本兼容规则若只处理旧 AST 形状，升级 Go 或第三方库后就可能漏匹配。


## 改写函数的三个位置

OnEnter 代码要插入原函数体最前面；OnExit 需要在所有 return 前结束或用 defer；如果要观察命名返回值，函数签名和 return 形状必须支持。直接在最后一条语句后追加代码无法覆盖提前 return 和 panic。

当 hook 需要修改参数或返回值，CallContext.SetParam/SetReturnVal 会通过生成的中间变量传递变化。这个能力会影响求值顺序和副作用，必须用测试锁定。固定版本对泛型目标不支持 SetParam / SetReturnVal，生成的 setter 会 panic；hook 中的 panic 还可能被桥捕获，不能据此认为修改成功。


## 生成后的源码是第一证据

调试插桩时不要只看规则 JSON。保存 instrument 后的临时 .go 文件，检查 import 是否重复、变量名是否冲突、defer 是否在正确作用域、return 值是否仍匹配。最后运行 gofmt、go test 或 go tool compile。

```go
func target(x int) (int, error) {
    call := api.NewCallContext()
    hookEnter(call, x)
    defer hookExit(call)
    return x + 1, nil
}
```

说明：这是示意代码；真实生成形式以具体 rule 和版本为准。


## 源码阅读

- [tool/ast/parser.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/ast/parser.go)：从文件读取 DST 并写回源码
- [tool/ast/shared.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/ast/shared.go)：跟踪函数匹配与 import 处理
- [tool/ast/primitives.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/ast/primitives.go)：学习生成节点的最小构造器


## 练习：写一个最小 AST 改写实验

1. 建一个只含 func Add(a,b int) int 的临时 package。
2. 用 go/parser 或 dave/dst 找到 Add，并插入 fmt.Println。
3. 写出改写文件并 go test，失败时先看生成源码。

```sh
cd labs/02-ast && go run .
```

预期：能生成可格式化、可编译的源码，并能解释每个新增节点。

挑战：把 Add 改成两个返回值，说明为什么原有 return 注入可能失效。


问题：规则只写 Function=Do，目标包同时有 free function 和 *Client.Do 方法，为什么还要核对 ReceiverType？

1. receiver 决定方法身份，缺失时可能误匹配另一条调用路径
2. receiver 只影响生成的 Span 名，不影响匹配对象
3. receiver 由 Go linker 在运行时自动推断，所以规则不需要它

参考答案：1。方法的 receiver 是声明身份的一部分；第二项低估了匹配阶段，第三项把编译期规则解析误说成运行时推断。


问题：函数中间有 early return，想保证退出 hook 总会执行，哪种改写思路更稳妥？

1. 只在源码最后追加一条语句，依赖控制流自然到达
2. 把 hook 放到所有 return 前，但忽略 panic 和新增分支
3. 用统一的退出路径或 defer 保存必要状态，再按原返回签名结束

参考答案：3。统一退出路径或 defer 能覆盖多个正常返回，并可单独设计 panic 语义；只追加末尾会漏 early return，逐个插入容易漏分支。


# OpenTelemetry 运行时：Span 从哪里来、到哪里去

API、SDK、采样和 exporter 的职责分工

建议时间：65 分钟

## 学习目标
- 能区分 OTel API 与 SDK
- 能用 ParentBased 理解采样结果
- 能解释“日志有 TraceID 但后端没有 Trace”


## 为什么学这一章

你已经知道：你已经理解函数可以被加上记录点。

遇到的问题：记录点产生的数据还要经过 API、SDK、采样和导出。

本章的办法：沿一条 Span 从创建到后端的流水线分清职责。

- **Span**：一次操作的开始、结束和属性记录
- **TraceID**：标识整条链路的 ID
- **sampler**：决定是否记录或保留 Span 的组件
- **exporter**：把数据发送到后端的组件

有上下文不等于已记录，更不等于已导出。


## API 与 SDK 的两层设计

OTel API 提供 Tracer、Span、Context 和 Propagator 接口；SDK 提供 TracerProvider、Sampler、SpanProcessor 和 Exporter。插桩 hook 应依赖 API，应用启动配置 SDK，这样换 exporter 不必改每条业务 hook。

Noop provider 仍可以返回合法对象，但不会导出数据。观察到 TraceID 字符串不能直接证明 Span 被记录；要同时检查 IsRecording、采样 flag、processor 和 collector 入库。


## Start 的父子规则

Tracer.Start(ctx,name) 会从 ctx 读取当前 SpanContext。ctx 有有效本地 Span，就创建 child；没有就创建 root。context.WithoutCancel(ctx) 只移除取消与 deadline 传播，不等于创建新 Trace，也不应被误解成“脱离父 Span”。

手动埋点和自动 hook 只要使用同一个 ctx 和 TracerProvider，就能形成一棵树。若 hook 使用 Background 或 GLS 取到另一份上下文，就会出现并列根 Span。


## 采样不是查询失败的同义词

ParentBased sampler 会优先尊重远程父节点的 sampled flag，再决定子 Span 是否 RecordAndSample。网关采样、collector tail sampling、存储延迟都可能让日志存在而 Trace 查询暂时为空。

验证时记录请求时间、tenant、等待时间和查询接口；第一次 404 不足以证明丢数据。对比 TraceID、SpanID、parent references 和 process serviceName，而不是只看页面颜色。


## 属性、事件和状态

Span name 表示操作类型；attributes 用于可聚合维度；events 记录时间点；status 表示错误语义。把完整请求体、token 或高基数字段塞进 attributes 会造成隐私和成本风险。自动插桩的错误判断必须和业务语义分开。


## API、SDK、processor 的分工

API 让 hook 能调用 tracer.Start；SDK 的 TracerProvider 决定实现对象；Sampler 决定是否记录和采样；SpanProcessor 决定同步或批量处理；Exporter 决定发送到哪里。把这些层混成“OTel 负责上报”会让排障失去方向。

例如 API 返回有效 Span 但 provider 是 noop，hook 运行了而后端没有数据；batch processor 尚未 flush，短进程退出，也会造成查询为空。


## 源码阅读

- [pkg/inst-api/instrumenter/instrumenter.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/inst-api/instrumenter/instrumenter.go)：看注入代码依赖的 instrumenter 接口层
- [pkg/otel_setup.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/otel_setup.go)：确认 SDK/exporter 初始化和固定版本
- [docs/user/sdk-config.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/sdk-config.md)：列出环境变量与采样配置的来源


## 练习：追一棵真实 Span 树

1. 运行内存 exporter 实验，观察 request、child、remote-child。
2. 对照 detached 的新 TraceID，确认 Background 路径成为新根。
3. 查看 unsampled-child 的断言：有有效 TraceID，但 IsRecording 为 false，也没有导出。

```sh
cd labs/05-otel && go run .
```

预期：输出四个已导出的 Span，程序对 TraceID、ParentSpanID、remote 标志和未采样路径作断言；它不连接远端 Collector。

挑战：为一个预期的 HTTP 400 设计状态策略，避免把所有非 2xx 都标为系统错误。


问题：日志中已有有效 TraceID，但后端没有对应 Span，哪项仍需核验？

1. 只需重新生成 TraceID，原 ID 一定是错误的
2. 采样决策、Span 是否 recording、processor/exporter 和后端查询范围
3. 只需检查 Span 名称，导出链路与名称无关

参考答案：2。上下文存在不等于被采样、处理和入库；改 ID 会破坏关联，名称检查也不能替代导出诊断。


问题：ParentBased sampler 处理一个带远端父 Span 的请求时，主要依据是什么？

1. 父 Span 的采样决策，并结合本地配置处理无效父级
2. 当前函数是否返回 error，再决定父链是否存在
3. 响应头是否已经写入 TraceID

参考答案：1。它关注父级采样上下文；业务 error 和响应头是其他层面的信息，不能替代 sampler 的输入。


# Context 与传播：一条链怎样跨 goroutine 和进程

把“自动继承”放回真实边界里

建议时间：80 分钟

## 学习目标
- 能区分 context 传递、HTTP carrier 和消息 carrier
- 能解释 B3 单头、多头与 W3C 的优先级风险
- 能判断 GLS 能覆盖什么、不能覆盖什么


## 为什么学这一章

你已经知道：你知道 Span 可以挂在 context 上。

遇到的问题：goroutine、HTTP 和消息队列会把一次调用带到新的边界。

本章的办法：在任务或 carrier 中显式传递，再比较 GLS 这类额外补救。

- **carrier**：承载传播字段的 header 或消息属性
- **Inject**：把当前上下文写入 carrier
- **Extract**：从 carrier 读出远端上下文
- **GLS**：工具/runtime 维护的额外关联机制

跨边界的父子关系必须有交接证据。


## 进程内与进程间是两件事

进程内的 context 是 Go 值，函数可以显式传递；进程间不能直接发送 context，只能用 propagator 把 SpanContext 编码进 HTTP header、gRPC metadata 或消息 properties。消费者必须从 carrier Extract 后再 Start。

一个服务全部接入 OTel 也不会自动修复消息字段为空；发送端没有 Inject，消费端只能创建新根。这个区别是理解“全链路”最重要的边界。


## W3C 与 B3

W3C 用 traceparent 单头携带 version、TraceID、parent-id 和 flags；B3 多头拆成 X-B3-TraceId、X-B3-SpanId、X-B3-Sampled，B3 单头把它们组合在 b3。它们表达相似信息，但不能把两个不同父节点同时当成真相。

Composite propagator 的顺序会影响冲突输入。旧版 tracing 的 OTLP 初始化顺序是 TraceContext、Baggage、B3MultipleHeader；B3 extractor 本身会优先有效 b3 单头，再回退多头。网关应统一清理和重注入，而不是让下游猜。


## GLS 与 goroutine

LoongSuite 文档描述了 GLS：创建 Span 时保存数据，新 goroutine 创建时复制对应结构，后续 Start 可从 GLS 读取最近 Span。这是编译期插入和 runtime hook 的联合能力，不是 Go 规范。

它对普通、工具可识别的 go 语句可能有效；预先创建的 worker 只是在任务提交时执行，创建 worker 的时刻并没有当前请求。正确做法仍是提交 Job 时携带 ctx 或 carrier，worker 执行时恢复它。


## 传播流程

HTTP 服务端先 Extract，再创建 server Span；客户端在发送前 Inject 当前 ctx。消息生产者创建 producer Span 并 Inject 到 properties；消费者 Extract、创建 consumer Span，并根据语义决定 child 或 Span Link。

Span Link 适合一个批量任务由多条消息或多个请求共同触发；强行选择单一父节点会丢失因果关系。


## 源码阅读

- [docs/user/context-propagation.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/context-propagation.md)：对照 GLS 说明与 Go 原生语义
- [pkg/rules/otel-sdk/trace/v1_39_0/otel_trace_context_linker.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/otel-sdk/trace/v1_39_0/otel_trace_context_linker.go)：跟踪 SpanContext 与工具上下文的连接
- [pkg/rules/http/server_setup.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/http/server_setup.go)：找 HTTP 服务端提取和客户端注入的 hook


## 练习：做传播矩阵

1. 准备 pure W3C、B3 multi、B3 single、W3C+B3 冲突四组 header。
2. 记录 Extract 后的 TraceID、SpanID、IsRemote。
3. 再模拟网关创建新出站 Span，检查是否清理旧 b3。

```sh
cd labs/06-propagation && go run .
```

预期：真实 propagator 对每行断言 TraceID、SpanID 和 IsRemote。旧单头残留与清理后的案例保持相同 TraceID，父 SpanID 不同；这是载体模型，不是真实网关验收。

挑战：设计消息 properties 的最小字段集合，同时保留采样和 baggage。


问题：消息自动插桩已经产生 publish 和 consume Span，但两者 Trace 不相连，最可能缺少哪一步？

1. 给 consume Span 改一个更短的名称
2. 把生产侧 SpanContext 注入消息属性，并在消费侧从同一属性提取
3. 只给 exporter 增加 flush 次数

参考答案：2。Span 创建与跨进程关联是两件事；名称或 flush 不能凭空提供消息中的父上下文。


问题：GLS 机制与 Go 原生 context 的关系，哪项准确？

1. GLS 是语言规范的一部分，任何 goroutine 都自动可用
2. GLS 只能替代 context，显式 ctx 传递反而会重复
3. GLS 是工具/runtime 层的补救，不能替代跨任务和跨进程交接

参考答案：3。Go 不保证隐式继承；GLS 有覆盖和版本边界，任务队列及消息 carrier 仍需显式传递。前两项都把工具机制夸大成语言保证。


# 源码架构导航：从命令到 hook 的调用链

建立可重复的阅读路线

建议时间：80 分钟

## 学习目标
- 能按入口、编译管线、规则、API、运行时五层定位源码
- 能读懂一条规则的全生命周期
- 能使用 rg、go list 和测试反向验证推断


## 为什么学这一章

你已经知道：你已看过构建、改写和运行时三条线。

遇到的问题：源码分散在命令、规则、API、probe 和测试目录。

本章的办法：沿一条真实调用链定位每层的入口和产物。

- **preprocess**：准备临时构建目录和依赖
- **instrument**：匹配并改写目标编译输入
- **probe**：规则命中的运行时 hook 代码

先画文件之间的调用路线，再深入单个库规则。


## 五层地图

第一层是 CLI 和构建代理；第二层是 preprocessing/instrument 编译管线；第三层是 tool/data 中的规则与版本匹配；第四层是 pkg/api、pkg/inst-api 和各 rule probe；第五层是 OTel runtime、GLS 和 exporter。

从一个真实 hook 反向走：规则 JSON 告诉你匹配函数，rule 目录告诉你 OnEnter/OnExit，api.CallContext 告诉你参数如何保存，生成源码告诉你插入位置，最终 Span 树告诉你运行时是否正确。


## 为什么先读接口再读库规则

如果直接读 goredis 或 echo rule，你会把通用机制和库特例混在一起。先读 CallContext、instrumenter interface、rule parser，再读一个简单 net/http rule，最后读复杂数据库 rule。

每个陌生符号都记录“定义、调用者、输入、输出、失败方式”。只读定义不读调用点，容易把工具的约定写成臆测。


## 根模块与 pkg 模块

仓库存在根 go.mod 和 pkg/go.mod 等边界。根模块主要构建命令、测试和开发工具；pkg 模块是注入到目标程序的 API/runtime。二开时要确认新增 import 放在哪个模块，避免本地能编译、用户目标项目无法解析。


## 阅读工具链

rg 找符号和字符串，go list -deps 找模块图，go doc 看接口契约，go test -run 缩小验证，git show 固定 commit。每读完一层就运行一个最小测试，避免一次读完整仓库后才发现基础假设错了。


## 源码阅读

- [tool/otel/main.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/otel/main.go)：确认仓库根部的可执行入口
- [tool/instrument/trampoline.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/trampoline.go)：从工具包定位参数和返回值改写
- [pkg/api/api.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/api/api.go)：区分目标程序依赖的注入 API 与工具自身


## 练习：画一条规则的源码路线

1. 选 net/http 或 echo。
2. 从 rules 数据文件找到 ImportPath 和 Function。
3. 反查 probe 的 OnEnter、OnExit、CallContext 和测试。

```sh
设计练习：本章没有独立测试命令；在 pinned upstream 根目录执行 rg -n "net/http|OnEnter|OnExit|CallContext" tool pkg test，并把结果按规则、probe、API、fixture 分组。
```

预期：得到至少五个文件的有向阅读链，并能解释每一跳；不要把 guide 目录的 labs 输出当作源码规则测试。

挑战：把路线改写成一个新人可以执行的 10 分钟排障清单。


问题：定位一条规则为何没有命中时，哪组字段应优先与目标依赖源码对照？

1. 目标 import path、函数和 receiver、版本区间及依赖版本
2. 先看 Span 名和 exporter 地址，再回头猜函数签名
3. 只比较文件名，因为规则会忽略模块版本

参考答案：1。匹配发生在目标符号和版本边界上；Span 名及 exporter 属于运行时，文件名也不能代替 import path 和签名。


问题：根模块和 pkg 子模块的 go.mod 分开时，二开者首先应如何使用它们？

1. 把所有新 import 都放根模块，子模块会自动继承
2. 确认每个文件所属模块及其依赖边界，再在对应模块运行 go list/test
3. 删除子模块 go.mod，让工具统一解析依赖

参考答案：2。模块边界决定解析和构建上下文；自动继承和删除模块都会改变上游构建语义。


# 规则系统：版本范围不是装饰

从匹配条件到“为什么没命中”

建议时间：75 分钟

## 学习目标
- 能读 Function、ReceiverType、Dependencies、Version
- 能正确解释半开区间版本
- 能为库升级设计规则和测试


## 为什么学这一章

你已经知道：你能从命令追到规则和 AST helper。

遇到的问题：同名函数可能来自不同包、receiver 或版本。

本章的办法：用 import、实际函数名、receiver 和版本区间精确匹配。

- **ImportPath**：目标 package 的完整导入路径
- **version range**：规则适用的库版本区间
- **fixture**：用于验证命中结果的小测试工程
- **muzzle**：检查规则边界和误匹配的测试

固定 v1.15.0 中 Function 名称按实际相等匹配，不要把它想成正则。


## 规则字段的真实语义

函数规则的常见字段包括 ImportPath、Function、ReceiverType、OnEnter、OnExit、Path 和 Version；并不是每个字段都必填，未指定版本约束等情况要结合规则类型读实现。Dependencies 表示目标项目必须已有的依赖，避免工具为了一个可选库强行改变 go.mod。

v1.15.0 的文档声称 Function 与 ReceiverType 支持正则，但 tool/ast/shared.go 的 FindFuncDecl 实际以 function == funcDecl.Name.Name 匹配函数名。ReceiverType 才走正则，而且非空 receiver 过滤会排除普通函数。使用 .* 前先看实现，不要只读文档。


## 半开区间

[1.22.0,1.25.10) 表示大于等于 1.22.0 且严格小于 1.25.10。1.25.10 不匹配，1.25.12 更不匹配；不能按“主版本差不多”判断。

库升级后先查 API 是否变化，再决定扩展范围还是新增版本规则。扩大范围可能让 hook 误用已经改变签名的函数；新增规则能隔离差异，但维护成本更高。


## 匹配失败的诊断顺序

先确认 go list -m 给出的 module version，再确认 ImportPath 和包是否在编译图中；然后检查 Function/ReceiverType 的真实名字，最后检查 Dependencies 和规则文件是否被打包进工具。

如果编译成功但没有 Span，可能是采样、hook 没触发、函数走了另一条路径或 exporter 未连接；不要直接把它归因于版本范围。


## 一次真实的文档与实现差异

打开 tool/ast/shared.go:198，先看函数名筛选，再看 receiver 的分支。Function 写成 .*ServeHTTP，在这个未打补丁的版本中不会像文档承诺那样匹配；这与你之前需要 function-regex 补丁的场景有关。

若要二开支持正则，先决定是否使用完整匹配、如何处理无效表达式，再为精确函数名、模式、普通函数、指针 receiver、泛型 receiver 和反例分别测试。不要把尚未修改的上游当成补丁版。

```go
// v1.15.0 摘录：函数名在这里按相等匹配
func FindFuncDecl(root *dst.File, function string, receiverType string) []*dst.FuncDecl {
    decls := findFuncDecls(root, func(funcDecl *dst.FuncDecl) bool {
        return function == funcDecl.Name.Name
    })
    // 后续才按 receiverType 过滤；完整代码见固定提交。
}
```


## 规则改写与业务修改的边界

添加规则属于工具侧改造，目标业务代码可以零改动；但规则本身仍需要和目标依赖版本、函数签名、返回值语义配套。规则不能凭空给消息增加跨进程 carrier，也不能修改网关配置。


## 源码阅读

- [docs/dev/rule_def.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/rule_def.md)：逐字段建立规则检查表
- [tool/data/rules](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/data/rules)：比较同一库不同版本的规则
- [docs/dev/test.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/test.md)：理解最低版本、最新版本和 muzzle 检查
- [tool/ast/shared.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/ast/shared.go)：核验文档的正则描述与当前实现差异


## 练习：为一个版本缺口写规则计划

1. 选择你项目中高于现有上限的库版本。
2. 用 go doc 和源码比较旧、新函数签名。
3. 决定扩展半开区间还是新建规则，并写最小测试矩阵。

```sh
设计练习：本章没有独立测试命令；在目标服务模块运行 go list -m -json all，再在 pinned upstream 中对照 rules 数据和 test fixture。
```

预期：输出当前依赖版本、现有规则范围和明确的匹配结论。

挑战：为“函数名相同但 receiver 变化”设计 ReceiverType 正则和反例。


问题：规则版本写成 [1.22.0, 1.25.10)，目标依赖为 1.25.10，正确判断是什么？

1. 命中，因为右端版本也属于 1.25 系列
2. 不命中，因为半开区间不包含右端点
3. 只有 Go 版本会影响，库版本区间可忽略

参考答案：2。右端是开区间；系列相同不改变边界判断，库版本也正是规则匹配条件之一。


问题：规则日志显示已匹配，但没有看到 Span，下一步最有区分度的检查是什么？

1. 先把版本区间放宽到 .*，确保任何版本都进入规则
2. 先确认生成 hook 是否执行，再分别检查采样、recording、processor/exporter
3. 直接在业务函数里再 Start 一个 Span 作为对照

参考答案：2。匹配、执行和导出是不同层；放宽规则可能引入误匹配，重复手动 Span 会污染诊断。


# Hook 与 linkname：如何接入而不破坏调用约定

OnEnter、OnExit、trampoline 和参数返回值

建议时间：85 分钟

## 学习目标
- 能写出签名匹配的 hook
- 能解释 go:linkname 与 trampoline 风险
- 能安全保存和恢复调用参数、返回值


## 为什么学这一章

你已经知道：你知道规则何时命中目标函数。

遇到的问题：命中后生成的 hook 必须保持原参数、返回值和控制流。

本章的办法：用 OnEnter/OnExit 和 trampoline 包住原调用，并验证 error、panic、return。

- **hook**：在目标函数前后执行的插入代码
- **trampoline**：保存原调用约定的跳转层
- **OnEnter**：目标函数进入时运行的逻辑
- **OnExit**：目标函数返回后运行的逻辑

Hook 的第一契约是和原函数签名及控制流一致。


## Hook 的 ABI 契约

OnEnter 的第一个参数是 api.CallContext，后续参数按目标函数入参顺序排列；OnExit 的后续参数按返回值顺序排列。参数类型、receiver、variadic 和泛型形状必须一致。

“看起来能编译”不够：错误的参数顺序可能让运行时读到错误值；interface{} 虽能承载值，但类型断言、nil interface 和指针层级要明确。


## go:linkname 和 trampoline

go:linkname 把一个本包函数绑定到另一个符号名，使目标包调用路径能够进入 hook。工具在原函数入口插入 trampoline 跳转，生成参数与返回值的桥接代码，在进入和退出时调用 hook；它不是简单地保存一个函数地址再整体替换原函数。普通路径继续执行原函数体，skip 路径另行处理。

这绕开普通可见性和包边界，依赖链接器符号、编译器实现和 runtime 约定。它适合工具内部桥接，不适合业务代码随意使用。


## 修改参数和返回值

CallContext.SetParam 可以在调用原始函数前替换参数，SetReturnVal 可以在退出时替换返回值。固定版本对泛型目标不支持这两种修改，生成 setter 会 panic。修改前先判断函数是否真的允许改变语义；观测型 hook 应优先只读，避免把 tracing bug 变成业务 bug。

多返回值尤其要小心：error 可能是 nil interface、typed nil 或包装错误。SetReturnVal 的索引错一位，编译器未必能替你发现。


## trampoline 如何处理多返回值

生成器通常把原函数调用放到临时变量中，再把这些变量交给 OnExit；若函数返回多个值，trampoline 必须按声明顺序保存每个值，hook 修改后再按同样顺序 return。

命名返回值、裸 return、defer 和 panic 都会改变控制流，所以不能只在函数末尾追加一条 hook 调用。阅读 tool/instrument/trampoline.go 时，先找参数装箱、原始调用、返回值拆箱和 return 节点四段。


## 异常与清理

Span End 应覆盖正常返回和 error 返回；如果 hook 捕获 panic，必须保持原有 panic/recover 语义，不要吞掉业务 panic。defer 的执行顺序、闭包捕获变量和原函数是否已经注册 defer 都要在测试中观察。

```go
// 示意：hook 只读返回值并保证结束
func onExit(call api.CallContext, result any, err error) {
    span := call.GetKeyData("span")
    if s, ok := span.(trace.Span); ok {
        if err != nil { s.RecordError(err) }
        s.End()
    }
}
```


## 源码阅读

- [docs/dev/hook.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/hook.md)：核对 linkname 和参数规则
- [tool/instrument/impl.tmpl](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/impl.tmpl)：对照 trampoline.go 查看真实生成的 setter；pkg/api/impl.go 仅作测试帮手
- [pkg/rules/mux/mux_server_setup.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/mux/mux_server_setup.go)：找一个简单、完整的 hook 作为模板


## 练习：实现一个只记录耗时的 hook

1. 选择测试函数并写 OnEnter 保存 start time。
2. OnExit 取出 start time，记录 duration 后 End。
3. 加入 error、提前 return 和 panic 测试，确认清理不丢失。

```sh
cd labs/04-custom-hook && go run main.go
```

预期：普通编译基线输出 plain-result；完整 hook 构建按 labs/04-custom-hook/README.md 先构建 v1.15.0 工具，失败时保留失败日志。main.go 明确排除工具生成的 runtime stub。

挑战：设计一个检测已有 otelhttp Span 的去重条件，并说明为什么“当前有 Span”不能简单等于“跳过所有客户端 Span”。


问题：目标函数返回 (value, error)，OnExit 需要判断错误并允许修改返回值，哪项约束正确？

1. 只接收 error 即可，value 会由 runtime 自动恢复
2. 按原函数返回顺序接收并保持类型/数量匹配，再决定是否调用 SetReturnVal
3. 把返回值编码成日志字符串即可，hook 签名不必一致

参考答案：2。trampoline 需要按原签名保存和拆包；少接收、改成字符串或依赖 runtime 自动恢复都会破坏调用约定。


问题：引入 go:linkname 后升级 Go 或目标库，为什么必须重新跑构建/运行 fixture？

1. 符号和 ABI/生成代码约定可能变化，旧的链接假设不具备稳定兼容性
2. linkname 只在注释阶段生效，升级不会影响二进制
3. 只要 TraceID 格式不变，链接符号就一定兼容

参考答案：1。linkname 绕过普通可见性，依赖私有符号和工具链实现；协议字段格式不能证明 ABI 仍然一致。


# 运行时上下文：GLS、newproc 与真实限制

理解“协程自动继承”为什么不是魔法

建议时间：85 分钟

## 学习目标
- 能说明 GLS 在什么时刻保存和读取 Span
- 能区分新 goroutine 与预创建 worker
- 能识别 runtime/ABI 适配风险


## 为什么学这一章

你已经知道：你已经知道显式 context 和 carrier 的边界。

遇到的问题：新 goroutine 的创建时机可能早于真正的任务来源。

本章的办法：比较 newproc/GLS 的创建时复制与 worker 入队时的显式交接。

- **G**：Go runtime 表示一个 goroutine 的结构
- **newproc**：runtime 创建新 goroutine 的路径
- **worker**：等待任务并执行的长期 goroutine

GLS 不是 Go 原生自动 context，不能替代任务和消息交接。


## Go 的 GMP 只负责调度

G、M、P 是 goroutine、OS thread、processor 的调度模型。goroutine 被调度到哪个 M/P 与业务 Trace 没有天然关系；把 Span 放到 OS thread local 会在切换时错乱。

因此上下文通常放在 context.Context 中显式传递。LoongSuite 通过对 goroutine 创建路径的编译/runtime 介入，维护自己的 GLS 数据，但这是一层额外协议。


## newproc 与复制时机

当工具能识别 go 语句或 runtime newproc 路径时，它可以让新 G 复制父 G 的关联数据。这个复制发生在 goroutine 创建时，适合“请求中马上 go func()”的场景。

预创建 worker 在服务启动时产生，此时没有请求 Span；之后任务提交只是把一个 Job 放入队列，工具无法凭空知道 Job 来自哪个请求。必须在交接处传 ctx 或 carrier。


## GLS 与 context：上游实现和兼容策略

上游文档描述：新建 Span 会写入 GLS，新 goroutine 获取创建者的关联数据，后续创建 Span 时可从 GLS 最近的 Span 取父节点。v1_39_0 的 getOrInitTraceContext 直接读取 GLS；不能把它概括为“显式 context 永远优先”。具体选择还要沿 SDK hook 与 context linker 阅读。

兼容改造建议：明确有效显式 context、远程父上下文、GLS 与 WithNewRoot 的优先级，再用冲突输入测试。这里的建议不是上游已保证的契约。生命周期恢复错误或旧 GLS 残留，可能造成错误 parent 或跨请求串链。

并发测试比单请求测试重要：两个请求同时创建 goroutine，检查不同 TraceID、正确 parent、任务结束后的状态恢复。GLS 不能替代跨进程 carrier。


## runtime 版本和安全边界

runtime 符号、栈布局、编译器生成代码和 ABI 在 Go 版本间可能变化。工具需要固定支持版本并为新版本做测试；用户升级 Go 不能只改 go.mod。出现 panic、错误 parent 或编译器崩溃时，先保留编译参数和 Go 版本。


## 源码阅读

- [docs/user/context-propagation.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/context-propagation.md)：将文档描述与实际 hook 对照
- [pkg/rules/otel-sdk/trace](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/otel-sdk/trace)：追踪 SpanContext 与 GLS 的连接
- [pkg/rules/otel-sdk/trace/v1_39_0](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/otel-sdk/trace/v1_39_0)：观察版本目录隔离


## 练习：比较两种 worker

1. 启动一个预创建 worker，提交不带 ctx 的任务。
2. 再次提交显式携带 ctx 的任务。
3. 并发提交两个不同 Trace 的任务，检查 parent 和 TraceID。

```sh
cd labs/01-context && go run . | sort
```

预期：显式任务交接保持链路；Background/无 carrier 任务成为新根或无父。

挑战：给 worker 设计 cancel、deadline、Span 结束时机，避免任务结束前请求 context 已取消。


问题：服务启动时预创建 worker，收到请求后才从队列取 Job；为什么创建时继承不到请求 Span？

1. worker 的 goroutine 已在请求之前创建，任务来源只在入队/出队时出现
2. worker 运行在独立 OS 线程，Go context 永远不能进入其中
3. 只要启用采样，runtime 会回溯找到最近请求

参考答案：1。继承时机早于任务来源；线程边界不是根因，采样也不会恢复未交接的上下文。


问题：在显式 ctx 与 GLS 同时可用的任务中，哪种读取策略更安全？

1. 总是优先 GLS，因为它不需要改函数签名
2. 总是创建新根，避免任何父子关系
3. 优先有效的显式 ctx，GLS 仅作为受限补救并验证生命周期

参考答案：3。显式 ctx 的来源和生命周期可审计；无条件用 GLS 可能复用旧关联，直接新建根又丢失本可保留的父链。


# 兼容已有 OTel：去重、入口和消息边界

以已有 OTel 服务为案例做决策

建议时间：90 分钟

## 学习目标
- 能制定自动与手动埋点的边界
- 能识别重复 server/client Span 的来源
- 能给 HTTP、gRPC、数据库和消息写兼容矩阵


## 为什么学这一章

你已经知道：你能生成 Span 并解释传播边界。

遇到的问题：已有手动或 otelhttp 埋点可能与自动规则重复。

本章的办法：按入口、操作和 wrapper 判断是否去重，而不是看到任意 Span 就跳过。

- **provider**：创建 tracer 和处理导出的 SDK 对象
- **instrumentation scope**：标识某套埋点代码来源的信息
- **dedup**：只跳过确实重复的埋点

providerreuse/otelhttp 去重是自定义兼容设计，不是默认能力。


## 入口只能有一套主埋点

同一个 Echo 或 net/http server 同时安装原有 otelecho 和自动 server rule，可能出现两个入口 Span。最安全的策略是选择一套 server 入口，另一套只保留指标或关闭 tracing handler。

数据库、gRPC 和已有 otelhttp client 则要按库分别判断：如果自动规则能识别已有 instrumentation scope 或当前调用包装，应该跳过重复 client Span；不能用“ctx 里有任意 Span”作为全局跳过条件。


## 去重不是“Span 数量越少越好”

正常情况下一个请求需要 server Span、client Span 和数据库 Span。去重目标是同一操作不出现两个同名同层 Span，而不是删除所有子 Span。判断维度应包括操作类型、调用栈/包装器、instrumentation scope 和当前 transport。

一次真实样本若只有入口和手动 Span，不能证明 otelhttp 去重已通过；必须让已有 otelhttp wrapper 和普通 http.Client 各走一次，比较 Span 数量和 parent。


## 兼容配置与上报信息

已有 tracing 初始化可能已经管理 exporter endpoint、service name、propagator 和 shutdown。自动插件应复用这套 provider，避免另起一套 SDK 造成两条 Trace、重复 exporter 或服务名分裂。

如果工具需要显式实验配置，必须记录它是否覆盖现有 provider；“自动沿用”要通过构建和运行日志验证，不能只靠环境变量命名推断。


## 消息是独立适配项

NSQ、Pulsar 发送端需要 Inject 到 message properties；消费端 Receive 后 Extract，再 Start consumer Span。消息只含业务 JSON 时，自动库 hook 可以记录 publish/receive，却无法知道业务因果。批量消费应考虑 Link。


## 源码阅读

- [pkg/rules/http](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/http)：识别普通 client/server 埋点
- [pkg/rules/grpc](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/grpc)：比较 server/client 两侧责任
- [docs/user/compatibility.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/compatibility.md)：按版本和库能力建立验收矩阵


## 练习：写兼容矩阵

1. 列入口 Echo、net/http、gRPC、GORM、Mongo、NSQ、Pulsar。
2. 每行写现有埋点、自动规则、是否选主入口、去重证据。
3. 为未覆盖项写明确“不自动解决”的交接动作。

```sh
设计练习：没有单条命令能替代你的服务兼容矩阵；参考 upstream/test/nethttp、test/grpc、test/gorm 和 test/mongo 的 fixture，再按 docs/dev/test.md 运行对应集成测试。
```

预期：矩阵能区分入口重复、子调用重复、消息断链三种问题；不要把不存在的 TestHTTP 名称当作通过。

挑战：为已有 otelhttp wrapper 设计一个不误伤普通 http.Client 的 skip predicate。


问题：HTTP client 调用当前 ctx 已有 server Span，是否应直接跳过自动 client Span？

1. 应跳过，任何已有 Span 都说明请求已埋点
2. 不应仅凭已有 Span 判断，还要确认是否已有同一 client wrapper/操作
3. 应新建一个 root Span，避免和 server Span 重叠

参考答案：2。server parent 下仍应有 client child；去重要识别同一操作和包装器，不能全局跳过或切断父链。


问题：消费端自动生成 consumer Span，但消息没有传播字段，能否仅凭 TraceID 或采样率恢复生产父级？

1. 能，TraceID 可从消费时间和服务名推导
2. 能，只要生产和消费使用同一采样率
3. 不能，必须有生产侧 Inject 与消费侧 Extract 的 carrier

参考答案：3。TraceID 不可推导，采样率只影响是否记录；没有 carrier 就没有跨进程因果依据。


# 调试与验证：从“没 Span”定位到具体层

用证据代替猜测

建议时间：85 分钟

## 学习目标
- 能用最小复现拆分编译、hook、context、采样和上报
- 能读 Span references 而不是只读 TraceID
- 能写不泄漏业务数据的验证报告


## 为什么学这一章

你已经知道：你已有构建、规则、hook 和导出各层的地图。

遇到的问题：“没 Span”可能发生在命中、执行、采样、导出或查询任一层。

本章的办法：用五问法和最小复现逐层排除，并保留可复现证据。

- **recording**：Span 当前是否真的记录数据
- **processor**：接收并处理 Span 的 SDK 组件
- **tenant**：查询后端数据所在的租户或空间

先定位断在哪一层，再改规则或运行时。


## 五问法

第一问：工具版本、Go 版本、目标库版本是否在支持范围？第二问：规则是否命中？第三问：生成 hook 是否编译并执行？第四问：当前 context/GLS 的 parent 是谁？第五问：sampler、processor、collector 和查询租户是否正确？

每一问都要有证据。比如规则命中看 instrument 日志或生成源码，hook 执行看 Span/日志，父子关系看 references，导出看后端和 collector。


## 不要把 404 当成丢链路

Trace 后端可能有 tail sampling 的 decision_wait、异步 exporter 和索引延迟。先等待，再指定 tenant、时间窗口和 service 查询；日志有 ID 但 Trace 仍无数据时，再查 sampled flag、collector 错误和 exporter health。

报告中写“在时间 T、租户 X、查询 Q、等待 W 后未找到”，不要写“系统没有 Trace”这种超出证据的结论。


## 错误 Span 的解释

错误 Span 代表某个操作被标记为 error，可能是业务校验、下游返回、超时或真实异常。聚合面板的错误数不能直接证明插桩造成错误；要看 error.type、status、operation、版本和基线对比。

插桩回归需要比较同一请求集合的成功率、延迟、Span 数、CPU、内存和 exporter error，而不是只看红色数字。


## 最小复现与二分

先用一条函数和一个规则复现，再加入 context、并发、已有 OTel wrapper。每次只改变一个变量。编译失败保留生成源码；运行错误保存请求 header 的脱敏版本、Trace 树和工具日志。


## 源码阅读

- [test/integration_test.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/test/integration_test.go)：看测试如何构造目标模块和结果
- [test/build_test.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/test/build_test.go)：理解编译级验证
- [docs/dev/test.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/test.md)：学习最低版本、muzzle 和夜间测试


## 练习：制作一份可复现报告

1. 选择一个“没有 Span”的现象。
2. 记录 commit、Go、module version、命令和脱敏输入。
3. 按五问法给每层标记 pass/fail/unknown。

```sh
设计练习：使用 labs/README.md 中对应实验命令，并把实际失败或成功日志保存到报告；不要运行一个可能 0 tests 的模糊 -run。
```

预期：报告能让另一个人只靠命令和版本复现，且不包含 token、用户 ID 或完整请求体。

挑战：把一个 Trace 404 分解为采样、入库延迟、租户错误、ID 不一致四个假设并设计验证顺序。


问题：日志有 TraceID 但 Trace 查询为空，哪项排查顺序更稳妥？

1. 先改业务 TraceID，再看是否出现；不需要核验查询条件
2. 先核对采样/recording、processor/exporter、collector、租户和时间窗口
3. 直接扩大规则版本范围，因为后端查询为空说明没有命中规则

参考答案：2。日志和 Span 走不同阶段；查询范围、采样和导出都可能造成空结果，改 ID 或扩大规则会掩盖问题。


问题：两个 Span 共享 TraceID，但一个没有预期的父边，哪类证据最能区分“同链但拓扑错”与“查错 Trace”？

1. 只看两个 Span 的服务名是否相同
2. 比较 ParentSpanID、Span links、入站/出站传播字段和时间顺序
3. 只看响应头是否包含任意 TraceID

参考答案：2。TraceID 只证明同一链标识；父 ID、links 和传播/时序才能验证拓扑，响应头单字段不足以定位。


# 毕业项目：为已有 OTel 服务新增一个安全规则

从问题定义到二开验收

建议时间：180 分钟

## 学习目标
- 能从真实函数签名设计规则和 hook
- 能保持现有 provider、日志和手动 Span 兼容
- 能交付版本矩阵、生成源码、测试和回滚说明


## 为什么学这一章

你已经知道：你已经能从规则走到生成代码和 Span 证据。

遇到的问题：真实服务还要兼容 provider、已有 wrapper、版本和回滚。

本章的办法：选择一个小目标，做规则、fixture、兼容矩阵和回滚闭环。

- **fixture**：固定版本和调用方式的验证样例
- **ADR**：记录设计取舍和边界的短文档
- **rollback**：撤回改动并恢复基线构建

安全二开是可证明、可回滚、可复现的最小改动。


## 项目题目

选择一个已有 OTel 服务中的库调用：优先普通 HTTP、Redis 或一个版本明确的数据库函数；暂不从 Pulsar/NSQ 开始，因为消息跨进程还需要 carrier 设计。目标是增加一个不改变业务返回值的 child Span。

定义成功条件：目标版本命中；hook 执行一次；parent 正确；已有 wrapper 不重复；error 语义不误报；provider 和服务名沿用；go test、race 或集成测试通过。


## 设计文档先于代码

写一页 ADR：目标函数、版本范围、为什么需要自动 Span、已有埋点、跳过条件、参数脱敏、采样影响和回滚方法。把“不支持消息自动传播”“不修改网关”写成范围边界。

为每个风险配证据：函数签名来自固定 commit，版本来自 go list，现有 Span 来自测试，生成源码来自 instrument 输出。


## 实现步骤

先在 test/ 增加最低版本 fixture，再写 probe；使用 api.CallContext 保存 Span 和原始参数；规则 JSON 指定准确 receiver 和版本；运行 gofmt、go test、编译和最小服务。

若需要跳过已有 instrumentation，优先改 probe 的精确判断，而不是关闭整个库的自动规则。若发现版本签名不同，新增版本规则而不是把正则放宽到 .*。


## 交付物和复盘

提交应包含规则、probe、测试、README 或 ADR、生成证据摘要和兼容矩阵。报告明确哪些是已证明、哪些是本地机制测试、哪些仍需测试环境或网关配合。

最后做一次反向阅读：从一个真实 Span 找回规则和 hook；从一个失败请求反查编译、context、采样和传播。你能双向走通，才算具备二开能力。


## 源码阅读

- [docs/dev/rule_def.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/rule_def.md)：把设计字段落到 JSON
- [docs/dev/hook.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/hook.md)：把设计映射到 OnEnter/OnExit
- [test/custom_test.go](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/test/custom_test.go)：参考自定义规则测试结构
- [README.md](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1/README.md)：遵循上游构建和贡献入口


## 练习：完成一次可回滚二开

1. 建立 feature 分支和基线 commit。
2. 实现一个最小规则，先跑最低版本 fixture，再跑目标服务。
3. 保存生成源码、Span 树和性能前后对照。
4. 写回滚命令并在本地验证回滚后普通 go build。

```sh
设计练习：先运行 cd labs/04-custom-hook && go run main.go；再按其 README 使用固定 v1.15.0 工具构建；最后在 clean upstream 根目录运行 go test ./test -run TestCustomRule -count=1 -v。
```

预期：普通实验和真实 custom rule 测试的结果分开记录；不会把不存在的测试命令当作通过。

挑战：把该规则扩展到一个签名变化的新版本：用新 rule 和新 fixture，不破坏旧版本。


问题：一个自动规则已在本地生成 Span，提交前哪组证据才能支持“兼容已有 OTel”？

1. 一张后端 Trace 截图即可，编译和重复性无需记录
2. 规则命中、生成源码、父子拓扑、已有 wrapper 去重、provider/导出和回滚结果
3. 只跑普通 go build，因为运行时拓扑由 SDK 自动保证

参考答案：2。兼容同时跨编译期和运行时；单张截图无法证明去重、配置沿用或回滚，普通编译也不验证 hook。


问题：目标库新版本只改变了函数签名，最安全的规则演进方式是什么？

1. 放宽参数/receiver 匹配到任意形式，减少维护量
2. 沿用旧规则并寄希望于 trampoline 自动适配
3. 新增精确版本区间和 fixture，保留旧规则并分别验证

参考答案：3。签名变化会影响生成调用和返回值，精确隔离可避免误匹配；宽泛匹配和自动适配都会隐藏 ABI/语义差异。


# 源码讲解：先看懂 go.mod：项目的地址与依赖清单

你的 业务项目 可以只有一份 go.mod。下面的多份 go.mod 属于另一个仓库——LoongSuite 自己的源码，不是要求你给 业务项目 新建这些文件。先看清是谁的文件，再读模块边界。

为什么需要它：你会在 LoongSuite 的多个目录看到 go.mod。先弄清每份文件管理哪一组代码，才知道工具、观察函数和业务项目各自从哪里找到所需的包。

## 本页名词

- **包（package）**：通常是一组放在同一目录、一起编译的 Go 文件。
- **模块（module）**：管理一组包及其依赖版本的单位，根目录有 go.mod。
- **go.mod**：当前模块的说明文件。遇到下一级独立 go.mod，就进入另一模块的边界。
- **import**：在 .go 文件中声明导入哪个包。模块路径加包的相对目录，组成导入路径。
- **require / replace**：前者声明模块版本需求，后者指定替代版本或本地代码位置；详见入门第 6 步。

输入：主 module 的 go.mod；例如 module github.com/alibaba/loongsuite-go、go 1.25.0 和 require 列表。

输出：Go 能解析工具 module；规则目录还可以作为独立 hook module 被编入业务。


## 先只看三份文件的位置

下面都是同一个仓库的目录，但三份 go.mod 分别管理工具、公共支持包、HTTP hook。文件夹嵌套，不代表模块边界也自动合并。

```text
loongsuite-go/
├── go.mod                 # 工具
└── pkg/
    ├── go.mod             # 公共支持包
    └── rules/http/
        └── go.mod         # HTTP hook
```


## 先认根 module

根 go.mod 的 module 是 github.com/alibaba/loongsuite-go，主要服务工具源码。


## 再认 pkg module

源码中 pkg/go.mod 声明 github.com/alibaba/loongsuite-go/pkg；pkg/inst-api 属于它，不是根 module 的独立 go.mod。


## 再认 hook module

pkg/rules/http/go.mod 又声明 github.com/alibaba/loongsuite-go/pkg/rules/http，并通过 replace ../../../pkg 指向真实的 pkg module。


## 用当前目录验证

go env GOMOD 会告诉你当前命中的那一份 go.mod；切换目录后结果可能不同。

```sh
go env GOMOD
go list -m all
```


## 对应源码

`module github.com/alibaba/loongsuite-go`：根 module 的路径只覆盖根 module 下的包。

`go 1.25.0`：根源码快照声明 Go 1.25.0。

`module github.com/alibaba/loongsuite-go/pkg`：pkg/go.mod 的真实 module 边界，pkg/inst-api 从这里导入。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/go.mod)

- 把根 module 的路径想成递归覆盖所有子目录。
- 看到 pkg/inst-api 就给它的目录单独增加 module 声明。
- 把 module、package、go.mod 三个词当成同义词。

自问：为什么一个仓库会有多个 go.mod？

参考解释：因为几组代码要分别管理依赖。根模块主要构建工具；pkg 模块提供公共支持包；HTTP hook 也有自己的模块。被插桩的业务项目还另有自己的 go.mod，要通过依赖声明解析需要的那些包。


# 源码讲解：命令入口：一个 main 如何分派不同动作

main 读取 os.Args[1]，先初始化环境，再把 version、set、go、remix 分派给不同函数。它本身不做 AST 改写。

为什么需要它：知道入口的边界，才能追问“哪一步准备依赖、哪一步接管编译”，而不是把所有行为归给 main。

## 本页名词

- **os.Args**：命令行参数切片；下标 0 通常是程序名。
- **subcommand**：第一个参数表示的动作，如 go 或 remix。
- **error**：函数返回的失败结果，main 用 ex.Fatal 结束进程。

输入：例如 otel go build：os.Args[1] 是 go，后面的参数仍是 build 的参数。

输出：go 分别进入 preprocess.Preprocess 或 instrument.Toolexec，并在错误时退出。


## 检查参数

少于两个参数就打印用法并退出，不会猜测用户想做什么。


## 初始化环境

initEnv 成功后才继续；失败交给 ex.Fatal。


## 选择分支

go 调 Preprocess，remix 调 Toolexec，version/set 调配置相关函数。


## 把错误传回命令行

分支返回 error，统一在末尾检查；普通 Go 函数调用链因此清楚可追踪。

```go
switch os.Args[1] {
case SubcommandGo:
    err = preprocess.Preprocess()
case SubcommandRemix:
    err = instrument.Toolexec()
}
```


## 对应源码

`subcmd := os.Args[1]`：输入动作来自命令行，而不是环境变量猜测。

`err = preprocess.Preprocess()`：go 子命令先进入构建前置阶段。

`err = instrument.Toolexec()`：remix 子命令处理工具链转发的编译动作。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/otel/main.go#L112)

- 把 otel 命令当成另一套编译器。
- 忽略 initEnv 失败后仍会继续的可能性。
- 把 go build 的参数误当成 os.Args[1]。

自问：前缀命令如何仍然调用标准 go？

参考解释：main 只分派；Preprocess 最后组装 go build，Toolexec 再把实际编译器调用转发下去。


# 源码讲解：Preprocess：为什么找两次规则，要准备三次？

要让查房间函数自动记录，先得知道该加哪段代码，再把那段代码需要的包找齐。新增的包又可能命中规则，所以“找规则”和“准备代码”要交替进行。先看下面的房间查询动画。

为什么需要它：自动插入的新调用也需要真实的 Go 代码。如果只选出了规则，却没让对应的记录包进入构建，后续改写出来的代码就找不到需要的材料。

## 本页名词

- **Preprocess（构建前准备）**：在正式插桩构建前，把规则和配套 Go 代码准备齐。
- **依赖**：当前代码要用到的其他代码。例如记录包调用 cache，cache 就是它的依赖。
- **匹配 / matchRules**：检查实际会参与构建的包，选出适用的规则。它选出的是清单，还没有把所有配套代码接入。
- **bundles**：选中的规则清单。动画里 B1、B2 分别表示第一次、第二次选出的清单。

输入：业务构建目标（例如 room.FindRoom）、项目的 go.mod、可用规则和 go build 参数。

输出：让最终选中规则所用的代码能参与构建，保存规则，再启动带 toolexec 的正式构建。


## 先确认这个业务项目能按模块找代码

precheck 检查 go.mod 等条件；初始化处理器、备份相关文件。你暂时只要知道：准备阶段会调整构建输入，结束时安排清理。


## 准备①：还没选出业务规则，先加入基础库

bundles 初始为空。newDeps([]) 先生成 OTel 基础 import；syncDeps 调用 go mod tidy，同步依赖。动画画面 2 展示这一刻。

```go
bundles := []*rules.InstRuleSet{}
newDeps(bundles) // 此时 bundles 为空
syncDeps()
```


## 匹配①：现在才知道要哪个业务记录包

matchRules 扫描当前构建范围，得到 B1。动画中它选中 room 规则，规则指向 room-recorder。注意：这条规则是本轮准备之后才选出来的。

```go
B1 := matchRules()
// 选出了 room 规则，还没有执行 newDeps(B1)
```


## 准备②：接入 B1，新代码可能又带来其他包

newDeps(B1) 把已选规则的 import 和模块信息加进去，再同步。动画里 room-recorder 引用了 cache，于是 cache 也参与构建。

```go
newDeps(B1)
syncDeps()
// 现在能在构建范围中看到 cache 了
```


## 匹配②：按变化后的构建范围再选一次

再调用 matchRules，得到 B2。动画中新增的 cache 命中自己的规则；它对应的 cache-recorder 又是新的准备需求。实际项目也可能因为加入包而改变版本选择。

```go
B2 := matchRules()
// B2 可能和 B1 不同
```


## 准备③：把第二次匹配的结果落实，然后停止匹配

newDeps(B2) 和 syncDeps 把最终清单所需的代码接入。第三轮没有 matchRules。如果第二次匹配没有相关变化，第三次准备可能不增加新模块；当前源码仍固定执行这一轮。

```go
newDeps(B2)
syncDeps()
// 没有第 3 次 matchRules()
```


## 把准备好的结果交给正式构建

updateRule 修正规则路径，store 保存规则，然后 runBuildWithToolexec 开始正式插桩构建。前面是在备齐材料；这里才把观察动作接到目标函数的编译输入里。

```go
updateRule(B2)
store(B2)
runBuildWithToolexec(goBuildCmd)
```


## 对应源码

`bundles := make([]*rules.InstRuleSet, 0)`：最初还没有匹配结果，所以第一次 newDeps 只能先准备基础代码。

`for i := 0; i < 3; i++`：实际固定循环三次，不是 Go 语言的规定，也不是一直循环到完全不变。

`dp.newDeps(bundles) → dp.syncDeps()`：用上一轮的规则清单生成 import、补模块信息，再调用 go mod tidy；vendor 模式还会更新 vendor。

`if i == 2 { continue }`：第三次准备后直接跳过匹配；总共只有两次 matchRules。

`bundles, err = dp.matchRules()`：本次新选出的规则，要等到后面的准备步骤，才能把配套代码接入。

`runBuildWithToolexec(dp.goBuildCmd)`：依赖与规则准备结束后，再启动编译工具包装与源码改写流程。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/preprocess.go#L249)

- 日志写 Round 3 of rule matching，也不能理解成三次真正的匹配；第三轮在调用 matchRules 前已经 continue。
- 三轮不是每个项目在理论上都不可缩减。若要优化，需要证明前后规则与依赖没有相关变化，不能直接把循环次数改小。
- 固定两次匹配不等于对任意深度的自定义依赖链都已找到全部规则；源码没有做到自动检查收敛。
- 这里只是构建前准备；不表示请求执行三次，也不表示自动产生三个相同 Span。
- 非 debug 路径会尝试清理生成文件与恢复备份；清理错误被忽略，不能据此承诺所有情况都完整恢复。

自问：动画里只做一轮时，room 规则已经选出来了，为什么仍不够？

参考解释：因为这一轮的 newDeps 发生在匹配之前，收到的还是空清单。room 规则是之后才选出来的，需要下一次 newDeps(B1) 接入它的记录包。


# 源码讲解：toolexec：把每次编译器调用接到工具上

runBuildWithToolexec 取出当前可执行文件，把它放进 go build 的 -toolexec 参数；Go 后续调用 compile/link 时会先经过这个程序。

为什么需要它：一个 go build 会编译很多 package，所以工具必须在每个编译 action 的边界观察，而不是只拦截一次总命令。

## 本页名词

- **-toolexec**：Go build 用来替换/包装底层工具调用的选项。
- **compile action**：针对一个 package 的具体编译动作。
- **build cache**：Go 根据输入与参数复用已生成产物的缓存。

输入：原始 goBuildCmd、当前可执行文件路径、构建工作目录、缓存和 debug 配置。

输出：追加 -toolexec、-work 或 -a、调试 gcflags 后的新 go build 参数。


## 找自己的可执行文件

os.Executable 返回当前工具路径，避免硬编码安装目录。


## 插入代理参数

args 先保留 go build 的前两个参数，再追加 -toolexec=当前程序 CompileRemix。


## 控制构建输入

没有 Go cache 配置时追加 -a 强制重编译；debug 时追加 -N -l。


## 保留用户参数

goBuildCmd[2:] 原样追加，最后仍由 Go 处理目标包和输出。

```sh
go build -toolexec="/path/otel remix" -work -a ./...
```


## 对应源码

`args = append(args, "-toolexec="+exe+" "+CompileRemix)`：代理入口是当前工具加 remix 子命令。

`args = append(args, util.BuildWork)`：保留构建工作目录，方便查看临时编译输入。

`args = append(args, "-a")`：无缓存路径时选择强制重编译；这是源码中的策略。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/preprocess.go#L158)

- 把 toolexec 当成只执行一次的 wrapper。
- 把 -a 解释成“插桩成功”的证明。
- 只看最终二进制，不看 compile action 日志。

自问：go build 为什么会重复调用编译器？

参考解释：因为依赖图里每个 package 都可能触发独立 compile action，-toolexec 让这些调用逐个经过工具。


# 源码讲解：为什么插桩要改 go.mod？

这里修改的是业务原来那一份 go.mod。后文的 HTTP 记录模块属于 LoongSuite 源码，在业务仓库之外。工具要让业务构建找得到这份外部代码；不要求 业务项目 多建 go.mod。

为什么需要它：原来程序只负责查房间。自动插桩后，它还要运行额外的观察函数。这些函数也写在 Go 包里，不会因为 otel 工具已经安装，就凭空出现在业务程序中。因此，工具需要准备依赖声明和导入代码，再交给 Go 构建。

## 本页名词

- **包（package）**：一组一起编译的 Go 源文件。你调用的函数属于某个包。
- **模块（module）**：把一组包放在一起管理版本的单位，根目录有自己的 go.mod。业务项目和探针代码可以属于不同模块。
- **go.mod**：模块的说明文件，声明模块名、Go 版本要求和外部模块依赖等。
- **import**：写在 .go 文件里，说明这个文件要导入哪个包。
- **require**：写在 go.mod 里，声明需要哪个模块和哪个版本；它不是调用函数的指令。
- **replace**：也写在 go.mod 里：需要这个模块时，改用另一版或指定本地目录的源码。
- **hook（观察函数）**：在目标函数进入或退出时执行的额外 Go 函数，例如记录调用的开始和结束。hook 包提供这些函数。
- **运行时支持 / SDK**：最终程序执行时要用的支持库。OTel SDK 负责组织、处理和导出链路记录；与构建时执行的 otel 命令分开。

输入：业务项目的 go.mod 文件，加上本次需要补入的模块清单。每项列出模块路径、版本，以及是否改用某个替代源码位置。

输出：addDependency 把缺失的 require / replace 声明写回这个 go.mod，已有同路径声明不被它直接覆盖。调用它的 newDeps 还负责生成导入观察包的 Go 文件。


## 从最简单的业务项目开始

假设业务模块叫 example.com/app，原来的 main.go 只用 Go 标准库 net/http。标准库随 Go 提供，不需要单独写进 require。先看业务原来的 go.mod：

```go.mod
module example.com/app

go 1.25.0
```


## 工具想接入一份 HTTP 观察代码

nethttp.json 规则的 Path 指向 github.com/alibaba/loongsuite-go/pkg/rules/http。这个目录有自己的 go.mod，提供 HTTP hook。newDeps 会生成独立的 Go 文件，把它导入业务构建。下面是这份文件的一小部分，不是 go.mod：

```go
package main

import _ "github.com/alibaba/loongsuite-go/pkg/rules/http"
```


## 为什么 import 前有一个下划线？

普通 import 通常用来调用包里导出的名字。import _ 表示不使用这些名字，但仍把包作为依赖纳入构建，并执行它的初始化。这里还需要后续的跳板改写把目标调用接到 hook；单有这行 import 不会自动记录每次 HTTP 请求。


## 给 go.mod 补上这个模块的声明

生成的文件有了新 import，业务构建也要能解析其所属模块。工具使用下面这个占位版本，并同时给它准备本地 replace。长版本号不是让你猜一个发布版本；它与本地替代目录一起使用。下面仍是简化的 go.mod，不是最终全部依赖清单：

```go.mod
module example.com/app

go 1.25.0

require github.com/alibaba/loongsuite-go/pkg/rules/http v0.0.0-00010101000000-000000000000

replace github.com/alibaba/loongsuite-go/pkg/rules/http => ../loongsuite-go/pkg/rules/http
```


## replace 回答“实际代码在哪儿”

上例假设旁边恰好有 ../loongsuite-go 这份源码；这只是便于阅读的目录布局。工具会计算实际所在目录，不要求你把仓库放到这个路径。require 声明模块需求，replace 把它指向这份本地 hook 源码。hook 自己还需要的其他模块，会继续参与 Go 的依赖解析。


## 记录库也要进入业务构建

newDeps 还会导入基础支持包，例如下面的 pkg。它有独立的 pkg/go.mod。pkg/inst-api 只是这个模块内的一个包，不是另一个独立模块。由 hook 调用的记录库在业务程序运行时工作，不能只存在于构建工具的依赖里。下面还是生成 Go 文件的片段：

```go
package main

import _ "github.com/alibaba/loongsuite-go/pkg"
```


## 最后回到 addDependency：只补缺失项

它做的事情很朴素：读取 go.mod → 逐项检查已有 require → 缺失才补 → 按需检查并补 replace → 有变化才写回文件。它没有在这里创建 Trace，也没有在这里改目标函数体；那是后续步骤的工作。


## 对应源码

`gomod`：函数参数：本次要修改的 go.mod 文件路径，属于被插桩的业务项目。

`dependencies []Dependency`：另一项参数：本次要补入的模块清单。Dependency 这个结构把模块路径、版本和替代位置放在一起。

`modfile, err := parseGoMod(gomod)`：把 go.mod 文本读成程序能检查和修改的数据。err 用来报告读取或解析失败。

`for _, r := range modfile.Require`：逐条查看文件已经声明的 require，比较模块路径是否等于本次需要的路径。

`if !alreadyRequire { ... AddRequire(...) }`：alreadyRequire 表示“已经声明过”。前面的 ! 表示“没有”；只有缺失时，才加入模块路径和版本。

`if dependency.Replace { ... }`：这项依赖是否要求替代源码？如果需要，再检查已有 replace，缺失才调用 AddReplace。

`if changed { ... writeGoMod(gomod, modfile) }`：只有清单真的改变了，才写回 go.mod。完整函数见下面的固定源码摘录。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/add.go#L36)

- require 与 import 各管一件事：声明模块版本，不等于调用其中的函数，也不等于把整个模块全编进去。
- 业务项目能找到 hook，不等于目标函数已经接上 hook；还要完成匹配、改写、编译，并在运行时走到对应调用。
- 规则中的 Dependencies 前置条件，是检查业务有没有规则需要的库和版本；本页补入的依赖，是让新增代码能编译。两者不能混为一谈。
- “不覆盖已有声明”只描述 addDependency 这个函数；完整预处理还会同步依赖，不能据此保证 go.mod 的其他内容都完全不变。

自问：工具已经安装好了，为什么业务 go.mod 还可能需要改？

参考解释：因为工具是加工程序，hook 和记录库是生成后的业务程序需要使用的代码。工具自己能运行，不能代替业务构建对这些库的解析。newDeps 准备导入，addDependency 补声明，后面的改写再把实际调用连接起来。


# 源码讲解：规则加载：JSON 先变成具体 Go 类型

loadRuleFile 读文件，loadRuleRaw 先把 JSON 解成一组原始对象，再根据是否有 Function 或 StructType 选择对应规则结构。

为什么需要它：不同规则需要不同字段和改写逻辑；先辨认类型，后面 instrument 才能安全调用函数规则或结构体规则。

## 本页名词

- **JSON**：文本格式的对象/数组数据。
- **RawMessage**：先保留一段 JSON，稍后按具体结构解码。
- **InstFuncRule**：针对函数/方法的规则类型。
- **InstStructRule**：针对结构体类型的规则类型。

输入：规则文件路径和 JSON 数组；nethttp.json 中有 net/http 的 RoundTrip、ServeHTTP 条目。

输出：[]rules.InstRule；每一项实际指向函数规则、结构体规则等具体对象。


## 读取文本

util.ReadFile 失败时带当前目录返回错误，便于定位相对路径问题。


## 拆成数组

json.Unmarshal 将整个文件变成 []json.RawMessage，而不是直接猜一种结构。


## 判断字段

有 Function 就解成 InstFuncRule，有 StructType 就解成 InstStructRule。


## 交给匹配器

所有具体对象装进 []rules.InstRule，后续按包、版本等条件筛选。

```json
[{"ImportPath":"net/http","Function":"RoundTrip","ReceiverType":"\*Transport"}]
```


## 对应源码

`var rawMessages []json.RawMessage`：允许同一个数组包含不同规则形状。

`if _, ok := obj["Function"]; ok`：Function 字段存在时选择函数规则。

`rule = &funcRule`：接口里保存具体规则指针，后续可用类型 switch。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/preprocess/match.go#L79)

- 把 JSON 解析成功等同于规则一定命中。
- 忘记规则字段名大小写。
- 固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。

自问：规则文件如何变成 InstRule？

参考解释：先读文本、解数组、按关键字段选择具体 struct，再以 InstRule 接口统一返回。


# 源码讲解：规则模型：同一条规则带着哪些约束

InstRule 接口统一暴露库版本、Go 版本、目标 import、hook 路径和字符串表示；InstBaseRule 保存这些字段。

为什么需要它：规则不是“见函数名就改”，它还要回答目标库版本、Go 版本和 hook 代码在哪里。

## 本页名词

- **interface**：只声明方法集合的 Go 类型。
- **版本区间**：如 [1.9.1,1.9.2)，表示左闭右开范围。
- **ImportPath**：被插桩目标包的完整导入路径。
- **Path**：本地 hook 代码所在 module/path。

输入：一个具体规则对象和目标 package 的库版本、Go 版本。

输出：匹配器可读取的版本/路径信息，以及后续定位 hook 的 Path。


## 从接口读契约

GetVersion、GetGoVersion、GetImportPath、GetPath 是所有规则都要回答的问题。


## 理解两个版本

Version 约束被改的库；GoVersion 约束编译器。两者不是同一个范围。


## 理解路径角色

ImportPath 指目标库，例如 github.com/gin-gonic/gin；Path 指 hook 代码位置。


## 用 String 做诊断

String 让日志或测试能看到完整规则，而不必猜接口动态类型。


## 对应源码

`Version string `json:"Version,omitempty"``：库版本范围可为空；为空意味着不按该字段限制。

`GoVersion string `json:"GoVersion,omitempty"``：Go 版本范围单独保存。

`func (rule *InstBaseRule) GetPath() string`：返回 hook 代码路径，不是目标源码路径。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/rules/base.go#L32)

- 把 Path 当成目标库源文件路径。
- 把空 Version 解释成支持所有未来版本的保证。
- 把 GoVersion 和库 Version 拼成一个区间比较。

自问：Go 版本范围和库版本范围有什么区别？

参考解释：前者筛编译环境，后者筛被改写的库；任一不满足都不应使用这条规则。


# 源码讲解：规则集合：一个编译 package 的工作篮子

InstRuleSet 按 import path 保存一个编译 action 的文件、函数、结构体规则和 cgo 标记。

为什么需要它：同一个 package 只需选择一套规则，instrument 可以按文件集中解析、按类型执行。

## 本页名词

- **rule set**：对一个目标 package 聚合后的规则集合。
- **map**：键到值的映射；这里把函数名映射到多条函数规则。
- **cgo**：Go 与 C 交互的编译边界，可能影响源文件处理。

输入：import path 和已经筛选出的 InstRule。

输出：含 PackageName、ImportPath、FileRules、FuncRules、StructRules 的集合。


## 创建空集合

NewInstRuleSet 初始化切片和两个 map，避免后面向 nil map 写入。


## 按类别放入

文件规则单独保存；函数和结构体规则按名字归类。


## 记录目标

ImportPath 让集合只服务于一个 package；PackageName 供生成代码使用。


## 检查有效性

IsValid 只有在至少有一种规则时才返回 true。

```go
if rset == nil || !rset.IsValid() {
    return nil
}
```


## 对应源码

`FuncRules map[string][]*InstFuncRule`：同名函数可以对应多条规则，但键是函数名。

`StructRules map[string][]*InstStructRule`：结构体规则使用另一张表，执行时按类型分派。

`IsValid()`：nil 或三类规则全空时不会误认为可插桩。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/rules/bundle.go#L22)

- 以为一个 package 可以同时套用多个互相冲突的集合。
- 忘记初始化 map 导致写入 panic。
- 把 HasCgo 当成“所有文件都是 C 代码”。

自问：为什么一个 package 选择一个 rule set？

参考解释：match 明确返回第一个匹配集合；集合内部再容纳不同类型规则，避免跨 package 混用。


# 源码讲解：编译 action 匹配：从 -p 找到目标包

match 从编译器参数取出 -p 的 import path，遍历规则集合，路径相等时返回第一个集合。

为什么需要它：真正被编译的是一个个 package action；必须先知道当前 action 的包，才能应用正确规则。

## 本页名词

- **flag**：命令参数中的选项，如 -p。
- **import path**：包的完整路径，不是磁盘目录名。
- **first match**：遍历顺序中第一个满足条件的集合。

输入：toolexec 传来的 args，其中包含 -p 目标 import path，以及所有 rule set。

输出：匹配的 *InstRuleSet；找不到时返回 nil。


## 读取 -p

FindFlagValue(args, "-p") 取当前编译 action 的包路径。


## 做安全检查

路径为空会触发 sanity check，说明调用方传入不符合预期。


## 逐个比较

源码用 rset.ImportPath == importPath；这里不是正则，也没有按 Function 做匹配。


## 交给 instrument

找到集合后才进入 AST 改写；没有集合就跳过该 package。


## 对应源码

`importPath := util.FindFlagValue(args, "-p")`：输入来自 Go 编译动作参数。

`if rset.ImportPath == importPath`：包路径精确相等才命中。

`return nil`：未命中不是错误，表示这个 package 没有规则。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/match.go#L44)

- 把 -p 当磁盘绝对路径。
- 把匹配优先级误认为 Function 正则优先级。
- 认为未命中一定代表工具失败。

自问：规则优先级和版本区间怎样决定命中？

参考解释：本函数只按 import path 精确选择第一个集合；版本范围应在更早筛选阶段处理，不能凭此函数推断更多优先级。


# 源码讲解：AST 插桩总流程：先文件，再函数和结构体

instrument 按文件分组规则，先应用可能新增文件的规则，再解析目标文件一次，最后按具体规则类型改写 AST/DST。

为什么需要它：AST 是源码的树形结构：函数、参数、return 都是节点。改树比字符串替换更能保留语法结构和格式信息。

## 本页名词

- **AST**：把源码表示成节点树的语法结构。
- **DST**：保留更多源码位置/装饰信息的 Go 语法树库。
- **parse**：把源码文本变成可遍历的语法树。
- **group**：把同一文件的多条规则聚在一起。

输入：一个已命中的 InstRuleSet、目标文件和文件/函数/结构体规则。

输出：写回包含 hook/trampoline 改写的源码或临时编译输入。


## 先应用文件规则

文件规则可能创建 raw rule 需要的新文件，所以源码明确要求它们先执行。


## 按文件分组

同一文件只 parse 一次，避免每条规则重复读源码。


## 解析 AST/DST

parseAst 将文本变成树；树能区分函数声明、receiver、返回列表。


## 按类型改写

函数走 applyFuncRule，结构体走 applyStructRule；任何 error 都立即返回。


## 对应源码

`for _, rule := range rset.FileRules`：文件规则拥有最先改变文件集合的机会。

`root, err := rp.parseAst(file)`：输入源码先变成语法树。

`switch rt := r.(type)`：Go 类型 switch 把统一接口还原成具体规则。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/instrument.go#L180)

- 把 AST 当运行时对象，而不是编译前数据。
- 直接字符串拼接括号和逗号，容易生成非法 Go。
- 忽略同一文件多规则需要共享一次解析树。

自问：为什么使用 dave/dst 而不是直接字符串替换？

参考解释：树节点能表达函数和返回值结构，改写后再打印源码，较不容易破坏语法；这是编译前源码变换，不是运行时反射。


# 源码讲解：函数 AST 改写：在入口和返回处接上 hook

createTJumpIf 生成局部 CallContext、onEnter 调用、skip 判断和 onExit 调用，再把返回值交给原函数返回。

为什么需要它：hook 要同时看到原参数和返回值；直接包一层字符串函数很难处理命名/匿名返回值、receiver 和多返回值。

## 本页名词

- **receiver**：方法声明中位于 func 后括号里的接收者。
- **多返回值**：一个 Go 函数同时返回多个值，如 (string,error)。
- **trampoline jump**：从原函数入口跳到生成的 hook 桥接逻辑。
- **匿名返回值**：返回类型存在但结果没有名字的函数签名。

输入：InstFuncRule、函数声明、参数名和返回值名；无名返回值需要工具生成可用名字。

输出：函数体入口的 hook 调用、可选跳过原调用的分支，以及离开前的 onExit。


## 收集参数

createHookArgs(args) 把目标函数参数转换成 onEnter 需要的表达式。


## 准备返回值

retVals 传给 onExit；如果原函数返回值没有名字，生成逻辑先为它们准备可引用的名字。


## 生成唯一变量

规则字符串经过 CRC32 得到后缀，避免同一文件里局部变量重名。


## 组织控制流

先 onEnter，再检查 skip；原调用返回后调用 onExit，最后返回 retVals。

```go
callCtx, skip := onEnter(args...)
if skip { onExit(callCtx, returns...); return returns... }
```


## 对应源码

`varSuffix := util.Crc32(t.String())`：变量后缀由规则内容稳定生成。

`argsToOnEnter := createHookArgs(args)`：输入参数进入 onEnter。

`argsToOnExit = append([]dst.Expr{argCallContext}, argsToOnExit...)`：onExit 的第一个参数是 CallContext，后面才是返回值。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/apply_func.go#L178)

- 把 hook 当成替换整个函数指针。
- 认为 Function 字段是正则；实际 v1.15.0 按名字相等，ReceiverType 才按正则。
- 跳过原调用后忘记构造/传递返回值。
- 固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。

自问：如何保证命名/匿名返回值都能 hook？

参考解释：改写阶段把返回表达式统一收集为可引用变量，再用同一组名字构造 onExit 和 return。


# 源码讲解：Trampoline：用生成函数桥接 enter、原函数和 exit

materializeTemplate 解析模板，把 onEnter、onExit 和 CallContextImpl 方法声明放进待生成声明列表。

为什么需要它：trampoline 是函数入口里的 defer/桥接逻辑，不是替换函数指针；它让生成代码能在不改业务 hook 签名的情况下传递上下文。

## 本页名词

- **template**：生成源码前的函数声明模板。
- **onEnter**：原函数调用前运行的 hook。
- **onExit**：拿到返回值后运行的 hook。
- **defer**：函数返回时执行的 Go 语句机制；模板可用它桥接退出。

输入：trampolineTemplate 文本和 AST parser。

输出：可插入目标包的函数声明、CallContext 方法和 hook 桥接代码。


## 解析模板

ParseSource 把模板源码变成 AST，而不是把文本直接拼到业务函数中。


## 筛选函数声明

名字等于 onEnterName/onExitName 的函数分别保存。


## 收集 receiver 方法

有 receiver 的声明被断言为 CallContextImpl 方法并加入列表。


## 等待入口跳转

这些声明只是桥的材料；createTJumpIf 再把对它们的调用插入目标函数。


## 认识 hook panic 的保护边界

impl.tmpl 的 enter/exit 桥接函数用 defer + recover 捕获 hook panic，打印错误和可用的栈信息后返回。通常让原调用继续，但不能撤销 hook 已产生的副作用，也不能把没有崩溃当成 hook 成功。


## 对应源码

`astRoot, err := p.ParseSource(trampolineTemplate)`：模板自身也必须是合法 Go。

`decl.Name.Name == trampolineOnEnterName`：按约定识别 enter 函数。

`ast.HasReceiver(decl)`：带 receiver 的声明被当作 CallContextImpl 方法。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/instrument/trampoline.go#L76)

- 把 trampoline 说成换函数指针。
- 认为模板能随意 import 新包；生成位置和依赖仍要满足 Go 编译。
- 认为 defer 一定能处理进程级 os.Exit。

自问：hook 自己发生 panic，原业务就一定会 panic 退出吗？

参考解释：不一定。模板中的 enter/exit 桥有 recover，会捕获并报告 hook panic。仍需检查 hook 失败、返回状态和已发生的副作用；也不要把这个机制当成处理原业务所有 panic 的承诺。


# 源码讲解：CallContext：enter 和 exit 之间的共享小信封

CallContext 接口保存 skip 标记、普通 data、按 key 的 data、原参数、返回值和函数元信息。

为什么需要它：hook 不需要知道生成代码的局部变量名；它通过这个接口读取或改变约定中的输入输出。

## 本页名词

- **interface**：hook 看到的是方法契约，不必依赖具体 struct。
- **skip**：让生成代码跳过原函数调用。
- **param**：原函数的某个参数，按下标访问。
- **return value**：原函数的某个返回值，按下标访问。

输入：onEnter 传入的 CallContext 和原始参数；onExit 得到同一个 CallContext 与返回值。

输出：hook 对参数/返回值的读取或修改，以及是否执行原调用的决定。


## 先决定是否跳过

SetSkipCall(true) 会影响原函数是否执行；这不是只读日志。


## 在两端传数据

SetData/GetData 或 key data 可把 onEnter 的计算交给 onExit。


## 按下标读写

GetParam/SetParam 和 GetReturnVal/SetReturnVal 按位置访问。目标是方法时，参数列表先包含 receiver，再包含普通参数；不要仅按括号里的参数猜下标。


## 谨慎改业务值

非泛型目标函数支持通过生成的 setter 改参数和返回值；类型和位置必须正确。泛型目标的 SetParam / SetReturnVal 不受支持，生成方法会 panic；在 enter/exit 中调用时，panic 可能被桥的 recover 捕获，不能把“进程没退出”当成修改成功。

```go
// 真实 HTTP hook 的签名形态；片段，省略 import 与函数体
func clientOnEnter(c api.CallContext, t *http.Transport, req *http.Request) {
    // 第 0 个目标参数是 receiver t，第 1 个才是 req
}
```


## 对应源码

`SetSkipCall(bool)`：公开的控制开关。

`SetData(interface{})`：enter/exit 共享一个任意值。

`GetParam(idx int)`：参数按原函数位置读取。

`SetReturnVal(idx int, val interface{})`：非泛型目标中可替换返回值；泛型目标的生成实现会 panic，不支持这种修改。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/api/api.go#L27)

- 把 CallContext 当 context.Context。
- 用错误下标读取参数，运行时才暴露问题。
- 随意 SetParam/SetReturnVal 改变业务协议。
- 把泛型目标当成也支持 SetParam / SetReturnVal；对应生成方法会 panic，且 hook panic 可能被桥捕获。

自问：SetParam 为什么可能改变业务行为？

参考解释：对支持修改的非泛型目标，生成代码会把替换值交给原函数或调用者。对泛型目标，这两个 setter 不受支持，不能用它们实现修改。


# 源码讲解：CallContextImpl：先读测试版，再找生成版

当前文件 pkg/api/impl.go 开头写明“仅用于测试”。它用简单字段实现 CallContext，方便测试 hook；真正插入业务包的实现来自另一份模板。

为什么需要它：先看简单字段，比较容易理解 enter 和 exit 怎样共享数据。但要二开生成行为，必须再去看 tool/instrument/impl.tmpl 和 trampoline.go，不能只改这份测试帮手。

## 本页名词

- **接口**：规定有哪些可调用方法；不要求每个实现都使用相同内部字段。
- **测试帮手**：测试中构造接口对象的简化实现，不能直接推断它就是生产生成代码。
- **slice（切片）**：按下标存放多个元素，例如测试中的参数列表。
- **生成模板**：工具据此创建并改写真实代码的底稿。

输入：测试代码准备的 Params、ReturnVals、SkipCall 和 Data 字段，以及对接口方法的调用。

输出：测试中可使用的 CallContext 对象。实际业务插桩会使用生成到目标包内的实现，类型还会按规则带上 CRC 后缀。


## 先看文件里的用途说明

For testing purpose only 已限定了这个类型的角色。读源码不仅看类型名，也要看它由谁创建、在哪个构建里使用。


## 把方法对上普通字段

SkipCall 存是否跳过，Data 存 enter/exit 共享数据；Params 和 ReturnVals 存测试准备的参数与结果。


## 注意 getter 返回的是地址

测试实现的 GetParam 返回 &c.Params[idx]，GetReturnVal 返回 &c.ReturnVals[idx]。它们不是把元素原值直接返回；用 interface{} 接到以后还需按具体类型理解。

```go
func (c *CallContextImpl) GetParam(idx int) interface{} {
    return &c.Params[idx]
}
```


## 按 key 存数据也有类型条件

SetKeyData 在 Data 为 nil 时创建 map；如果你先用 SetData 放了其他类型，再把它断言为 map，会 panic。


## 最后找真实生成位置

tool/instrument/impl.tmpl 提供模板；trampoline.go 把它解析、按目标签名改写，并给相关类型加 CRC 后缀。生产修改要沿这条生成路径核验。


## 对应源码

`// For testing purpose only`：上游直接声明这是测试用实现。

`Params []interface{}`：测试对象保存参数的切片；并非生成代码必须永远采用的外部稳定字段。

`return &c.Params[idx]`：返回切片元素地址。这里的 & 不能在阅读时忽略。

`c.Data.(map[string]interface{})[key]`：这次类型断言要求 Data 确实是这种 map。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/api/impl.go#L18)

- 把测试实现当成实际注入目标包的唯一实现。
- 只改 pkg/api/impl.go，就以为改变了真实 trampoline。
- 忽略 getter 的地址返回和 Data 的类型断言。

自问：想改变真实插桩生成的 CallContext，只改这个文件够吗？

参考解释：不够。这是测试帮手；真实路径要看 impl.tmpl 以及 trampoline.go 对模板的解析、签名改写和重命名，再检查生成到目标包的代码。


# 源码讲解：go:linkname：跨包符号的窄桥

runtime_linker.go 用 go:linkname 给变量/函数指定链接符号名，让生成 hook 能找到运行时实现。

为什么需要它：普通 Go 包边界不允许直接引用这些内部符号；这座桥让工具生成代码和 runtime rule module 连接起来。

## 本页名词

- **symbol**：链接器用来识别函数或变量的名字。
- **linker**：把各 package 编译产物连接成程序的工具。
- **ABI**：调用方与被调用方约定参数、寄存器和布局的低层接口。
- **unsafe**：允许绕过部分普通类型安全边界的标准库包。

输入：带 go:linkname 的声明、runtime rule module 和匹配的 Go toolchain。

输出：生成代码可调用的符号入口；编译/链接成功并不等于 ABI 永久稳定。


## 看声明不是实现

var otel_get... = _otel... 把一个可见名字绑定到实现函数。


## 看符号名

go:linkname 两侧名称决定链接器寻找哪个符号。


## 识别版本边界

目标 runtime 私有字段、ABI 和编译器可能变化；这不是普通包 API。


## 先验证最小构建

更改 Go 版本或 rule module 后先编译最小 fixture，再谈兼容性。


## 对应源码

`//go:linkname otel_get_trace_context_from_gls otel_get_trace_context_from_gls`：给链接器指定跨包符号名。

`var otel_get_trace_context_from_gls = _otel_gls_get_trace_context_impl`：生成/调用侧获得一个命名入口。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/runtime/runtime_linker.go#L27)

- 把 linkname 当普通 import。
- 认为能链接就代表未来 Go 版本也兼容。
- 在没有查证 ABI/源码时承诺支持所有 toolchain。

自问：linkname 为什么受 Go 版本和 ABI 影响？

参考解释：它绕过普通包可见性，依赖链接符号和调用布局；Go runtime 或编译器改变就可能失效。


# 源码讲解：GLS：工具提供的协程上下文桥

GLS 函数通过 getg().m.curg 读写当前 goroutine 的 trace context、baggage 和调用深度字段。

为什么需要它：Go 原生不会自动把 context.Context 复制给新 goroutine；这里是额外的 runtime/tool hook 机制，不是语言保证。

## 本页名词

- **GLS**：这里指工具维护的 goroutine-local storage，不是 Go 标准库。
- **goroutine**：Go runtime 调度的轻量执行单元。
- **baggage**：随传播上下文携带的键值信息。
- **nosplit**：告诉编译器该函数不插入栈增长分裂点的指令。

输入：当前 goroutine 的 runtime 结构和被注入的字段。

输出：trace context、baggage 的读取/写入结果，以及 producer call depth 计数。


## 读当前执行单元

getg().m.curg 取得当前 goroutine 结构；这依赖特定 runtime 形状。


## 读取上下文

get trace/baggage 函数返回对应字段的 interface{}。


## 写回上下文

set 函数把 hook 产生的值放回当前结构。


## 别替代显式交接

预创建 worker、消息和跨进程边界仍应传递 context/carrier；GLS 只覆盖工具识别的路径。


## 对应源码

`return getg().m.curg.otel_trace_context`：trace context 从当前 goroutine 结构读取。

`getg().m.curg.otel_baggage_container = v`：baggage 由 runtime bridge 写回。

`//go:nosplit`：runtime 低层函数使用了特殊编译约束。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/rules/runtime/runtime_linker.go#L48)

- 把 GLS 说成 context.Context。
- 把 goroutine 创建理解成一定自动继承。
- 忽略 runtime 字段和 Go 版本的兼容风险。

自问：为什么 goroutine 创建不是普通 context 继承？

参考解释：因为 Go 规范只保证显式变量/参数访问，不保证隐式 context 传播；GLS 是额外工具机制。


# 源码讲解：自定义 Hook：普通 Go 函数也要遵守连接约定

文档示例创建 hook module，导入 api.CallContext 和目标库，并用 go:linkname 把 OnEnter 名称接到生成调用点。

为什么需要它：hook 不是魔法插件；它最终是被编译进目标程序的普通 Go 函数，但参数顺序必须和目标函数对应。

## 本页名词

- **hook**：在目标函数前后执行的普通 Go 函数。
- **blank import**：import _ "unsafe" 等只为初始化/指令生效而导入的包。
- **OnEnter**：目标函数调用前的 hook。
- **OnExit**：目标函数返回后接收返回值的 hook。

输入：目标函数签名、api.CallContext、hook module 的 go.mod 和 linkname 名称。

输出：可被生成 trampoline 调用的 enter/exit 函数；返回值和参数类型可通过编译检查。


## 建立 hook 自己的模块

上游通常放在 pkg/rules 下；自定义规则也可以指向项目外的本地模块。这个模块自己的 go.mod 必须能解析，Path 要能定位到它。


## 先读原方法的签名

RoundTrip 不只有 req 参数；前面的 (t *http.Transport) 是 receiver，表示这个方法属于 Transport。以下为方法声明形态，省略函数体，不能单独编译。

```go
func (t *http.Transport) RoundTrip(req *http.Request) (*http.Response, error)
```


## 进入 hook：先上下文，再 receiver，再普通参数

这是 HTTP 方法 hook 的形态。CallContext 固定放首位；方法 receiver 是下一个参数，之后才跟 req。下面是签名片段，仍需模块、import、连接声明及实现。

```go
func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request) {
    // 先只读观察，不改变原始参数
}
```


## 退出 hook：接收原返回值

退出 hook 在 CallContext 后接方法的返回值，不重复传入 receiver。函数和方法的 enter 参数规则要区分。下面也是片段。

```go
func clientOnExit(call api.CallContext, res *http.Response, err error) {
    // 检查结果；按需要结束观察记录
}
```


## 先验证只读连接，再考虑修改值

先证明 hook 命中、被调用、原返回值保持正确。再考虑 SetParam / SetReturnVal；泛型目标不支持这两个修改方法，生成实现会 panic。


## 对应源码

`import _ "unsafe"`：示例为 linkname 指令准备 unsafe 导入。

`//go:linkname muxRoute130OnEnter github.com/gorilla/mux.muxRoute130OnEnter`：hook 名字链接到目标包内生成的符号。

`func muxRoute130OnEnter(call api.CallContext, req *http.Request, route interface{})`：CallContext 必须排在第一个，后续参数匹配目标。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/docs/dev/hook.md)

- 把 hook 当成可自动注入任意依赖的容器。
- enter/exit 参数顺序与目标函数不一致。
- 没有目标版本范围就宣称 hook 永远兼容。
- 方法 hook 漏掉 receiver，导致剩余参数全部错位。

自问：hook 参数为什么必须先放 CallContext？

参考解释：生成代码按这个固定位置传入共享对象。普通函数接着是普通参数；方法接着先是 receiver，再是普通参数。退出 hook 则接收返回值。


# 源码讲解：规则 JSON：把目标函数和 hook 名字写成数据

nethttp.json 用 ImportPath、Function、ReceiverType、OnEnter、OnExit、Path 描述 net/http 的两个目标方法。

为什么需要它：把匹配条件从 Go 代码抽成数据，工具就能加载、筛选、生成统一的改写流程。

## 本页名词

- **ImportPath**：目标包路径，如 net/http。
- **Function**：目标名字；固定实现按名字相等匹配，与文档宣称的正则能力存在差异。
- **ReceiverType**：方法接收者的匹配表达式；源码把它当正则使用。
- **OnEnter/OnExit**：生成调用的 hook 函数名。

输入：JSON 数组和目标编译 package 的声明信息。

输出：InstFuncRule 列表；命中后生成对指定 hook 的调用。


## 先锁包

ImportPath net/http 让规则只考虑这个包。


## 再锁方法

RoundTrip、ServeHTTP 是 Function 字段。当前执行代码按名字相等匹配；虽然文档仍声明支持正则，本指南按固定实现说明，并把差异作为二开时的回归点。


## 用 receiver 区分方法

ReceiverType 如 \*Transport、serverHandler 用于接收者匹配，才是正则语义位置。


## 指定实现位置

Path 指向真实 hook module github.com/alibaba/loongsuite-go/pkg/rules/http。


## 对应源码

`"Function": "RoundTrip"`：目标函数名。

`"ReceiverType": "\*Transport"`：Transport 指针 receiver 的正则表达式。

`"OnEnter": "clientOnEnter", "OnExit": "clientOnExit"`：生成代码要调用的 enter/exit 名称。

`"Path": "github.com/alibaba/loongsuite-go/pkg/rules/http"`：hook module/import 路径。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/tool/data/rules/nethttp.json)

- 把 ReceiverType 的反斜杠 JSON 转义漏掉。
- Path 写成随意目录，导致 hook module 无法解析。
- 固定 v1.15.0 的 FindFuncDecl 实现按名字精确相等，但 docs/dev/rule_def.md 仍写 Function 支持正则；这是文档与实际匹配代码的契约差异。二开要针对所用提交做匹配回归。

自问：如何为一个库版本增加匹配范围？

参考解释：在对应规则条目增加准确的 Version/GoVersion 范围，并用 fixture 验证；不要靠改 Function 名字扩大匹配。


# 源码讲解：运行时入口：从 request 到新的 Span context

InternalInstrumenter.doStart 检查是否启用，再确定 Span 名称和类型，调用 tracer.Start 创建记录与新的 context，随后设置属性并返回。

为什么需要它：编译期命中只说明代码被插入；真正的父子关系和属性要在运行时 context、Tracer 和 SDK 中完成。

## 本页名词

- **context.Context**：显式携带取消、deadline 和 OTel SpanContext 的接口。
- **Span**：一次操作的时间区间和属性容器。
- **Tracer**：创建 Span 的 OTel API 对象。
- **enabler**：决定当前 instrumenter 是否启用的开关。

输入：parentContext、request、时间戳、SpanStartOption 和 instrumenter 配置。

输出：newCtx：包含新 Span 和属性的 context，之后交给后续操作；禁用时直接返回 parentContext。


## 先判断开关

enabler 存在且未启用时，不创建 Span，原 context 原样返回。


## 准备命名和类型

extractor 从 request 得到 spanName、spanKind，并追加时间/类型选项。


## 创建并丰富 Span

tracer.Start 返回 newCtx 与 span；属性 extractor 和 customizer 继续修改它们。


## 把新的 context 交给下游

Span 已由 tracer.Start 放入它返回的 newCtx。最后调用抑制策略的 StoreInContext 钩子；此版本内置实现直接返回 context，不会再额外存一遍 Span。

```go
return i.spanSuppressor.StoreInContext(newCtx, spanKind, span)
```


## 对应源码

`if i.enabler != nil && !i.enabler.Enable()`：禁用路径不创建新 Span。

`newCtx, span := i.tracer.Start(parentContext, spanName, options...)`：父 context 是新 Span 的输入。

`return i.spanSuppressor.StoreInContext(newCtx, spanKind, span)`：调用策略钩子后返回 context；当前内置实现保持它不变。不要仅凭方法名推断它又保存了一份 Span。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/pkg/inst-api/instrumenter/instrumenter.go#L98)

- 把 CallContext 当成 context.Context。
- 看到相同 TraceID 就断言只有一个合法 child span。
- 把 manual OTel 兼容或 existingprovider/otelhttp 去重说成上游默认保证。
- 把 StoreInContext 的名字当作它一定写入 Span 的证据；要继续读该接口的具体实现。

自问：自动 Span 如何沿用 ctx 中的 SpanContext？

参考解释：tracer.Start 接收 parentContext；若其中有有效 SpanContext，SDK 按采样与父子规则创建新 Span。


# 源码讲解：兼容性边界：三种版本要一起看

兼容性不是一个数字：Go toolchain、目标库版本、runtime/ABI 都会影响规则能否编译和运行。

为什么需要它：规则是按源码形状和符号约定写的；库升级、Go runtime 变化或 OTel module 最低版本变化，都可能让旧规则失效。

## 本页名词

- **toolchain**：编译 Go 程序的一组工具和版本。
- **ABI**：低层调用与布局约定。
- **compatibility range**：规则声明能安全匹配的版本区间。
- **GOTOOLCHAIN**：Go 选择本地或自动下载 toolchain 的环境变量。

输入：业务 go.mod 的 Go 版本、目标库版本、LoongSuite commit、规则范围和 runtime 符号。

输出：一个可审计的兼容矩阵：是否满足 Go 最低版本、库规则范围和 runtime/ABI 约束。


## 先看 Go 最低版本

文档说明 OTel v1.42.0 起声明 go 1.25.0，快照固定 v1.45.0，因此工具和被插桩应用都需 Go 1.25 或更高。


## 再看库版本

net/http、GORM、Mongo 等规则要匹配实际源码版本；不能只改业务代码绕过不匹配。


## 再看低层桥

linkname、GLS runtime 字段和 trampoline 结构还有 ABI/编译器风险。


## 做最小验证

记录 go version、GOTOOLCHAIN、go.mod、规则 JSON 和 fixture 构建结果，再扩大测试。

```sh
go version
go env GOTOOLCHAIN
go list -m all
```


## 对应源码

`Minimum Go version: 1.25`：兼容性文档明确给出最低版本。

`GOTOOLCHAIN=auto`：Go 1.24 可能自动下载 1.25；GOTOOLCHAIN=local 时则失败。

`following minor release ... remove compatibility testing`：上游支持窗口会随 Go 新版本滚动，不是永久承诺。

[固定版本源码](https://github.com/alibaba/loongsuite-go/blob/cac400935add57d8219122ba32857b8f55ac6eb1/docs/user/compatibility.md)

- 把“能下载 toolchain”当成规则一定兼容。
- 把库版本范围和 Go 版本范围混为一谈。
- 把 trace 相同解释成没有多个合法 child span。
- 把手工 OTel 兼容补丁当作上游默认行为。

自问：为什么版本不匹配时不能只改业务代码？

参考解释：插桩规则依赖目标源码结构，运行时桥依赖 ABI，注入的 OTel module 又有最低 Go 版本；三者任一变化都可能在编译或运行时失败。


# 每篇文章的动画实例：逐帧文字版

以下是网页教学模拟的可检索记录；不是实际执行 Go 的输出。


## source/go-mod · 让一个小项目找到它需要的代码

业务项目 example.com/live 有 go.mod；插桩工具要额外使用 hook 包。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

先只有业务代码，再把本地规则模块接入 go.mod，最后 Go 才能解析生成的 import。


#### 画面 1：1. 只有业务模块

Go 先读取项目地址。

为什么：没有 module，依赖路径无法确定。

go.mod（教学片段）

```text
module example.com/live

go 1.25.0
```

现在得到：项目有了可被引用的地址。


#### 画面 2：2. 规则生成 import

工具准备一个空白导入文件，想使用 HTTP hook。

为什么：生成代码出现得很早，依赖也必须提前可解析。

otel.runtime.go（教学片段）

```go
package main
import _ "github.com/alibaba/loongsuite-go/pkg/rules/http"
```

现在得到：只写 import 还不够，编译器会找不到模块。


#### 画面 3：3. 加 require 与 replace

工具把规则模块加入依赖，并把它指向本地工具目录。

为什么：http 规则模块自己有 go.mod，不能只替换它路径的上级 pkg；上层 replace 不会自动替换嵌套模块。

go.mod 变化（教学片段）

```text
require github.com/alibaba/loongsuite-go/pkg/rules/http v0.0.0-00010101000000-000000000000
replace github.com/alibaba/loongsuite-go/pkg/rules/http => ../loongsuite/pkg/rules/http
replace github.com/alibaba/loongsuite-go/pkg => ../loongsuite/pkg
```

现在得到：模块地址和本地位置都能解析。


#### 画面 4：4. Go 重新计算依赖

go mod tidy 刷新依赖图，之后编译器才能读到规则代码。

为什么：依赖图稳定后再插桩，避免半途缺包。

模拟输出

```text
go: found github.com/alibaba/loongsuite-go/pkg/rules/http
build: dependency graph ready
```

现在得到：go build 现在能看到工具导入。


go.mod 不是“配置装饰”，它决定生成代码能不能被编译器找到。


## source/cli · 命令入口怎样把参数交给下一站

用户输入 otel go build ./cmd/live，入口程序要识别 go 与 build。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

命令入口不做所有工作，只负责识别动作并把原始参数交给 Preprocess。


#### 画面 1：1. 终端输入

用户输入一条带子命令的命令。

为什么：工具要知道用户想 build 还是执行别的动作。

终端（模拟）

```sh
otel go build ./cmd/live
```

现在得到：参数被拆成三个部分。


#### 画面 2：2. 识别动作

入口读取第二个参数 build。

为什么：动作名决定是否进入插桩流程。

main（示意）

```go
if args[1] == "build" {
    return preprocess(args[2:])
}
```

现在得到：build 被路由到准备阶段。


#### 画面 3：3. 保留剩余参数

目标包和 build flags 原样留下。

为什么：工具不能悄悄吞掉用户的 -tags 或 -o。

传递（示意）

```text
goBuildCmd = ["go", "build", "./cmd/live"]
```

现在得到：下一站拿到完整构建意图。


#### 画面 4：4. 进入 Preprocess

入口只交接，不在这里改 AST。

为什么：职责分开后，参数错误和依赖错误更容易定位。

日志（模拟）

```text
[cli] action=build
[cli] next=preprocess
```

现在得到：命令入口完成交接。


CLI 是前台接待：识别意图、保留参数、交给真正的流水线。


## source/toolexec · 把每一次编译动作接到工具上

go build 会调用 compile 和 link；-toolexec 让包装器先看到这些调用。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

包装器不替代 compiler，而是在它前面观察和改写。


#### 画面 1：1. 普通构建

Go 直接安排 compile。

为什么：先看原始动作，才能知道包装器接在哪里。

模拟命令

```sh
go build ./cmd/live
→ compile package main
```

现在得到：编译器收到原始源码。


#### 画面 2：2. 加 -toolexec

Go 把 compile 先交给 otel 工具。

为什么：工具获得统一入口，可以读取 package 和源文件。

模拟命令

```sh
go build -toolexec=/otel ./cmd/live
→ /otel compile ...
```

现在得到：wrapper 成为中间站。


#### 画面 3：3. wrapper 识别版本探测

wrapper 先原样处理 -V=full。

为什么：Go 用版本探测确认工具兼容；stdout 不能被日志污染。

wrapper（示意）

```go
if arg == "-V=full" {
    exec(original, args...)
}
```

现在得到：探测仍能成功。


#### 画面 4：4. wrapper 再交给 compiler

普通编译参数被完整转发。

为什么：不转发参数会导致编译失败或行为改变。

日志（模拟）

```text
wrapper: tool=compile package=main
wrapper: exec=/usr/local/go/pkg/tool/.../compile
```

现在得到：工具接入但没有吞掉编译。


toolexec 是编译期的门口，不是运行时的 Span。


## source/rule-load · JSON 规则先变成 Go 能读取的对象

规则文件写 net/http 的 RoundTrip；加载器把文本转换为结构体。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

规则文本只是数据，匹配器需要类型化对象。


#### 画面 1：1. 文件中的文字

规则文件写出目标包、函数和 hook 名。

为什么：文件适合配置，但代码不能直接调用一段文字。

nethttp.json

```json
{"ImportPath":"net/http","Function":"RoundTrip","OnEnter":"clientOnEnter","OnExit":"clientOnExit"}
```

现在得到：得到原始 JSON。


#### 画面 2：2. 解析字段

加载器读取字段名。

为什么：拼写错误要在早期暴露。

Rule（示意）

```go
type Rule struct {
 ImportPath string
 Function string
 OnEnter string
}
```

现在得到：文字变成 Go 值。


#### 画面 3：3. 检查必填项

本例讨论函数规则：缺少目标函数名时，不能按这条配置去匹配 RoundTrip。结构体和文件规则另有自己的字段。

为什么：错误规则进入编译阶段会更难定位。

本例函数规则检查 · 教学伪代码

```go
if r.ImportPath == "" || r.Function == "" {
    return errInvalidRule
}
```

现在得到：规则通过基础检查。


#### 画面 4：4. 交给 matcher

结构化规则进入匹配器。

为什么：后面才会结合真实编译命令判断版本和包。

日志（模拟）

```text
loaded rule: net/http.RoundTrip → clientOnEnter/clientOnExit
```

现在得到：加载完成，不代表已经命中。


加载只回答“规则写得像不像对象”，不回答“当前项目是否适用”。


## source/rule-model · 一条规则其实带着多个限制

同一个 Open 函数在不同版本库里签名可能不同。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

规则不是只有函数名，还要限制包、版本和接收者。


#### 画面 1：1. 只有函数名

粗略规则写 Open。

为什么：同名函数可能属于不同包。

规则（不足）

```json
{"Function":"Open"}
```

现在得到：可能误命中。


#### 画面 2：2. 加包路径

限制到 gorm.io/gorm。

为什么：完整路径避免跨库混淆。

规则（教学）

```json
{"ImportPath":"gorm.io/gorm","Function":"Open"}
```

现在得到：范围变窄。


#### 画面 3：3. 加版本区间

只允许兼容版本。

为什么：hook 签名变了，旧规则可能不安全。

规则（教学）

```json
{"Version":"[1.22.0,1.25.10)","Function":"Open"}
```

现在得到：规则可拒绝不兼容版本。


#### 画面 4：4. 加 receiver

方法目标还要确认接收者。

为什么：RoundTrip 必须是 *Transport 的方法。

规则（教学）

```json
{"Function":"RoundTrip","ReceiverType":"\\*Transport"}
```

现在得到：多项条件共同决定命中。


规则越具体，越能避免把相似函数错误改写。


## source/bundle · 把一个编译包的命中规则装进工作篮子

一次业务构建分别编译 net/http 与 gorm.io/gorm。工具为每个编译包保存自己的规则篮子。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

匹配结果按 package 收拢，后续改写时可以一次取齐。


#### 画面 1：1. 编译一个包

构建会产生多条编译动作，每条有自己的精确 package 路径。

为什么：工具先知道当前正在编译谁。

编译日志（模拟）

```text
compile -p net/http ...
compile -p gorm.io/gorm ...
```

现在得到：得到工作对象。


#### 画面 2：2. 发现 HTTP 规则

处理 net/http 的编译动作时，选中它自己的 RoundTrip 规则。

为什么：HTTP 调用可能需要客户端 hook。

命中结果

```text
rule: net/http.RoundTrip → clientOnEnter/clientOnExit
```

现在得到：net/http 的篮子收到 HTTP 规则。


#### 画面 3：3. 发现 GORM 规则

处理 gorm.io/gorm 的编译动作时，另外选中 Open 规则。

为什么：调用 GORM 的业务包与定义 Open 的 GORM 包是不同编译包；规则按目标定义所在的包收拢。

命中结果

```text
rule: gorm.io/gorm.Open → afterGormOpen
```

现在得到：GORM 有另一个篮子，两个包的规则不会混装。


#### 画面 4：4. 交给改写器

Instrument 编译哪个包，就读取哪个包的规则集合。

为什么：避免只改一条规则而漏掉同包其他目标。

Bundle（示意）

```text
bundle[net/http] = [RoundTrip, ServeHTTP]
bundle[gorm.io/gorm] = [Open]
```

现在得到：每个包拿到自己的规则集合。


bundle 是“这次编译包要一起处理什么”的清单。


## source/match · 从编译命令找到当前目标包

工具看到 compile -p net/http 与 compile -p example.com/live。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

matcher 不猜业务意图，而是从真实编译 action 识别 package。


#### 画面 1：1. 记录 dry run

Go 只列出将执行的 compile。

为什么：不用先改源码就能知道依赖和包。

dry_run.log（模拟）

```text
compile -p net/http ...
compile -p example.com/live ...
```

现在得到：拿到候选包。


#### 画面 2：2. 取出 -p

matcher 从每条 action 取 package。

为什么：规则的 ImportPath 要和这个值比较。

解析（示意）

```go
pkg := flagValue(args, "-p")
// pkg = "net/http"
```

现在得到：得到明确路径。


#### 画面 3：3. 比较规则

net/http 满足 HTTP 规则，业务包本身可能不满足。

为什么：不是所有 compile action 都该插桩。

比较（模拟）

```text
net/http == rule.ImportPath → yes
example.com/live == net/http → no
```

现在得到：只保留相关规则。


#### 画面 4：4. 形成结果

命中结果按 action 返回给后续阶段。

为什么：后续才会准备对应 hook 依赖。

结果（模拟）

```text
matched packages: [net/http]
matched rules: [RoundTrip]
```

现在得到：匹配阶段结束。


match 依赖真实编译动作，所以 dry run 是它的输入。


## source/instrument · 插桩总流程：从文件找到函数

compile action 带着 room.go；工具要找到 Handle 函数。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

工具先解析文件，再以结构节点定位目标，不靠全局文本替换。


#### 画面 1：1. 编译器给文件

toolexec 看到 room.go。

为什么：文件是改写的入口。

action（模拟）

```text
compile -p example.com/live/room room.go
```

现在得到：开始读取源码。


#### 画面 2：2. 解析成树

函数、参数和 body 成为节点。

为什么：树能区分注释、字符串和真正的函数。

结构（简化）

```text
File
└─ FuncDecl Handle
   └─ Body [return result]
```

现在得到：目标不再只是文字。


#### 画面 3：3. 定位目标

规则条件与 FuncDecl 对上。

为什么：只改命中的函数。

匹配（教学）

```text
ImportPath = example.com/live/room
Function = Handle → matched
```

现在得到：目标函数被选中。


#### 画面 4：4. 写回结构

在 body 中放入 enter/exit 桥接调用。

为什么：最后再格式化成 Go 源码给 compiler。

改写后（示意）

```go
func Handle() int {
    call.Enter()
    defer call.Exit()
    return result
}
```

现在得到：AST 改写完成。


插桩是结构化改写流程，结果仍要回到正常 Go 编译。


## source/func-ast · 在函数入口和返回路径接上 hook

Handle 有两个 return；工具要保证 exit 能看到返回值。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

入口创建共享状态，defer 在返回时收尾。


#### 画面 1：1. 原始函数

函数有成功和失败两个返回。

为什么：每条路径都可能需要收尾。

原始 Go（教学）

```go
func Handle(ok bool) (int, error) {
    if !ok { return 0, errBad }
    return 42, nil
}
```

现在得到：存在两条返回路径。


#### 画面 2：2. 入口 hook

函数开始时建立 CallContext。

为什么：enter 记录输入并准备共享信封。

插入片段（示意）

```go
call := hook.Enter()
if !ok { return 0, errBad }
```

现在得到：入口状态已创建。


#### 画面 3：3. defer 覆盖返回

defer 在两条 return 前都能执行。

为什么：避免只给最后一行 return 加逻辑。

插入片段（示意）

```go
call := hook.Enter()
defer hook.Exit(call)
if !ok { return 0, errBad }
```

现在得到：两条路径都能到 exit。


#### 画面 4：4. 保留 receiver

方法 hook 的 enter 会拿到 receiver 与请求。

为什么：规则签名必须和生成桥接一致。

签名（真实形状简化）

```go
func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)
```

现在得到：hook 能读到方法上下文。


函数 AST 改写的核心是覆盖所有返回路径，并保持原签名约定。


## source/trampoline · Trampoline 是一座调用桥

改写后要在原函数前后调用 hook，但不能丢掉原参数和返回值。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

桥接函数把观察逻辑包在原函数外侧。


#### 画面 1：1. 调用者看见原入口

调用者仍调用 Handle(7)。

为什么：业务调用点可以保持不变。

调用（教学）

```go
result := Handle(7)
```

现在得到：调用进入桥。


#### 画面 2：2. 进入 trampoline

桥接函数先接收参数并调用 enter。

为什么：它保存参数，供后续 hook 使用。

桥（示意）

```go
func Handle_trampoline(x int) int {
    call := enter(x)
```

现在得到：共享状态产生。


#### 画面 3：3. 调用原函数

桥把 x 原样传给真正的实现。

为什么：透明转发是保持业务行为的关键。

桥（示意）

```go
    result := Handle_original(x)
    returnValue := result
```

现在得到：业务结果保持 8。


#### 画面 4：4. exit 再返回

exit 读取共享结果，桥返回给调用者。

为什么：Span 结束等记录应发生在结果已知之后。

桥（示意）

```go
    exit(call, result)
    return result
}
```

现在得到：观察逻辑和原返回都完成。


Trampoline 连接的是调用约定，不是把函数指针神奇替换掉。


## source/call-context · CallContext 是 enter 到 exit 的小信封

HTTP enter 读请求，exit 需要拿到同一次调用的响应。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

同一次函数调用的参数、返回值和临时状态通过 CallContext 对接。


#### 画面 1：1. enter 收到调用

HTTP enter 同时收到 CallContext、receiver、request。

为什么：它需要访问业务调用的输入。

签名（简化）

```go
func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)
```

现在得到：请求数据进入信封。


#### 画面 2：2. 保存共享值

Enter 把已经创建 Span 后的 ctx 和请求信息放进共享 Data，给 Exit 收尾使用。

为什么：Enter 和 Exit 是两个函数；同一次调用需要一处存放观察状态的地方。SetParam 会改写业务参数，不该拿它当字典。

状态（示意）

```go
call.SetData(map[string]interface{}{
    "ctx": ctx,
    "request": req,
})
```

现在得到：共享状态与原函数参数分开保存。


#### 画面 3：3. 原函数执行

Transport.RoundTrip 返回 response。

为什么：返回值稍后由桥接层放回状态。

模拟输出

```text
RoundTrip(req) → status=200, err=nil
```

现在得到：响应产生。


#### 画面 4：4. exit 读取信封

Exit 直接收到 response 和 error，再从 Data 读出 Enter 保存的 ctx 与请求信息。

为什么：HTTP Exit 已有返回值参数，不需要虚构 call.Return 方法；一般接口读取返回值的方法名是 GetReturnVal。

exit（示意）

```go
func clientOnExit(call api.CallContext, res *http.Response, err error) {
    data := call.GetData().(map[string]interface{})
    // 用 data["ctx"]、data["request"] 和 res 完成观察收尾
}
```

现在得到：一次调用的前后被连起来。


CallContext 是插桩桥的调用状态；不要把它当成 Go 的 context.Context。


## source/call-context-impl · 先看测试版，再追真正生成的 CallContext

源码中 pkg/api/impl.go 便于测试，但生产桥接来自模板生成。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

读代码时要分清“测试帮助类”和真正运行时生成代码。


#### 画面 1：1. 看到测试实现

pkg/api/impl.go 提供一个简化 CallContext。

为什么：它适合理解接口，但标注了 testing purpose。

源码提示（概念）

```go
// For testing purpose only
type CallContextImpl struct { Params []any }
```

现在得到：先不要把它当生产桥。


#### 画面 2：2. 生产入口在模板

tool/instrument/impl.tmpl 定义生成形状。

为什么：实际编译会按目标函数生成具体代码。

模板（示意）

```text
{{ generateCallContext .Params .Returns }}
```

现在得到：模板成为生产来源。


#### 画面 3：3. 绑定参数位置

测试实现返回槽位地址；生产模板按目标函数类型生成访问。普通槽位不能代替真实签名。

为什么：hook 需要知道第几个位置对应什么。

生成结果（教学）

```go
// 下面是测试实现帮助理解的槽位，不是模板原文
GetParam(0)    → &c.Params[0]
GetReturnVal(0) → &c.ReturnVals[0]
// 生产模板会生成符合具体目标类型的访问方法
```

现在得到：知道接口在访问什么，再去看生产模板；泛型 setter 仍不支持。


#### 画面 4：4. 对照两份代码

测试实现帮助读接口，模板帮助读生产链路。

为什么：两者都读，才能避免错误结论。

阅读路线

```text
api/impl.go → 看接口行为
tool/instrument/impl.tmpl → 看生产生成
```

现在得到：源码地图指向正确层。


阅读实现时要先问：这是测试替身，还是构建时真正生成的代码？


## source/linkname · go:linkname 是一座很窄的跨包桥

规则包需要连接目标包中的生成符号。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

linkname 连接的是编译链接符号，不能当作通用 API。


#### 画面 1：1. 目标包有符号

生成桥接在目标包中暴露符号。

为什么：规则包需要一个稳定连接点。

目标（示意）

```go
func OtelPrintStackImpl(bt []byte) { ... }
```

现在得到：目标符号存在。


#### 画面 2：2. 声明 linkname

规则包声明本地名字映射到目标符号。

为什么：名字不同也能连接到同一个链接符号。

声明（简化）

```go
//go:linkname _printstack pkg.OtelPrintStackImpl
var _printstack func([]byte)
```

现在得到：链接关系建立。


#### 画面 3：3. 编译器链接

link 阶段把两边合并。

为什么：只声明不代表运行时自动执行。

模拟日志

```text
link: _printstack resolves to pkg.OtelPrintStackImpl
```

现在得到：符号解析成功。


#### 画面 4：4. 运行时调用

hook 调本地别名，实际到目标实现。

为什么：这条桥很窄，符号签名必须一致。

调用（示意）

```go
_printstack(debug.Stack())
```

现在得到：跨包调用完成。


linkname 能解决特定连接问题，也增加了版本和签名风险。


## source/gls · GLS 只能帮助特定协程上下文路径

worker pool 在启动时创建，请求后来才来。先用普通字符串教学标识演示传值，不把它当作 OTel TraceID。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。 本例 WithValue 中的字符串只是教学标识；没有创建 OTel Span。


### 情况：一个具体场景

预创建 worker 不会凭空知道后来请求的 trace；任务交接仍要传 ctx。


#### 画面 1：1. worker 先启动

池在服务启动时创建。

为什么：此时没有任何请求上下文。

启动（示意）

```go
go workerLoop() // 服务启动时
// 当前没有 request ctx
```

现在得到：worker 先于请求存在。


#### 画面 2：2. 请求有 ctx

请求往 context 放了一个字符串教学标识 request-42；这个值不是 TraceID。

为什么：这个 ctx 只在当前调用链有效。

请求（教学）

```go
ctx := context.WithValue(req.Context(), key, "request-42")
```

现在得到：请求上下文里有了教学标识。


#### 画面 3：3. 错误交接

任务只放 payload，worker 用 Background。

为什么：没有 carrier，关系在这里断开。

错误示例

```go
tasks <- Payload{RoomID: 42}
// worker: context.Background()
```

现在得到：没有交接这个值，worker 就读不到它。


#### 画面 4：4. 正确交接

任务结构显式带 ctx。

为什么：边界处传播是可靠做法。

正确示例

```go
tasks <- Job{Ctx: ctx, RoomID: 42}
// worker uses job.Ctx
```

现在得到：证明值能随 ctx 交接；真实 Span 父子关系还要用 OTel 实验检查。


GLS 不是“所有 goroutine 自动继承”的保证；任务交接仍需设计 carrier。


## source/hook-rule · 自定义 Hook 也必须遵守连接约定

为 net/http.Transport.RoundTrip 写 enter/exit hook。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

hook 名称能被找到还不够，签名和参数顺序必须匹配。


#### 画面 1：1. 规则指定 hook

JSON 指定 clientOnEnter/clientOnExit。

为什么：工具需要知道改写时调用谁。

nethttp.json

```json
{"Function":"RoundTrip","ReceiverType":"\\*Transport","OnEnter":"clientOnEnter","OnExit":"clientOnExit"}
```

现在得到：规则目标明确。


#### 画面 2：2. Enter 签名

Enter 拿到 CallContext、receiver、request。

为什么：receiver 只在方法 enter 形状中出现。

hook（简化）

```go
func clientOnEnter(call api.CallContext, t *http.Transport, req *http.Request)
```

现在得到：输入顺序固定。


#### 画面 3：3. 原方法返回

RoundTrip 返回 response 和 error。

为什么：exit 需要读取这两个结果。

原调用（模拟）

```text
RoundTrip(req) → response(status=200), err=nil
```

现在得到：结果进入 exit。


#### 画面 4：4. Exit 签名

Exit 接收 CallContext、response、error，不再重复传 receiver。

为什么：签名错位会导致 hook 无法正确连接。

hook（简化）

```go
func clientOnExit(call api.CallContext, res *http.Response, err error)
```

现在得到：生命周期闭合。


自定义 hook 的第一条测试不是“有没有日志”，而是“签名是否匹配生成桥”。


## source/rule-json · 用 JSON 表达“改哪个函数”

HTTP 规则写明 net/http 的 RoundTrip 和两个 hook。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

JSON 是规则的声明层，真正匹配要看工具实现。


#### 画面 1：1. 规则写目标

文件声明包和函数。

为什么：先表达意图，再由工具解释。

JSON（教学）

```json
{"ImportPath":"net/http","Function":"RoundTrip"}
```

现在得到：有了最小目标。


#### 画面 2：2. 增加方法条件

加入 *Transport。

为什么：避免命中其他同名函数。

JSON（教学）

```json
{"ReceiverType":"\\*Transport","Function":"RoundTrip"}
```

现在得到：方法条件收紧。


#### 画面 3：3. 增加生命周期

指定 enter 与 exit。

为什么：工具会把名字放进生成桥。

完整片段

```json
{"OnEnter":"clientOnEnter","OnExit":"clientOnExit"}
```

现在得到：声明完整。


#### 画面 4：4. 真实匹配要看实现

文档可能描述 Function 是 regex，但当前 FindFuncDecl 实现按字符串相等比较。

为什么：阅读二开代码要以当前版本实现为准。

匹配事实

```text
actual: decl.Name == rule.Function
docs: Function described as regex
```

现在得到：规则行为以版本源码为准。


规则 JSON 表达意图，matcher 的实现决定实际语义；两者都要读。


## source/otel-runtime · 运行时才真正创建 Span context

一个 HTTP 请求进入 server hook，运行时要从当前 context 开始。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

编译期只是加入调用；运行时 hook 才调用 OTel API 生成记录。


#### 画面 1：1. 请求进入

server hook 拿到 request.Context。

为什么：上游可能已经带有父 Span。

请求（教学）

```go
ctx := req.Context()
traceparent = "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01"
```

现在得到：已有或为空的父上下文进入 hook。


#### 画面 2：2. Start child

运行时 tracer 从 ctx 启动 server Span。

为什么：这是“创建当前操作记录”的时刻。

OTel（示意）

```go
ctx, span := tracer.Start(ctx, "HTTP /rooms")
defer span.End()
```

现在得到：当前 Span 产生。


#### 画面 3：3. 业务日志读取 context

业务函数沿 ctx 继续执行。

为什么：手动日志可读取当前 SpanContext。

业务（教学）

```go
traceID := trace.SpanContextFromContext(ctx).TraceID()
log.Printf("trace=%s", traceID)
```

现在得到：日志与当前上下文相连。


#### 画面 4：4. exporter 接收

span.End 后 SDK 才把记录交给 exporter。

为什么：日志出现不等于后端已收到，导出是另一层。

模拟输出

```text
span ended: HTTP /rooms
exporter: accepted trace=aaaa… span=cccc…
```

现在得到：一次请求形成可查询记录。


插桩让 Start/End 调用出现；Trace 是否连贯还取决于 context 和传播器。


## source/version-boundary · 三种版本要一起核对

业务使用 gorm 1.25.12，而默认规则范围到 1.25.10 之前。

教学演示：代码、依赖和输出是简化后的画面；不会在网页中执行 Go。


### 情况：一个具体场景

工具版本新不代表每条规则都适用于业务库版本。


#### 画面 1：1. 业务锁定版本

go.mod 使用 gorm 1.25.12。

为什么：这是 matcher 看到的事实。

业务 go.mod（教学）

```text
require gorm.io/gorm v1.25.12
```

现在得到：进入版本比较。


#### 画面 2：2. 规则声明范围

gorm 规则是 [1.22.0,1.25.10)。

为什么：右边开区间不包含 1.25.10。

gorm.json

```json
{"Version":"[1.22.0,1.25.10)","Function":"Open"}
```

现在得到：规则范围固定。


#### 画面 3：3. matcher 判断

1.25.12 超出范围。

为什么：工具应跳过该规则，避免未知签名改写。

判断（模拟）

```text
compare: 1.25.12 ∈ [1.22.0,1.25.10) → false
```

现在得到：不会自动生成 GORM Span。


#### 画面 4：4. 兼容动作

可升级规则、改写范围并验证签名。

为什么：不要只改版本字符串而跳过行为测试。

检查清单

```text
1. inspect API signature
2. update rule range
3. run instrumentation test
```

现在得到：版本边界被显式看见。


兼容性是业务版本、规则范围、工具运行时三者的交集。


## source/preprocess · 为什么是三轮？让一个房间查询亲自走一遍

你要自动观察 FindRoom(42)。我们设置两条教学自定义规则：room 的记录包会调用 cache，而 cache 也有自己的记录包。先选“完整三轮”，每次点下一步，关注黄色标出的新增内容。

这是按 v1.15.0 控制流制作的教学模拟。example.com/* 为虚构模块；浏览器不执行 Go。真实上游例子见动画后的“源码里的同类情况”。


### 情况：完整三轮

观察代码怎样逐次进入构建，最后再编译。


#### 画面 1：先看原来的房间服务

你写了一个查房间的程序。现在只认识自己的 room 包，还没有观察调用的代码。

为什么：自动插桩最后要调用记录函数；记录函数也要和业务代码一起编译。

原来的 main.go · 教学片段

```go
import "example.com/room"

func main() {
    room.FindRoom(42)
}
```

现在得到：现在直接 go build，只会得到原来的业务程序。


#### 画面 2：准备①：先接入基础记录库

newDeps 收到的规则集合还是空的；它先生成基础 import，再由 syncDeps 整理依赖。

为什么：LoongSuite 自己也要改写部分 OTel 代码，所以第一次找规则前，要先让基础记录库进入构建范围。

otel.runtime.go · 省略其他基础 import

```go
package main

import _ "github.com/alibaba/loongsuite-go/pkg"
import _ "go.opentelemetry.io/otel"
import _ "go.opentelemetry.io/otel/sdk/trace"
```

现在得到：基础库准备好了；具体用哪个业务记录包，要等下一步匹配。


#### 画面 3：匹配①：发现 room.FindRoom 可以观察

扫描现在会参与构建的包，找到教学规则：在 FindRoom 返回时调用 room-recorder。

为什么：规则是“应该加什么”的说明；选中它，才知道要把哪个记录包加入项目。

教学规则 room-rule.json · 缩写

```go
{
  "ImportPath": "example.com/room",
  "Function": "FindRoom",
  "OnExit": "afterFindRoom",
  "Path": "example.com/room-recorder"
}
```

现在得到：如果现在就结束循环，选中的记录包还没有被 newDeps 处理。


#### 画面 4：准备②：接入 room-recorder，又带来了 cache

按 B1 生成记录包的 import 并同步依赖。这个教学记录包会调用 cache.Hit，所以 cache 也进入了构建。

为什么：依赖就是“这段代码还需要哪些其他代码”。加入一个包，可能把它用到的包一起带进来。

room-recorder/record.go · 教学片段

```go
package roomrecorder

import "example.com/cache"

func afterFindRoom(/* 参数省略 */) {
    cache.Hit("room:42")
}
```

现在得到：第一次匹配时还看不到 cache；现在构建清单变了，需要重新检查规则。


#### 画面 5：匹配②：新出现的 cache 也命中一条规则

重新扫描更新后的构建范围，找到 cache.Hit 的教学规则。最终集合 B2 有 room 和 cache 两条规则。

为什么：第二次匹配解决的是：第一次接入记录代码后，构建里新增了什么、规则选择有没有变化。

教学规则 cache-rule.json · 缩写

```go
{
  "ImportPath": "example.com/cache",
  "Function": "Hit",
  "OnExit": "afterCacheHit",
  "Path": "example.com/cache-recorder"
}
```

现在得到：第二次匹配结束，只得到了最终规则清单；清单对应的代码还要准备一次。


#### 画面 6：准备③：把 B2 对应的记录包都补齐

再调用 newDeps(B2) 和 syncDeps。这次 room-recorder、cache-recorder 都接入，之后不再匹配。

为什么：新增规则是第二次匹配的产物，所以需要在它之后安排一次准备。

otel.runtime.go · 展示本例的两个额外 import

```go
package main

// 基础 import 省略
import _ "example.com/room-recorder"
import _ "example.com/cache-recorder"
```

现在得到：对这个教学依赖链，构建所需代码已经备齐。三轮是当前实现固定的安排，并非 Go 的要求。


#### 画面 7：现在才开始正式插桩构建

保存规则，然后启动带 toolexec 的构建：它在编译工具执行前接入改写。这里才会把前后动作接到目标函数。

为什么：前面解决“代码能不能找到”，这里解决“在目标函数什么位置调用它”。

接入动作后的 FindRoom · 逻辑示意

```go
func FindRoom(id int) Room {
    result := originalFindRoom(id)
    afterFindRoom(/* result 等参数 */)
    return result
}
```

现在得到：这个包装只是帮助理解；真实实现使用生成的 trampoline（桥接函数）。


#### 画面 8：启动程序，观察动作才随调用执行

部署并启动上一步的二进制，调用 FindRoom(42)，接入的记录动作随函数运行。

为什么：编译前准备和服务运行是两段时间；准备阶段负责让构建材料齐全，记录动作在运行时才执行。

运行结果 · 教学示意

```go
FindRoom(42)
  → 查询房间
  → afterFindRoom(...)
      → cache.Hit("room:42")
      → afterCacheHit(...)
返回 Room{ID: 42}
```

现在得到：现在回看三轮：选出规则 → 补入代码 → 构建范围变化 → 重新选 → 补齐最终结果。


关键不在重复次数，而在依赖先后：newDeps 处理上次匹配的结果。两次匹配，前后需要安排三次准备。


### 情况：只准备一轮会怎样？

停在第一次匹配后，看看缺什么。


#### 画面 1：先看原来的房间服务

你写了一个查房间的程序。现在只认识自己的 room 包，还没有观察调用的代码。

为什么：自动插桩最后要调用记录函数；记录函数也要和业务代码一起编译。

原来的 main.go · 教学片段

```go
import "example.com/room"

func main() {
    room.FindRoom(42)
}
```

现在得到：现在直接 go build，只会得到原来的业务程序。


#### 画面 2：准备①：先接入基础记录库

newDeps 收到的规则集合还是空的；它先生成基础 import，再由 syncDeps 整理依赖。

为什么：LoongSuite 自己也要改写部分 OTel 代码，所以第一次找规则前，要先让基础记录库进入构建范围。

otel.runtime.go · 省略其他基础 import

```go
package main

import _ "github.com/alibaba/loongsuite-go/pkg"
import _ "go.opentelemetry.io/otel"
import _ "go.opentelemetry.io/otel/sdk/trace"
```

现在得到：基础库准备好了；具体用哪个业务记录包，要等下一步匹配。


#### 画面 3：匹配①：发现 room.FindRoom 可以观察

扫描现在会参与构建的包，找到教学规则：在 FindRoom 返回时调用 room-recorder。

为什么：规则是“应该加什么”的说明；选中它，才知道要把哪个记录包加入项目。

教学规则 room-rule.json · 缩写

```go
{
  "ImportPath": "example.com/room",
  "Function": "FindRoom",
  "OnExit": "afterFindRoom",
  "Path": "example.com/room-recorder"
}
```

现在得到：如果现在就结束循环，选中的记录包还没有被 newDeps 处理。


#### 画面 4：试着只做一轮：缺了 room-recorder

第 1 轮是“准备基础库 → 匹配出 room 规则”。循环结束时，room 记录包还没有经过依赖准备。

为什么：newDeps 在 matchRules 前面执行；本轮新选出的规则，只能在下一轮才被 newDeps 处理。

把循环展开成实际顺序 · 伪代码

```go
newDeps([])
syncDeps()
B1 = matchRules()
// 在这里停止：没有 newDeps(B1)
```

现在得到：只做 1 轮，在这个例子里连第一次匹配的结果都还没准备。这里展示条件缺口，不是复制某次真实编译报错。


第一次匹配才知道要接入 room-recorder；不能把匹配之前的那次准备，当成已经处理了匹配结果。


### 情况：只准备两轮会怎样？

停在第二次匹配后，看看这次又少了谁。


#### 画面 1：先看原来的房间服务

你写了一个查房间的程序。现在只认识自己的 room 包，还没有观察调用的代码。

为什么：自动插桩最后要调用记录函数；记录函数也要和业务代码一起编译。

原来的 main.go · 教学片段

```go
import "example.com/room"

func main() {
    room.FindRoom(42)
}
```

现在得到：现在直接 go build，只会得到原来的业务程序。


#### 画面 2：准备①：先接入基础记录库

newDeps 收到的规则集合还是空的；它先生成基础 import，再由 syncDeps 整理依赖。

为什么：LoongSuite 自己也要改写部分 OTel 代码，所以第一次找规则前，要先让基础记录库进入构建范围。

otel.runtime.go · 省略其他基础 import

```go
package main

import _ "github.com/alibaba/loongsuite-go/pkg"
import _ "go.opentelemetry.io/otel"
import _ "go.opentelemetry.io/otel/sdk/trace"
```

现在得到：基础库准备好了；具体用哪个业务记录包，要等下一步匹配。


#### 画面 3：匹配①：发现 room.FindRoom 可以观察

扫描现在会参与构建的包，找到教学规则：在 FindRoom 返回时调用 room-recorder。

为什么：规则是“应该加什么”的说明；选中它，才知道要把哪个记录包加入项目。

教学规则 room-rule.json · 缩写

```go
{
  "ImportPath": "example.com/room",
  "Function": "FindRoom",
  "OnExit": "afterFindRoom",
  "Path": "example.com/room-recorder"
}
```

现在得到：如果现在就结束循环，选中的记录包还没有被 newDeps 处理。


#### 画面 4：准备②：接入 room-recorder，又带来了 cache

按 B1 生成记录包的 import 并同步依赖。这个教学记录包会调用 cache.Hit，所以 cache 也进入了构建。

为什么：依赖就是“这段代码还需要哪些其他代码”。加入一个包，可能把它用到的包一起带进来。

room-recorder/record.go · 教学片段

```go
package roomrecorder

import "example.com/cache"

func afterFindRoom(/* 参数省略 */) {
    cache.Hit("room:42")
}
```

现在得到：第一次匹配时还看不到 cache；现在构建清单变了，需要重新检查规则。


#### 画面 5：匹配②：新出现的 cache 也命中一条规则

重新扫描更新后的构建范围，找到 cache.Hit 的教学规则。最终集合 B2 有 room 和 cache 两条规则。

为什么：第二次匹配解决的是：第一次接入记录代码后，构建里新增了什么、规则选择有没有变化。

教学规则 cache-rule.json · 缩写

```go
{
  "ImportPath": "example.com/cache",
  "Function": "Hit",
  "OnExit": "afterCacheHit",
  "Path": "example.com/cache-recorder"
}
```

现在得到：第二次匹配结束，只得到了最终规则清单；清单对应的代码还要准备一次。


#### 画面 6：试着只做两轮：缺了 cache-recorder

第二轮把 room-recorder 带入，再发现 cache 规则，但 cache-recorder 还没准备。

为什么：再匹配得到的清单 B2，需要匹配之后的 newDeps(B2) 才能落实到构建输入里。

把两轮展开 · 伪代码

```go
newDeps([]); syncDeps()
B1 = matchRules()
newDeps(B1); syncDeps()
B2 = matchRules()
// 在这里停止：没有 newDeps(B2)
```

现在得到：如果第二次匹配没有任何相关变化，有的项目两轮可能就够；当前代码没有做这种提前结束的判断。


第二次匹配可能产生新的记录包需求，第三次准备负责落实。当前代码固定三轮，没有检测是否还会继续出现新规则。


## source/deps · 工具装好了，为什么业务构建仍找不到记录函数？

原来的 FindRoom(42) 能编译。你决定在返回后调用 afterFindRoom，但这个函数放在另一个 Go 包里。逐步把缺失的 import、require、replace 补齐。

代码与模块名是教学片段，省略完整 hook 签名与桥接；真实工具写入的路径和版本由源码计算。浏览器仅演示变化。


### 情况：补齐依赖

从一个新增记录动作，看编译需要哪些材料。


#### 画面 1：原来只需要 room 包

main 调用 FindRoom(42)，Go 可以找到 room，所以原来的代码能编译。

为什么：能编译旧代码，只能说明旧依赖齐全。

main.go · 教学片段

```go
import "example.com/room"

func main() { room.FindRoom(42) }
```

现在得到：普通构建可用；新加的记录动作尚未参与。


#### 画面 2：现在多了一个记录动作

自动改写需要把 afterFindRoom 接在函数返回前。它来自 room-recorder。

为什么：Go 不会因为你把 otel 工具装进 PATH，就自动把工具里的库当成业务依赖。

加工后的逻辑 · 不是实际桥接代码

```go
result := room.FindRoom(42)
roomrecorder.AfterFindRoom(result)
```

现在得到：需要先让业务构建能定位记录包。


#### 画面 3：先在生成文件中引入包

LoongSuite 生成的 otel.runtime.go 会包含记录包的 import。下方用教学模块名表示。

为什么：import 把包放入构建范围；它本身不等于目标函数已经被插入调用。

otel.runtime.go · 教学片段

```go
package main

import _ "example.com/room-recorder"
```

现在得到：下划线 import 的意思是引入包，不在这个文件里直接使用它的普通名称。


#### 画面 4：再说明去哪里找到模块

require 提供模块和版本；replace 指向已经准备好的本地代码。示例路径由人写，真实工具会计算。

为什么：包名不是磁盘位置；编译系统需要模块解析信息把两者连接起来。

go.mod · 教学示例

```go
module example.com/app

go 1.25.0

require example.com/room-recorder v0.0.0
replace example.com/room-recorder => ../room-recorder
```

现在得到：v0.0.0 只是本例占位；本指南源码页给出了上游实际使用的占位版本。


#### 画面 5：代码和模块信息都能对应了

Go 读到生成的 import，按 go.mod 找到记录包及它需要的其他包。syncDeps 调用 go mod tidy 整理实际依赖。

为什么：这样后续编译输入中新加的观察代码才有机会通过解析和链接。

本例的解析路径 · 示意

```go
新增的观察动作
  → import example.com/room-recorder
  → require + replace
  → ../room-recorder 的 Go 源码
  → 编译并链接
```

现在得到：先解决依赖，再检查规则命中、签名和链接；找到包不代表整个插桩过程已经成功。


工具是加工者；记录包是要进入业务产物的代码。二者的依赖范围不同，所以需要给业务构建补材料。


## zero/observe · 观察 FindRoom(42)

直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。

示意调用和输出；不连接 OTel 后端。


### 情况：一个完整例子

直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。


#### 画面 1：只有业务调用

FindRoom 直接返回房间名。此时功能可用，但排查慢请求没有证据。

为什么：先把“功能正确”和“过程可见”分开。

业务代码

```go
room := FindRoom(42)
fmt.Println(room)
// 输出：语聊房间
```

现在得到：结果：语聊房间


#### 画面 2：记下开始时间

在调用前增加一个开始记录点，仍然只调用一次原函数。

为什么：记录点必须围绕原调用，不能替换业务结果。

加入开始记录

```go
start := time.Now()
room := FindRoom(42)
```

现在得到：中间状态：正在查房间


#### 画面 3：调用结束后计算

函数返回后计算 elapsed，并把结果一起写出。

为什么：退出位置才能知道完整耗时和最终结果。

加入结束记录

```go
elapsed := time.Since(start)
log.Printf("FindRoom room=%s elapsed=%s", room, elapsed)
```

现在得到：新增：FindRoom room=语聊房间 elapsed=12ms


#### 画面 4：工具要重复做这件事

如果 HTTP、数据库、消息处理都需要同样的前后动作，手写会重复；插桩工具的目标就是把这类动作接到许多目标函数。

为什么：先理解自动化的动机，再读规则和 AST。

观察到的最终效果

```text
请求 → 进入记录 → 原函数 → 退出记录 → 响应
```

现在得到：结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。


结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。


## zero/packages · import 写了路径，Go 怎么找到 room 文件夹？

main 已经写了 import，为什么还要 go.mod？用同一个 demo/ 目录，看“想用哪个包”和“去哪里找它”怎样接上。

这是当前模块中导入本地子包的例子；本页只解释这个项目的路径怎样对应目录。


### 情况：一个完整例子

先看真实目录，再看 package、module 路径映射，最后让 main 的 import 找到 room 并调用。


#### 画面 1：先看磁盘：room 确实就在旁边

假设你在 demo/ 目录执行 go run .。main.go 和 room/find.go 都存在，room 文件夹就在当前项目里。问题是：Go 如何知道 import 里的 example.com/demo 指的就是这里？

为什么：import 的字符串不是 main.go 旁边的相对文件夹名。Go 不会只看最后一个 room，就去磁盘各处找同名目录。

本例目录：demo/ 是本地文件夹

```text
demo/
├── go.mod
├── main.go
└── room/
    └── find.go
```

现在得到：先记住真实位置：demo/room/find.go。接下来给它一个可用于 import 的完整路径。


#### 画面 2：package room 说明代码属于哪个包

room/find.go 开头写 package room，并提供 Find 函数。main.go 开头写 package main，表示这里是可执行程序的包。

为什么：package room 只给这组代码命名；它没有声明 example.com/demo/room 对应这个目录。只凭 room 这个短名字，无法区分不同项目里的同名包。

room/find.go：本例完整文件

```go
package room

func Find(id int) string {
    return "语聊房间"
}
```

现在得到：room 包已经提供 Find；还需要让完整 import 路径能找到它。


#### 画面 3：go.mod 把路径前缀对应到当前目录

demo/go.mod 写 module example.com/demo。Go 于是知道：在当前模块中，example.com/demo 这个前缀对应放着 go.mod 的 demo/ 目录。后面的 /room 就对应里面的 room/。

为什么：main 中的 import 只表达“我要用 example.com/demo/room”。module 声明补上“example.com/demo 指的是当前目录”这条对应关系；同一模块里的 room 不需要再写 require，也不需要先上传到网站。

demo/go.mod：完整文件，两项分行写

```go.mod
module example.com/demo

go 1.25.0
```

现在得到：路径拆开看：example.com/demo + /room → demo/ + room/ → demo/room/find.go。


#### 画面 4：现在 main 的 import 才能找到这个 room

读取 import "example.com/demo/room" 时，Go 先认出当前 module 的前缀 example.com/demo，再用剩下的 room 子路径找到 demo/room/。找到源码后，main 才能调用里面导出的 Find 函数。

为什么：写下 import 是声明使用关系，构建时还要解析路径、找到源码并检查代码。如果把 module 改成 example.com/other 却不改这条 import，就失去了“这是当前模块里 room/”的对应关系。

demo/main.go：完整文件

```go
package main

import "example.com/demo/room"

func main() {
    name := room.Find(42)
    println(name)
}
```

现在得到：执行 go run .，程序输出：语聊房间。import 要用谁、go.mod 怎样定位、package 提供什么，这三步接上了。


import 写“我要用哪个包”；go.mod 的 module 行帮助 Go 将当前模块的路径对应到本地目录。不是所有 Go 程序都必须先有 go.mod，后面的正文会说明范围。


## zero/gomod · 同一份 go.mod：我是谁，我需要谁

还是 demo 项目。它要使用一个外部 observer 库。先认清当前项目的名字，再看外部依赖怎样写进清单。

版本和路径为教学示意。


### 情况：一个完整例子

区分当前模块身份、外部依赖声明和实际函数调用。


#### 画面 1：module：给当前项目声明名字

demo/go.mod 写 module example.com/demo，声明的是 demo 自己。这里还没有增加外部库。

为什么：Go 需要知道当前这份代码的路径前缀，才能理解项目内的 import。

demo/go.mod

```go.mod
module example.com/demo

go 1.25.0
```

现在得到：我是谁：example.com/demo。go 行声明这份模块要求的最低 Go 版本。


#### 画面 2：源码：我现在需要 observer 的一个函数

main.go 写 import example.com/observer，再调用它的 Record 函数。它是另一份独立提供的代码。

为什么：这次使用关系让 observer 成了 demo 的依赖；observer 和 demo 都是模块，“依赖”说的是它们之间的关系。

main.go 的使用片段

```go
import "example.com/observer"

// 在函数内部调用
observer.Record("FindRoom")
```

现在得到：当前项目是 demo；它需要的外部模块是 observer。


#### 画面 3：require：把外部依赖写进清单

在 demo 的同一份 go.mod 增加 require example.com/observer v1.0.0。这里用假设已发布的库说明版本要求。

为什么：module 说当前代码叫什么；require 说它依赖哪份外部代码。两个关键字说的是不同对象。

demo/go.mod 增加依赖行

```go.mod
module example.com/demo

go 1.25.0

require example.com/observer v1.0.0
```

现在得到：没有给 demo 新建第二份 go.mod，只是在原文件增加一行。


#### 画面 4：清单准备好，也不会自动执行 Record

有了依赖清单，Go 才能进一步找到代码并构建。真正打印记录，还需要程序运行并调用 Record。

为什么：配置文件中的 require 是声明，不是“现在调用这个函数”的命令。依赖声明、编译、执行是接下来的三个动作。

把配置和执行分别读出来

```text
module example.com/demo    → 当前项目是谁
require observer v1.0.0    → 需要哪份外部代码（路径在此简写）
observer.Record(...)      → 程序运行时要执行的调用
```

现在得到：先会读“我是谁、我需要谁”。本地源码从哪里取，在第 6 步单独解释。


module 声明当前项目；require 声明外部依赖。外部库也是模块，“依赖”是项目之间的使用关系。


## zero/build · 两段时间：构建与运行

同一份 FindRoom，先经过构建工具，再在服务启动后处理请求。

命令是教学简化；不执行 Go。


### 情况：一个完整例子

同一份 FindRoom，先经过构建工具，再在服务启动后处理请求。


#### 画面 1：源码还只是文字

main.go 中有 FindRoom，但电脑还没有可运行产物。

为什么：插桩工具要在编译输入阶段介入。

源文件

```go
func FindRoom(id int) string {
    return "语聊房间"
}
```

现在得到：状态：尚未运行


#### 画面 2：普通 go build

Go 根据原来的源码生成可执行程序 demo。

为什么：先有基线，才能比较插桩后发生什么。

普通构建

```sh
go build -o demo-service .
```

现在得到：产物：demo-service


#### 画面 3：otel 工具接管构建

工具在构建前准备依赖并让编译器看到额外输入。

为什么：规则和 hook 必须在这一阶段接入。

插桩构建

```sh
otel go build -o demo-service .
```

现在得到：产物：包含业务与观察代码的 demo-service


#### 画面 4：启动后才产生记录

程序启动后，走到查房间的代码时，加入的观察动作才真正执行。

为什么：不要把构建成功误认为已经有运行时 Trace。

真实请求

```text
启动 demo-service
请求 /room/42
FindRoom → hook → 返回
```

现在得到：结论：构建时接入，运行时执行。


结论：构建时接入，运行时执行。


## zero/hooks · 为 FindRoom 加入前后动作

规则找到 FindRoom 后，进入 hook 建立观察状态，退出 hook 写出结果。

教学模型：下面用普通 Go 函数解释前后动作，省略真实 hook 签名与连接过程；后续源码页再看 LoongSuite 的实现。


### 情况：一个完整例子

规则找到 FindRoom 后，进入 hook 建立观察状态，退出 hook 写出结果。


#### 画面 1：规则先描述目标

先明确要观察的是 FindRoom。before 和 after 是两段额外的记录代码，不是原来查房间的业务。

为什么：工具不能凭空知道哪些函数值得改。

给工具的说明 · 不是可直接使用的规则配置

```text
找到：FindRoom 函数
进入时：调用 before
退出时：调用 after
```

现在得到：规则只是一张说明


#### 画面 2：进入 hook

运行路径先执行 before，记录开始时间。

为什么：进入动作能捕获调用参数和开始时刻。

进入前的额外函数 · 教学示意

```go
func before(id int) {
    log.Printf("开始查询房间 %d", id)
}
```

现在得到：记录：start FindRoom


#### 画面 3：原函数照常计算

FindRoom 仍返回房间名。

为什么：观察动作不能吞掉或重复业务调用。

原函数

```go
func FindRoom(id int) string {
    return "语聊房间"
}
```

现在得到：业务结果：语聊房间


#### 画面 4：退出 hook 收尾

查询返回后，after 写出结束记录。这里先观察执行顺序；计算耗时还需要保存开始时间，后面再学。

为什么：统一退出位置比只在最后一行追加更能覆盖 early return；真实桥接还有 panic 语义。

返回后的额外函数 · 教学示意

```go
func after(room string) {
    log.Printf("查询结束，结果 %s", room)
}
```

现在得到：结论：规则找位置，hook 做动作，改写把二者接上。


结论：规则找位置，hook 做动作，改写把二者接上。


## zero/deps · 多了一行记录调用，为什么就编译不过了？

用一个独立的 demo 小项目模拟业务：FindRoom(42) 原来能返回房间名。现在给它增加一行 observer.Record，沿着新增代码看问题怎样发生、怎样修好。

教学模型：observer 是单独提供的示例库。这里只解释普通 Go 的编译依赖，不是 LoongSuite 的真实生成代码，也没有修改 业务项目。


### 情况：从失败到修好

先增加一行调用，看见真实构建错误，再补充同一份业务 go.mod，最后区分构建与运行。


#### 画面 1：原程序：只查房间，能正常运行

FindRoom(42) 只返回“语聊房间”。这里没有调用 observer，因此构建时也不需要找这个外部库。

为什么：只有程序实际需要的包，才需要为这次构建准备。先记住原业务结果，修好以后还要对照它。

业务 main.go 中的函数 · 节选

```go
func FindRoom(id int) string {
    return "语聊房间"
}
```

现在得到：运行原程序，输出：语聊房间。


#### 画面 2：新需求：调用 observer.Record 记录一次执行

我们给函数增加 observer.Record("FindRoom")，并在文件开头 import 它。observer 是外部库的包名，Record 是其中的函数名；这个调用会打印一条记录。

为什么：写出一个调用，还需要有实现这个函数的源码。那份源码已经单独提供，但业务的依赖清单还没登记它。

新增的 import 与函数调用 · 节选

```go
import "example.com/observer"

func FindRoom(id int) string {
    observer.Record("FindRoom")
    return "语聊房间"
}
```

现在得到：新问题只有一个：业务构建怎样找到 observer 的代码？


#### 画面 3：先构建一次：错误明确指向缺少 observer

执行 go build，Go 看到了新 import，却没有找到业务模块声明的 observer 依赖。下面是同一组教学代码真实产生的错误关键部分。

为什么：错误发生在生成程序时，不是处理请求时。FindRoom 原来的代码没消失，整个程序因为新依赖没有准备好而构建失败。

真实 Go 错误 · 省略文件行号和提示命令

```text
$ go build -o demo .
no required module provides package example.com/observer
```

现在得到：没有成功生成新程序，所以还谈不上运行时写记录。


#### 画面 4：补同一份 go.mod：声明需要谁、到哪里找

在 demo 原来的 go.mod 中补两行：require 声明需要 observer；replace 把它指向已经准备好的 ../observer 源码目录。这里只改这一份业务清单。

为什么：本例的 example.com/observer 是虚构地址，不能从网上下载；因此明确使用本地源码。真实 LoongSuite 会按实际位置准备它自己的观测库，精确路径留到源码页。

demo/go.mod · 本例完整文件

```go.mod
module example.com/demo

go 1.24.0

require example.com/observer v0.0.0
replace example.com/observer => ../observer
```

现在得到：再次 go build 成功。它完成了编译，还没有执行 Record。


#### 画面 5：最后才运行：记录和原来的房间名都出现

执行刚刚构建出来的程序，FindRoom 内的新调用才真正运行。先打印观察记录，再返回房间名，由 main 打印。

为什么：补依赖让新代码能参与构建；实际调用让它在运行时执行。原来的查询结果仍然是“语聊房间”。

运行生成的程序 · 真实教学实验输出

```text
$ ./demo
观察记录: FindRoom
语聊房间
```

现在得到：多了一条记录，原业务仍返回同一个房间名。


本页只解释一件事：工具增加了对外部代码的调用，就要同时让业务构建找得到那份代码。改的是原有业务 go.mod；构建成功之后，运行时才会执行新增动作。


## zero/trace · 把同一次请求的三张操作记录连起来

同一条查房请求先进入服务，再查房间，最后查数据库。用请求编号和每个动作的编号，把三张记录连成一棵树。

ID 是短示意值；不代表真实后端查询。


### 情况：一个完整例子

用一条请求链编号和每个动作的编号，理解父子关系。


#### 画面 1：收到一次查房请求，给整条链一个编号

把这次查房请求相关的记录放在一起，统一标成 A。这个共同编号叫 Trace ID。

为什么：服务里同时有许多请求，需要先知道哪些记录属于同一条请求链。

一条请求的共同编号

```text
请求：查房间 42
本条请求链的 Trace ID：A
```

现在得到：后面每个操作都沿用 A，表示属于这一条链。


#### 画面 2：入口操作有自己的编号 01

服务处理请求的这段操作叫一个 Span。它也有自己的编号，叫 Span ID。

为什么：A 用来区分整条请求链；01 用来区分链中的某个具体操作。

第一张操作记录

```text
操作：服务处理请求
Trace ID：A
Span ID：01
```

现在得到：同一张记录同时带整条链的编号 A 和自己的编号 01。


#### 画面 3：查房间是第二个操作，记录是谁叫了它

入口操作 01 调用 FindRoom。查房间这张记录沿用 Trace ID A，自己的 Span ID 是 02，父操作写 01。

为什么：只有共同编号 A，还不知道谁调用谁。父操作编号把直接调用关系补上。

第二张操作记录

```text
操作：FindRoom
Trace ID：A
Span ID：02
Parent：01
```

现在得到：它属于请求链 A，并且是入口操作 01 的下一层。


#### 画面 4：数据库查询再接下一层，形成调用树

FindRoom 02 调用数据库，数据库操作编号为 03，父操作是 02。现在三张记录能够按调用顺序连接。

为什么：各动作共享 Trace ID，同时保留各自的 Span ID 和父操作。后面的 context 课程会解释这些信息怎样随调用传递。

把三张记录按父操作连起来

```text
请求链 A
└─ 01 服务处理请求
   └─ 02 FindRoom       Parent=01
      └─ 03 数据库查询  Parent=02
```

现在得到：同一 Trace 中多个 Span 表示多个动作；是否重复，要看是不是同一个动作被记录了两次。


Trace ID 把记录归到同一条请求链；Span ID 区分动作；Parent 把直接调用关系接起来。


## chapter/orientation · 观察 FindRoom(42)

直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。

示意调用和输出；不连接 OTel 后端。


### 情况：一个完整例子

直播请求要查 42 号房间；返回值告诉我们“查到了什么”，却没有告诉我们“花了多久”。


#### 画面 1：只有业务调用

FindRoom 直接返回房间名。此时功能可用，但排查慢请求没有证据。

为什么：先把“功能正确”和“过程可见”分开。

业务代码

```go
room := FindRoom(42)
fmt.Println(room)
// 输出：语聊房间
```

现在得到：结果：语聊房间


#### 画面 2：记下开始时间

在调用前增加一个开始记录点，仍然只调用一次原函数。

为什么：记录点必须围绕原调用，不能替换业务结果。

加入开始记录

```go
start := time.Now()
room := FindRoom(42)
```

现在得到：中间状态：正在查房间


#### 画面 3：调用结束后计算

函数返回后计算 elapsed，并把结果一起写出。

为什么：退出位置才能知道完整耗时和最终结果。

加入结束记录

```go
elapsed := time.Since(start)
log.Printf("FindRoom room=%s elapsed=%s", room, elapsed)
```

现在得到：新增：FindRoom room=语聊房间 elapsed=12ms


#### 画面 4：工具要重复做这件事

如果 HTTP、数据库、消息处理都需要同样的前后动作，手写会重复；插桩工具的目标就是把这类动作接到许多目标函数。

为什么：先理解自动化的动机，再读规则和 AST。

观察到的最终效果

```text
请求 → 进入记录 → 原函数 → 退出记录 → 响应
```

现在得到：结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。


结论：插桩增加观察，不应凭空改变 FindRoom 的业务结果。


## chapter/go-foundations · 让函数带着 context 工作

FindRoom 收到请求上下文后，把它交给下一个查询操作。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

FindRoom 收到请求上下文后，把它交给下一个查询操作。


#### 画面 1：起点：普通函数

先写普通函数，调用者没有办法传递请求取消。

为什么：取消信号必须从入口传到下一层，只有房间 ID 无法表达请求生命周期。

普通函数

```go
func FindRoom(id int) (string, error)

room, err := FindRoom(42)
```

现在得到：结果能返回，但请求边界没有进入函数


#### 画面 2：增加 ctx 参数

ctx 是调用者交接请求信息的明确通道。

为什么：ctx 参数使调用者能明确交接超时、取消和父 Span 所在上下文。

签名变化

```text
func FindRoom(ctx context.Context, id int) (string, error)
```

现在得到：函数现在知道请求何时取消


#### 画面 3：调用者沿链传递

只在入口拿到 ctx 还不够，下一层也要继续传。

为什么：中间某一层换成 Background，会丢掉显式交接的请求信息。

链路

```go
ctx := r.Context()
room, err := FindRoom(ctx, 42)
query(ctx, room)
```

现在得到：同一个请求上下文贯穿调用


#### 画面 4：核验：自检

检查 error 和 ctx 是否真的被使用。

为什么：代码里有 ctx 参数还不够，调用的下层必须实际响应取消。

自检

```text
go vet ./...
测试取消 ctx 后 query 是否停止
```

现在得到：结论：context 是显式参数，不是自动附着在任意 goroutine 上。


结论：context 是显式参数，不是自动附着在任意 goroutine 上。


## chapter/build · 用 toolexec 看一次真实编译

go build 会调用 compiler、linker；toolexec 是一个包装入口。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

go build 会调用 compiler、linker；toolexec 是一个包装入口。


#### 画面 1：起点：普通命令

普通 build 直接调用底层编译工具，插桩工具看不到每次编译输入。

为什么：普通构建先理解清楚，才能定位 LoongSuite 在哪里加入加工。

普通命令

```sh
go build -o app .
```

现在得到：程序构建成功，但没有额外观测


#### 画面 2：加入包装器

toolexec 接到 compiler/linker 命令后可以记录或转发。

为什么：toolexec 是 Go 暴露的入口，不用修改 Go 编译器二进制也能接到工具动作。

命令

```sh
go build -toolexec=/tmp/otel-tool -o app .
```

现在得到：构建链多了一个可观察入口


#### 画面 3：包装器转发

包装器必须保留退出码和参数，才能不破坏构建。

为什么：编译器收到的参数和失败状态是构建契约，包装器必须保留。

转发

```go
otel-tool compile args...
→ compile args...
otel-tool link args...
→ link args...
```

现在得到：Go 仍能生成 app


#### 画面 4：核验：日志

用日志确认版本探测和实际命令都经过包装器。

为什么：只有看到真实 compile/link 经过包装器，才证明接入发生了。

日志

```text
-V=full
compile ...
link ...
```

现在得到：结论：toolexec 是编译期入口，不是运行时 Span。


结论：toolexec 是编译期入口，不是运行时 Span。


## chapter/ast · 把 HTTP 方法定位成语法节点

规则要找 net/http 的 RoundTrip，而不是把注释和字符串里的文字一起改掉。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

规则要找 net/http 的 RoundTrip，而不是把注释和字符串里的文字一起改掉。


#### 画面 1：起点：原始源码

文本搜索会误命中注释、字符串和同名函数。

为什么：注释中的 RoundTrip 和真实方法声明不是一回事，文本搜索无法稳定区分。

原始源码

```go
// RoundTrip 只是注释
func (t *Transport) RoundTrip(r *http.Request) (*http.Response, error) {
    return t.next(r)
}
```

现在得到：需要按函数和 receiver 匹配


#### 画面 2：解析成树

AST/DST 能分别看到注释、函数名和 receiver 节点。

为什么：语法树把名字、receiver 和函数体变成不同节点，便于精确选中。

树节点

```text
File
└── FuncDecl
    ├── Recv: *Transport
    └── Name: RoundTrip
```

现在得到：目标身份明确


#### 画面 3：只改目标节点

结构化改写能在函数体开头插入 hook。

为什么：只在选中的函数体插入动作，才能避免误改注释或其他同名函数。

生成片段

```go
func (t *Transport) RoundTrip(...) {
    hookEnter(t, r)
    return t.next(r)
}
```

现在得到：生成代码仍保持方法 receiver


#### 画面 4：核验：验证

重新格式化并编译生成文件。

为什么：看起来正确的生成文本仍可能类型不对，需要编译和行为检查。

验证

```text
gofmt -w generated.go
go test ./...
```

现在得到：结论：树改写的第一证据是生成源码和编译结果。


结论：树改写的第一证据是生成源码和编译结果。


## chapter/otel · 从 Start 到 exporter

FindRoom 创建一个 child Span，但 SDK、采样和 exporter 决定它是否最终可查询。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

FindRoom 创建一个 child Span，但 SDK、采样和 exporter 决定它是否最终可查询。


#### 画面 1：起点：父上下文

hook 需要一个已有请求 ctx 来创建 child。

为什么：Tracer 提供创建 Span 的入口；携带父 Span 的 ctx 决定从哪条链继续。

父上下文

```go
ctx := request.Context()
tracer := otel.Tracer("demo-service")
```

现在得到：具备创建 child 的输入


#### 画面 2：Start child

Start 从 ctx 读取父 Span，生成新 SpanID。

为什么：Start 返回的新 ctx 含新 Span，下一层要用它才能成为当前操作的子节点。

创建

```text
ctx, span := tracer.Start(ctx, "FindRoom")
defer span.End()
```

现在得到：FindRoom 是 server 的孩子


#### 画面 3：采样决定记录

有效 ID 不代表一定 Recording。

为什么：有 TraceID 只是上下文有效；是否被 SDK 记录、是否导出还有其他条件。

状态

```go
span.SpanContext().IsValid() = true
span.IsRecording() = true  // 取决于 sampler
```

现在得到：采样通过才进入 processor


#### 画面 4：核验：导出

内存 exporter 直接检查树，避免只看日志。

为什么：后端不通时，内存 exporter 可以先证明 Span 本身和父子关系是否正确。

导出

```text
exported["FindRoom"].ParentSpanID == server.SpanID
```

现在得到：结论：TraceID、Recording 和后端入库是三层证据。


结论：TraceID、Recording 和后端入库是三层证据。


## chapter/context · 任务交接和消息传播

预创建 worker 收到 VoiceTask；只有把 ctx 放进任务或 carrier，消费端才能接上生产端。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

预创建 worker 收到 VoiceTask；只有把 ctx 放进任务或 carrier，消费端才能接上生产端。


#### 画面 1：起点：生产请求

worker pool 早于请求创建，不能依赖创建时的闭包上下文。

为什么：worker 比请求早创建，创建协程这一刻还不知道未来要处理谁的任务。

生产请求

```go
ctx := r.Context()
task := VoiceTask{RoomID:42}
```

现在得到：worker 无法知道任务来自哪个请求


#### 画面 2：任务显式带 ctx

任务交接点是上下文传播的边界。

为什么：每个任务各自携带 ctx，才能把任务与正确请求关联。

任务

```text
task := VoiceTask{RoomID:42, Ctx:ctx}
queue <- task
```

现在得到：交接证据存在


#### 画面 3：消息跨进程用 carrier

跨进程不能传 Go context 对象，要传字符串字段。

为什么：另一个进程不能读取本进程的 Go 对象，所以要把上下文编码成消息字段。

消息属性

```json
{ "room_id":42, "traceparent":"00-aaaa...-bbbb...-01" }
```

现在得到：消费端可从消息属性恢复远程父级


#### 画面 4：核验：对照

在普通 SDK 或无可继承 GLS 的 worker 中，对照显式 ctx 与 Background；插桩环境还要检查运行时桥是否介入。

为什么：同一 Trace 可以有很多节点；必须检查直接 parent，才能证明交接点没有接错。

对照

```text
// 普通 OTel SDK / worker 无可继承 GLS 的对照
worker(job.Ctx): parent=request
worker(Background()): new root
```

现在得到：结论：GLS 只能算补救机制，任务和消息边界仍要有 carrier。


同进程任务可携带 ctx；跨进程消息携带字符串字段。两处边界都要验证 TraceID 与直接父 SpanID。


## chapter/architecture · 从 CLI 走到规则加载

用户输入 otel go build，命令层把参数交给 preprocess，再把规则交给 instrument。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

用户输入 otel go build，命令层把参数交给 preprocess，再把规则交给 instrument。


#### 画面 1：起点：用户输入

命令行首先只有字符串参数。

为什么：命令输入只表明目标；还要确认工具如何把目标传给每个阶段。

用户输入

```sh
otel go build -o demo-service .
```

现在得到：CLI 解析出构建动作和参数


#### 画面 2：进入 Preprocess

先准备 go.mod、依赖和规则，避免编译器看不到新增 import。

为什么：新增观察代码也有依赖，提前准备才能让后续编译找到它。

前置阶段

```text
precheck → updateGoMod →
newDeps/syncDeps/matchRules
```

现在得到：得到最终 bundles


#### 画面 3：交给 Instrument

toolexec 看到具体编译命令后才改写目标函数。

为什么：只有具体编译动作才知道本次处理哪个包、哪些源文件。

编译阶段

```go
runBuildWithToolexec(...)
→ instrument package net/http
```

现在得到：生成改写后的目标包


#### 画面 4：核验：日志

按日志的 PhaseTimer 对齐阶段。

为什么：阶段日志把失败缩小到准备、改写或真实编译，避免从头猜。

日志

```text
Preprocess: ...
Instrument: ...
Build completed successfully
```

现在得到：结论：每层有自己的输入输出，排障时先确定卡在哪层。


结论：每层有自己的输入输出，排障时先确定卡在哪层。


## chapter/rules · 版本范围决定是否尝试插桩

gorm 规则要求 gorm 版本落在范围内；版本不匹配时不是“hook 运行失败”，而是规则不会被选中。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

gorm 规则要求 gorm 版本落在范围内；版本不匹配时不是“hook 运行失败”，而是规则不会被选中。


#### 画面 1：起点：依赖

业务实际 gorm 版本先从构建依赖中得到。

为什么：规则根据本次实际构建版本判断，不能只看项目 README 中的版本说明。

依赖

```text
gorm.io/gorm v1.25.12
```

现在得到：拿到真实版本


#### 画面 2：读取规则范围

规则文件的范围是 [1.22.0,1.25.10)。

为什么：左边方括号包含 1.22.0，右边圆括号不包含 1.25.10，更不包含 1.25.12。

规则 JSON

```json
{ "Version":"[1.22.0,1.25.10)",
  "Function":"Open" }
```

现在得到：1.25.12 超出上界


#### 画面 3：不生成 gorm bundle

匹配阶段跳过比强行改写更安全。

为什么：跳过这条规则不会自动阻止别的包插桩；构建成功也不能证明它被选中了。

匹配结果

```go
match(gorm v1.25.12) = no rule
bundles = []
```

现在得到：不会得到 gorm 插桩 Span


#### 画面 4：核验：排查

升级版本后先检查规则范围和生成日志。

为什么：改版本范围只放开匹配条件，不能证明新版本内部函数仍兼容。

排查

```text
日志：skip gorm: version not in range
验证：go list -m gorm.io/gorm
```

现在得到：结论：扩展规则范围要配合签名和行为测试，不能只改数字。


结论：扩展规则范围要配合签名和行为测试，不能只改数字。


## chapter/hooks · OnEnter / OnExit 的调用约定

net/http RoundTrip 的 hook 在进入时拿到 Transport 和 request，退出时拿到 response 与 error。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

net/http RoundTrip 的 hook 在进入时拿到 Transport 和 request，退出时拿到 response 与 error。


#### 画面 1：起点：http 规则

规则先指定目标方法和 hook 名称。

为什么：规则把目标函数与观察函数连接；之后签名必须与生成桥一致。

http 规则

```json
{ "Function":"RoundTrip", "ReceiverType":"\\*Transport",
  "OnEnter":"clientOnEnter", "OnExit":"clientOnExit" }
```

现在得到：目标身份和 hook 名称确定


#### 画面 2：进入签名

OnEnter 要看到请求，才能创建客户端 Span 和注入 header。

为什么：进入时需要原方法的 receiver 与参数，才能观察对应请求。

OnEnter

```text
func clientOnEnter(call api.CallContext,
    t *http.Transport, req *http.Request)
```

现在得到：入口可以读取 request


#### 画面 3：退出签名

OnExit 接收返回值；receiver 不会再次作为第二个参数出现。

为什么：退出时关注返回值，当前形状不会把 receiver 再作为返回参数传一次。

OnExit

```go
func clientOnExit(call api.CallContext,
    res *http.Response, err error)
```

现在得到：可结束 Span 并标记错误


#### 画面 4：核验：检查

编译和实际请求验证参数顺序。

为什么：日志出现不代表签名和退出行为都正确，要对真实调用结果做断言。

检查

```text
go test ./pkg/rules/http/...
RoundTrip GET → enter → exit
```

现在得到：结论：hook 契约是规则开发的硬边界。


结论：hook 契约是规则开发的硬边界。


## chapter/runtime · GLS 不是 Go 自动继承

预创建 worker 使用 Background 时，GLS 可能提供额外关联，但显式 ctx 才是任务交接的清晰证据。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

预创建 worker 使用 Background 时，GLS 可能提供额外关联，但显式 ctx 才是任务交接的清晰证据。


#### 画面 1：起点：入口

请求入口有 server Span，但 worker 在请求前已经创建。

为什么：worker 的创建时间与请求不同；创建时继承覆盖不了未来每个任务。

入口

```go
// 服务启动时（先发生）
workerPool.Start()

// 请求到来时（后发生）
ctx, server := tracer.Start(r.Context(), "request")
```

现在得到：创建时不能把未来请求绑定进去


#### 画面 2：提交任务时保存 ctx

提交时才知道这项任务属于哪个请求。

为什么：提交任务时才知道它属于谁，这里是把 ctx 放进任务的时机。

任务字段

```text
jobs <- Job{Ctx:ctx, RoomID:42}
```

现在得到：worker 读取到正确父级


#### 画面 3：对照 Background

没有可继承的 GLS 上下文时，Background 不含显式父 Span，通常成为新根；插桩后还要核实 GLS 是否参与。

为什么：Background 没有显式父 Span；额外运行时机制是否补上关联必须另外验证。

两条路径

```go
// 普通 OTel SDK / 没有可继承的 GLS 上下文
child(job.Ctx): parent=server
child(context.Background()): parent=<root>
```

现在得到：两种 parent 不同


#### 画面 4：核验：验证

用导出 Span 的 ParentSpanID 检查，不只打印 TraceID。

为什么：相同 TraceID 不能区分并列节点和正确父子，检查 parent 才能看出接错。

验证

```text
assert child.ParentSpanID == server.SpanID
```

现在得到：结论：GLS 不是 Go 自带的上下文传播；任务交接仍需显式适配。


结论：GLS 不是 Go 自带的上下文传播；任务交接仍需显式适配。


## chapter/compatibility · 已有 OTel 与自动 hook 去重

服务已经有 otelhttp client Span，自动 net/http hook 需要识别已有 Span，避免一次调用生成两个相同入口。

示例输出和代码为教学快照；需要运行时请使用对应实验。 本例是需要二开与验证的兼容策略，不是上游默认去重保证。


### 情况：一个完整例子

服务已经有 otelhttp client Span，自动 net/http hook 需要识别已有 Span，避免一次调用生成两个相同入口。


#### 画面 1：起点：已有埋点

手动 otelhttp 已经在 request ctx 中创建 client Span。

为什么：同一调用已有 otelhttp client Span，兼容目标是保留它并避免重复创建。

已有埋点

```go
ctx, span := otelhttpTracer.Start(ctx, "HTTP GET")
req = req.WithContext(ctx)
```

现在得到：自动 hook 不应再创建同层入口


#### 画面 2：自动 hook 先检查

用经过验证的作用域、标记或包装关系识别：当前 Span 是否就是这次 otelhttp 客户端操作。

为什么：有效 Span 可能是 server/internal 父节点，只有确认同一 client 操作才应去重。

去重判断

```text
// 兼容策略伪代码：辅助识别函数需要自己实现
if isSameOtelhttpClientOperation(req) {
    skipAutoClientSpan = true
} else {
    startAutoClientSpan()
}
```

现在得到：同一调用只保留手动入口


#### 画面 3：仍可做补充动作

保留已有客户端 Span；谁负责注入请求头、结束 Span 和处理错误，需要按已有包装器与兼容策略验证。

为什么：跳过重复创建后仍要确保原包装器完成传播和生命周期，避免少记录或断链。

结果

```go
request server span
└─ existing otelhttp client span
   duplicate auto client span: skipped
```

现在得到：目标：同一 HTTP 操作只有一个 client Span，合法父子 Span 仍保留。


#### 画面 4：核验：测试

用同一请求比较 Span 数量、parent 和 header。

为什么：Span 数量、直接 parent、传播头和业务结果一起通过，才能证明兼容。

测试

```text
断言：server span 保留
断言：本次 HTTP call 恰好一个 client span
断言：下游 parent == client SpanID
断言：响应/错误语义保持
```

现在得到：结论：去重需要检查上下文和入口职责，不是简单关闭所有自动埋点。


结论：去重需要检查上下文和入口职责，不是简单关闭所有自动埋点。


## chapter/debugging · 从“没有 Span”定位层次

一次 /profile 请求没有查询到 Trace；按构建、运行、导出、查询四层排查。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

一次 /profile 请求没有查询到 Trace；按构建、运行、导出、查询四层排查。


#### 画面 1：起点：构建证据

先确认当前二进制是否真由插桩构建产生。

为什么：二进制没有包含 hook 时，调整 exporter 不会让目标调用突然被记录。

构建证据

```text
build log
matched rule: net/http.RoundTrip
Run Instrument
```

现在得到：构建层暂时通过


#### 画面 2：运行证据

请求必须真正经过目标入口，且 hook 没有 panic。

为什么：命中的规则只有在真实调用经过目标函数时才会执行。

请求日志

```text
request /profile
enter hook
exit hook status=200
```

现在得到：运行层暂时通过


#### 画面 3：导出证据

Span 结束后还要经过 processor/exporter；短进程、采样和地址都可能影响入库。

为什么：Span 结束、采样、处理器和发送链路都影响后端能否看到数据。

发送

```go
span.End()
BatchSpanProcessor → OTLP exporter
export result: accepted
```

现在得到：后端应能收到，但还需查询


#### 画面 4：核验：查询

最后固定 TraceID、service.name 和时间范围查询。

为什么：查询用错时间或服务也会像没有数据；固定同一组 ID 能排除查询偏差。

查询

```text
trace_id=aaaa…
service.name=demo-service-test
range=±5m
```

现在得到：结论：没有 Span 不是一个原因，要逐层找证据。


结论：没有 Span 不是一个原因，要逐层找证据。


## chapter/capstone · 为已有 OTel 服务加一条安全规则

给已有手动 HTTP 埋点的服务增加一个数据库规则，要求先验证版本、入口和去重。

示例输出和代码为教学快照；需要运行时请使用对应实验。


### 情况：一个完整例子

给已有手动 HTTP 埋点的服务增加一个数据库规则，要求先验证版本、入口和去重。


#### 画面 1：起点：现状表

先列出现有 otelgorm/手动 Span 与目标数据库版本。

为什么：先盘点已有埋点和实际版本，才能知道是缺少观察还是已经重复。

现状表

```text
existing: otelgorm enabled
manual tracer: db.query
gorm: v1.25.12
rule range: [1.22.0,1.25.10)
```

现在得到：不能直接宣布兼容


#### 画面 2：规则先做最小改动

先决定规则是否能命中，再决定如何去重。

为什么：扩展范围让规则有机会命中；函数签名和行为是否兼容还需要实测。

方案

```json
{ "Version":"[1.22.0,1.26.0)",
  "OnExit":"afterGormOpen" }
```

现在得到：规则准备进入验证


#### 画面 3：兼容策略

保留指标和必要旧逻辑，跳过重复数据库入口；不要同时安装两套同层 server 入口。

为什么：保留原有指标与必要埋点时，应给同一操作明确唯一的记录职责。

链路

```go
request Span
└─ one DB entry span
   └─ SQL attributes
```

现在得到：职责没有重叠


#### 画面 4：核验：验收清单

测试命中、Span 数、parent、响应头和任务边界。

为什么：可重复的对照与回滚步骤，才能把一次试验变成可维护的二开改动。

验收清单

```text
version hit ✓
one entry span ✓
parent/span IDs ✓
worker ctx handoff documented ✓
```

现在得到：结论：二开不是只改一条规则，要把版本、旧埋点、边界和证据一起锁定。


结论：二开不是只改一条规则，要把版本、旧埋点、边界和证据一起锁定。
