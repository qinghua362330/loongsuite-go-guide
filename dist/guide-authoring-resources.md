# 编写学习指南：skill、方法与模板

核对日期：2026-10-27。选择围绕 LoongSuite Go 源码学习目标，未全局安装第三方 skill。


## teach

类型：Skill · 分阶教学

[官方项目](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach) · [原始说明](https://github.com/mattpocock/skills/blob/main/skills/productivity/teach/SKILL.md)

适合：最贴近本指南目标：把学习目标、短课、交互练习、参考资料和学习记录组织成可持续的教学工作区。强调主动回忆和即时反馈。

局限：需要针对具体项目设计课程与验证代码，不能保证自动生成内容正确。它是教学流程，不是现成 LoongSuite 课程；当前本地安装版本与上游布局可能不同。

本指南借鉴：采用明确任务、分阶课、共享图解组件、测验反馈与本地学习记录；不会把读者尚未完成的课程记成已掌握。

可选安装：

```sh
npx skills add mattpocock/skills --skill teach
```


## doc-coauthoring

类型：Skill · 文档协作

[官方项目](https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring) · [原始说明](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md)

适合：收集读者背景，迭代结构，再让没有上下文的读者检验文档。适合避免作者“以为已经讲清楚”。

局限：不是课程生成器，也不校验 Go 示例；它的流程不能替代真实编译与读者练习。

本指南借鉴：采用读者目标、结构迭代和独立读者审查的方法。现有会话已提供背景，不重复要求填写访谈。

可选安装：

```sh
npx skills add anthropics/skills --skill doc-coauthoring
```


## frontend-design

类型：Skill · 交互表现

[官方项目](https://github.com/anthropics/skills/tree/main/skills/frontend-design) · [原始说明](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

适合：确定视觉方向、字体、布局和交互细节，避免只有文字堆叠或通用模板卡片。

局限：界面质量不等于教学质量；技术正确性、可访问性与测试仍需单独验证。

本指南借鉴：阅读式布局、源码旁注、可操作的因果图解。图解明确标记教学模型。

可选安装：

```sh
npx skills add anthropics/skills --skill frontend-design
```


## Diátaxis

类型：方法 · 文档架构

[官方项目](https://diataxis.fr/) · [原始说明](https://diataxis.fr/tutorials/)

适合：区分学习教程、操作指南、参考资料、原理解释。先让读者获得一次具体成功，再逐步引入复杂度。

局限：四类文档不是强制的学习先后顺序；不要把全部概念与异常情况塞进第一次实验。

本指南借鉴：学习路线承担教程；源码地图与术语表承担参考；实验页承担操作；每章正文解释设计。


## Google Technical Writing

类型：方法 · 写作与图解

[官方项目](https://developers.google.com/tech-writing) · [原始说明](https://developers.google.com/tech-writing/two/large-docs)

适合：定义读者与前置知识，组织长文，用具体示例、反例和图注降低理解负担。

局限：主要是技术写作课程与规范，不是可直接安装的 skill，也不是特定项目的源码教程。

本指南借鉴：每章列出前置、产出、实验预期与常见误解；图有可读的文字结论。


## Starlight

类型：模板 · Astro 文档站

[官方项目](https://github.com/withastro/starlight) · [原始说明](https://starlight.astro.build/getting-started/)

适合：内容为主的长期文档站。可从现成导航、搜索、国际化、代码块和文档组件开始，减少基础排版工作。

局限：复杂实验需要自己写交互组件；它提供文档骨架，不替你设计学习进阶。

本指南借鉴：参考侧栏、当前章节导航和读者优先的文档信息层级。

可选安装：

```sh
npm create astro@latest -- --template starlight
```


## VitePress

类型：模板 · Markdown + Vue

[官方项目](https://github.com/vuejs/vitepress) · [原始说明](https://vitepress.dev/guide/using-vue)

适合：适合 Vue 团队；Markdown 内可以组合 Vue 组件，方便把规则匹配器、上下文图等放进教程。

局限：需要维护 Vue 组件及构建工具；Markdown 中运行的组件要满足 SSR 约束。

本指南借鉴：借鉴“说明文字紧邻互动组件”的方式。本手册用原生 JS，保持零网站依赖。

可选安装：

```sh
npx vitepress init
```


## Docusaurus

类型：模板 · MDX + React

[官方项目](https://github.com/facebook/docusaurus) · [原始说明](https://docusaurus.io/docs)

适合：适合 React 团队、多语言与多版本文档；MDX 允许在说明中组合 React 实验组件。

局限：版本化和插件体系会增加维护量；一个人的首版学习手册不必先引入整套平台。

本指南借鉴：借鉴版本固定与学习章节结构，不复制框架或主题代码。

可选安装：

```sh
npx create-docusaurus@latest my-guide classic
```


## GitHub Skills / Learn

类型：方法 · 任务反馈

[官方项目](https://learn.github.com/) · [原始说明](https://github.com/skills)

适合：把学习拆成小任务，用动作和反馈推动进度。适合学习 GitHub 工作流与仓库协作。

局限：不是专门的源码教材编写 skill，也不能直接生成 LoongSuite 原理课程。

本指南借鉴：每步有实际产物、检查题和能力清单。完成标记由读者自评与测验共同确认。



## 可复用章节模板

# 第 N 课：用一个动作表达目标

## 完成后你能做什么
- 可验证的能力，不写“了解某概念”

## 你需要先会什么
- 对应前置章节 / Go 知识

## 为什么需要它
用一个真实故障说明缺少此能力会发生什么。

## 最小模型
一张只表达一个因果关系的图；紧邻文字写出结论。

## 先做一次
1. 明确所在目录与版本。
2. 给出可复制命令。
3. 展示实际输出，并说明输出中的哪一行证明了目标。

## 对照与反例
只改变一个变量：ctx / 版本 / hook / carrier / sampler。

## 回到源码
固定 commit 的文件、符号和行号；提出一个阅读问题。

## 自己改一次
给出任务、约束、成功断言与参考答案。

## 过关检查
读者能解释原因、复现实验、修改代码并证明没有回归。

## 来源与局限
上游文档、代码证据；哪些是模型，哪些实际运行过。