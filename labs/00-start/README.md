# 00：一个普通函数，为什么需要观察

只需要 Go，不需要 LoongSuite、OpenTelemetry 或采集服务。

在当前目录运行：

```sh
go run .
mkdir -p .bin
go build -o .bin/observe .
.bin/observe
```

`go run` 会构建后临时运行；`go build` 留下可以再次运行的程序。以上为 macOS/Linux 命令；Windows 可用 `go build -o observe.exe .`、`.\observe.exe`。

预期：普通调用和带观察的调用都返回 3，后者额外打印 start/end 和 elapsed。耗时每次可能不同。此处是手写观察，没有自动插桩、Trace 或 Span。

再改一次：把 main 中两处输入 2 都改成 8；确认两个结果都是 9，并看到记录中的 result 也是 9。自动工具的价值，就是把类似的重复观察代码按规则接入目标函数。
