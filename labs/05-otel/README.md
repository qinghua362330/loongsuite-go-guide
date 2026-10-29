# 05：用 OTel SDK 证明父子 Span 与载体传播

## 这一步学什么

`context.Context` 只是 Go 进程内的上下文；跨 HTTP、消息或 RPC 边界时，必须把 SpanContext 编码到载体，再在接收端提取。本实验使用 OTel SDK 的内存 exporter，不连接任何外部服务，直接断言三件事：

```text
request ──child──> child ──Inject/Extract──> remote-child
   └────────────── 同一个 TraceID ──────────────┘
```

## 运行

```bash
cd labs/05-otel
go mod tidy
go run .
```

输出是 4 个已导出 Span 的 JSON。`request` 的 `parent_span_id` 是全零，表示没有有效父节点，`child` 的父 ID 是 `request.span_id`，`remote-child` 的父 ID 是 `child.span_id`，前三个关联节点的 `trace_id` 相同。`detached` 使用 Background 创建新的根；`unsampled-child` 保留有效 TraceID，但默认 ParentBased 尊重未采样父节点，因此不记录且不导出。若任一关系不满足，程序以非零状态退出。

## 关键代码

- `tracetest.NewInMemoryExporter`：把已结束的 Span 留在内存中，适合实验断言。
- `propagation.MapCarrier`：模拟 HTTP Header 或消息 Properties。
- `Inject` / `Extract`：跨边界传播；仅创建 goroutine 并不会跨消息自动传播。
- `ParentBased(AlwaysSample())`：让本实验的 Span 确实被采样并导出。

## 动手题

把 `Extract(context.Background(), carrier)` 改成 `Extract(context.Background(), propagation.MapCarrier{})`，观察 `remote-child` 会变成新的 Trace；再恢复代码。这个差异就是消息生产端必须写入、消费端必须读取载体的原因。

注意：这是未插桩的原生 OTel SDK 实验。LoongSuite 的 GLS hook 可能参与选择父节点，不能把这里的 Background 结论当作插桩后的所有路径保证。
