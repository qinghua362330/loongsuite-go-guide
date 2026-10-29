# 04：从自定义规则到真实编译期 hook

## 目标与边界

本实验把一条真实的 LoongSuite v1.15.0 规则拆开看：`rule.json` 匹配
`net/http.(*Transport).RoundTrip`，`rules/hook.go` 提供 `OnEnter` / `OnExit`
函数。回调通过 `api.CallContext` 与 `go:linkname` 和被改写的目标包连接；它们只打印方法和响应状态，便于先验证签名、链接和生命周期。

普通构建不启用探针，因此这里的基线是：

```sh
cd labs/04-custom-hook
go run .
# plain-result 42 status 204
```

## 使用上游工具

先用干净的 v1.15.0 源码构建 `otel`，再在本目录执行：

```sh
/ABS/PATH/otel set -disable= -rule="$PWD/rule.json" -debug
/ABS/PATH/otel go build -o instrumented .
./instrumented
```

这里必须使用 `-disable=`。`-disable=all` 只保留 `base.json` 和自定义规则；它会排除
LoongSuite 自身需要的 OTel SDK/runtime 文件规则，不能用来证明一个正常的 SDK 插桩构建。
`-disable=` 则保留全部默认规则，再追加 `rule.json`。规则文件是数组，因为工具支持多个
规则对象。

## 本次验证结果

普通基线和真实自动插桩都已通过。使用干净 v1.15.0 工具、Go 1.26.2，且在临时副本中执行
`-disable=` 后，输出包含：

```text
hook-enter method=GET
hook-exit status=204
plain-result 42 status 204
```

这证明默认规则、`net/http` 自定义规则和 `OnEnter` / `OnExit` 可以共同编译运行。过程中曾
出现过两类独立问题：`-disable=all` 会裁剪 OTel SDK/runtime 文件规则，可能触发
`GetTestSpans`、`runtime.ExitHook` 等 undefined；另一个问题是 receiver 正则多转义一层，
会导致自定义规则未匹配。修正 JSON 文本为 `"\\*Transport"` 并使用完整默认规则后通过。
`-disable=all` 仍然不应作为正常验证配置。

运行期间没有 OTLP collector 时，自动生成的初始化 Span 会把 POST 上报到 localhost:4318，
因此可能看到 connection refused；这不影响本实验对自定义 hook 输出的断言。`.otel-build`
是诊断产物，不属于教学源码，也不应提交。

## 如何继续排查

1. 在 `.otel-build/matched.json` 搜索 `net/http`，确认自定义规则和默认 HTTP 规则都命中；
   注意同一函数可能同时有多条规则，实际项目要用禁用规则避免重复 Span。
2. 若看到 receiver 未命中，先核对版本半开区间、包路径和 JSON 正则转义：Go 类型 `*Transport`
   在 JSON 中应写成 `"\\*Transport"`。
3. 若看到 `GetTestSpans` 或 `runtime.ExitHook` 未定义，再检查是否误用了 `-disable=all`，
   以及 SDK/runtime 文件规则是否进入 matched.json；不要用手工改最终二进制绕过编译。

## 动手题

把 `rule.json` 的 `Function` 改成一个不存在的方法，观察工具是否报告“未命中”或无新增 hook；
再恢复。阅读 `pkg/api` 和 `tool/instrument` 的 trampoline 代码，重点确认 `CallContext` 如何
保存调用帧，以及哪些参数/返回值能力由源码实际提供；本实验不宣称尚未运行成功的
`SetParam` / `SetReturnVal` 效果。

## 独立发行的依赖来源

`rules/go.mod` 使用对应固定上游提交的公开版本：

```text
github.com/alibaba/loongsuite-go/pkg v0.0.0-20260928033626-cac400935add
```

它不再依赖本机研究目录。首次解析需要下载模块；LoongSuite 构建时也会准备自己的运行库。2026-10-29 已在独立发行目录中通过 `--with-otel` 真实构建与运行检查。
