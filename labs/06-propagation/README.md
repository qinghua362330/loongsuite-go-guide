# 06：W3C、B3 多头与 B3 单头的传播冲突

## 实验边界

这是一个真实 OTel propagator 的载体模型实验：使用 OTel `v1.45.0`，B3 propagator
固定为 `v1.34.0`（与现有案例版本一致），但不连接真实网关、不访问业务服务。它能证明
客户端载体的读写和冲突优先级，不能替代网关转发链路验收。

## 运行

```sh
cd labs/06-propagation
go run .
```

输出表格覆盖：

```text
W3C only
B3 multi only
B3 single only
W3C + B3 multi (B3 last)
B3 single + multi
inject multi keeps old b3
clear old B3 then inject
```

## 传播器顺序

实验组合器明确使用：

```go
propagation.NewCompositeTextMapPropagator(
    propagation.TraceContext{},
    propagation.Baggage{},
    b3.New(b3.WithInjectEncoding(b3.B3MultipleHeader)),
)
```

因此在同一个载体同时存在有效 W3C 和 B3 多头时，B3 位于最后，提取结果覆盖 W3C。
有效 B3 单头与多头同时存在时，B3 propagator 按单头优先，结果仍是单头的 TraceID。

## 最容易踩坑的结论

`Inject` 使用 B3 多头编码并不会自动删除载体里已有的旧 `b3` 单头。实验先保留旧单头再
注入新的多头，提取仍读到旧单头；这会让出站请求看起来像没有接上新的父链路。正确做法是
在统一的出站边界清理旧的 `b3` 与 `x-b3-*`，再注入新的传播上下文。实验最后一行断言清理
后 TraceID 仍为 `1111…`，而父 SpanID 从旧 `1111…` 更新为出站的 `3333…`。这正说明 ID 相同仍可能有错误父子关系。

表格中的固定 ID 由合法的 `trace.SpanContext` 构造，用来模拟网关出站上下文；它不是对真实
网关是否改写 Header 的验收。真实环境仍需抓取网关前后请求头和应用 Span 对齐验证。

## 动手题

删掉 `clearB3(clean)` 再运行，观察最后一个案例重新得到旧单头的父 SpanID `1111…`；恢复后再运行。
然后把组合顺序中的 B3 移到 W3C 前面，观察冲突矩阵为什么发生变化。
