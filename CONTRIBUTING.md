# 贡献指南

欢迎修正解释、补充最小实验和改进图文交互。

## 开始之前

- 本指南固定上游 `v1.15.0 / cac400935add57d8219122ba32857b8f55ac6eb1`。
- 先定位页面路由及对应内容文件，再改动最小范围。
- 区分教学示意、源码事实、本地实验和真实环境验证，不把它们互相替代。

## 修改内容

每页优先讲清：读者遇到什么问题、代码怎样改变、结果如何观察、为什么会得到这个结果。

新增名词在使用处解释，或链接到已学步骤。图中的名称、代码和父子关系必须与对应段落一致。错误答案应告诉读者缺哪一步。

- 入门内容：`dist/zero.js` 与 `dist/course-demos.js`。
- 章节内容：`dist/chapters.js` 与 `dist/course-demos.js`。
- 源码讲解：`dist/source-lessons.js` 与 `dist/source-demos.js`。
- 图解：`dist/motion-map.js`、`dist/motion-scene.js`；专门的依赖练习见 `dist/dependency-lesson.js`。
- 实验：`labs/` 中的独立模块。

不要直接改生成的 `dist/offline.html`、`dist/generated-data.js`、`dist/guide.md` 或实验 ZIP，修改输入后重新生成。

## 验证与提交

```sh
npm run build
npm run check
git diff --check
```

修改实验时，另行执行被修改的实验。涉及 LoongSuite hook 时，要区分普通 `go run` 与实际插桩构建；没有运行的验证应如实注明。

提交说明应写清楚问题、改动和验证结果。截图只展示最小教学例子，不包含内部地址、凭据或真实业务日志。不要提交研究缓存、编译缓存、二进制或私人学习记录。
