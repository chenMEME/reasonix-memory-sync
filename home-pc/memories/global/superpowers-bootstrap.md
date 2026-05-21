---
name: superpowers-bootstrap
description: 每轮回复前检查可用skill，brainstorming→debug→TDD优先
type: project
scope: global
created: 2026-05-18
priority: high
---
# Superpowers Bootstrap

## 核心规则
**在每轮回复之前，检查是否有合适的 skill 可以调用。** 哪怕只有 1% 的可能，也应该检查一下。

## 当前可用 Skills
- `brainstorming` — 任何创造性工作前，先设计再编码
- `test-driven-development` — 实现功能或修 bug 时，测试先行
- `systematic-debugging` — 遇到任何 bug 或异常，先找根因再修
- `verification-before-completion` — 完成前必须运行验证命令
- `using-superpowers` — 核心引导文档
- `web-search` — 快速网络搜索（curl+Clash代理）
- `ocr` — 图片文字提取

## 技能优先级
1. 流程技能优先（brainstorming, systematic-debugging）
2. 实现技能第二（test-driven-development）

## 重要提示
- Skill 是工具，用户指令始终优先
- Rigid 技能（TDD、systematic-debugging）需严格遵守
- 新文件/新项目时优先调用 brainstorming
