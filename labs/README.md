# LoongSuite Go 实验

这些实验只在本地运行，不连接业务环境。它们从 Go `context`、AST 改写和
`-toolexec` 逐步走到自定义 hook。每个实验都标注哪些结论来自标准库、哪些
需要 LoongSuite 原版源码或工具才能验证。

## 前置

需要 Go 1.25 或更高版本；上游 v1.15.0 的 tag SHA 是
`cac400935add57d8219122ba32857b8f55ac6eb1`。请使用这个固定版本的干净上游工具。
下面每段命令都从本指南仓库根目录开始；完成一段后，回到根目录再做下一组。

## 00-start（第一次学习从这里开始）

不安装 LoongSuite、不使用 OTel，只比较普通调用和手动增加的观察动作。

```sh
cd labs/00-start
go run .
mkdir -p .bin
go build -o .bin/observe .
.bin/observe
```

两条业务结果都是 3，带观察的路径额外打印 start/end 和耗时。先解释这段手写代码为什么有用，再学习工具怎样代替重复劳动。

## 01-context

```sh
cd labs/01-context
out=$(mktemp)
go run . >"$out" && sort "$out"
```

输出必须包含 `trace-request`（显式 context 和任务交接）以及 `<root>`（Background
没有链路）。Go 的 goroutine 不会自动继承 context；插桩的 GLS 机制是探针增加的
兼容能力，不是 Go 语言保证。

## 02-ast

```sh
cd labs/02-ast && go run .
```

输出的 `Handle` 函数开头有 `defer observe()`。故意只使用标准库 AST；LoongSuite
用 `dave/dst` 保留注释和语法细节，不能用正则安全地改写 Go 程序。

## 03-toolexec

```sh
cd labs/03-toolexec
mkdir -p .bin
go build -o .bin/toolexec ./wrapper
TOOLEXEC_LOG=$PWD/toolexec.log go build -toolexec=$PWD/.bin/toolexec -o .bin/app .
.bin/app
grep -E 'compile|link' toolexec.log
```

包装器必须转发参数、标准输入输出和退出码；`-V=full` 之外的 go tool 调用也必须
原样转发。LoongSuite 在这一层识别 compile 动作并接入预处理；不要用 `go clean
-cache` 作为默认排查手段。

## 04-custom-hook

从干净上游源码构建工具（输出路径请使用绝对路径）：

```sh
git clone --depth 1 --branch v1.15.0 https://github.com/alibaba/loongsuite-go.git
cd loongsuite-go
test "$(git rev-parse HEAD)" = cac400935add57d8219122ba32857b8f55ac6eb1
go build -o /ABS/PATH/otel ./tool/otel
```

不要把构建产物或 `.otel-build` 诊断目录复制回教学源码。

```sh
cd labs/04-custom-hook && go run .
```

这里用上游 v1.15.0 的真实 `net/http.RoundTrip` hook：`rule.json` 声明目标，
`rules/hook.go` 使用 `api.CallContext`、`go:linkname` 和 `unsafe`，而普通 `go run`
仍只输出 `plain-result ...`。若已构建上游工具，可运行：

```sh
cd labs/04-custom-hook
/ABS/PATH/otel set -disable= -rule=$PWD/rule.json
/ABS/PATH/otel go build -o instrumented .
./instrumented
```

应使用 `-disable=` 保留全部默认规则，再追加自定义规则；`-disable=all` 会排除
LoongSuite 自身需要的 OTel SDK/runtime 文件规则。干净 v1.15.0 工具在 Go 1.26.2
临时副本中已实际编译并运行，输出 `hook-enter method=GET` 和
`hook-exit status=204`。此前出现的 undefined 错误是自定义 receiver 正则多写了一层
反斜杠，已修正。详见 `04-custom-hook/README.md` 和 [实验验证记录](../content/lab-verification.json)。

## 05-otel

```sh
cd labs/05-otel && go run .
```

使用 OTel SDK 内存 exporter 实际断言 `request → child → remote-child` 的
`TraceID`、父 `SpanID` 和 `Inject/Extract` 载体传播；它不依赖 LoongSuite 工具或外部上报服务。

## 06-propagation

```sh
cd labs/06-propagation && go run .
```

使用 OTel `TraceContext`、`Baggage` 和 B3 `v1.34.0` 真实 propagator，验证 W3C、B3 多头、
B3 单头及冲突矩阵。实验是载体模型，不是对真实网关转发的验收；重点观察旧单头必须在
出站边界统一清理后再注入新多头。

## 失败排查

- `go: go.mod file requires go >= 1.25`：检查 `go version`，不要只升级项目的 `go.mod`。
- wrapper 没有日志：确认 `TOOLEXEC_LOG` 是绝对路径且使用了 `go build -toolexec`。
- hook 编译失败：先核对版本闭开区间、目标函数 receiver/参数/返回值，再检查
  `go:linkname` 符号和 `unsafe` 导入。
- 没有新增 Span：先确认采样、TracerProvider、导出地址和查询 tenant，再看规则是否命中。
