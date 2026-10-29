# LoongSuite Go 学习资源

## Knowledge

- [Go 官方：How to Write Go Code](https://go.dev/doc/code)
  用于解释 package、module、go.mod 与 import 路径的最小关系。
- [Go 官方：管理依赖](https://go.dev/doc/modules/managing-dependencies)
  用于解释 require、go get、go mod tidy 等依赖操作。
- [Go 官方：Modules Reference](https://go.dev/ref/mod)
  用于核对 go.mod、go.sum、replace 和模块解析的精确定义。
- [LoongSuite Go 固定版本源码](https://github.com/alibaba/loongsuite-go/tree/cac400935add57d8219122ba32857b8f55ac6eb1)
  用于从概念进入 v1.15.0 对应的实现；源码解释不代替实际实验。

## Wisdom

本课程当前不安排社区或外部交流任务；先完成本地实验和源码阅读。

## Gaps

- 入门页使用教学用 observer 和 FindRoom；它们只解释编译关系，不代表 业务项目 的真实运行时配置。
- 规则匹配、AST/DST、linkname、传播和消息交接留到后续章节，避免在入门阶段同时引入。
