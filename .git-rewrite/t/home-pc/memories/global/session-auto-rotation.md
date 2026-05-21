---
name: session-auto-rotation
description: 会话80-100条轮换+checkpoint，新会话自动续接绝不问"之前干了啥"（合并了length-guideline和init-rules）
type: project
scope: global
created: 2026-05-18
priority: high
---
# 会话自动轮换工作流（含 Checkpoint 机制 + 初始化规则）

## 轮换规则
- **80-100条消息** → 主动提醒用户保存 checkpoint 并 /new
- **120 条硬上限** → 无论如何都要轮换了
- 切换任务主题时也应 /new（即使不满 80 条）
- 主动提醒是硬性责任，不要等用户发现会话已很长

## Checkpoint 机制

### 轮换前（会话 ~80 条时）
1. `remember(scope:"project", name:"session-checkpoint", priority:"high")` — 保存项目上下文
2. `todo_write(当前进度)`
3. 告知用户："已保存 checkpoint，/new 后自动续接"

### 新会话恢复（用户说"继续"）
1. 检查 MEMORY.md 索引 → 发现 `session-checkpoint`
2. 立即 `recall_memory("session-checkpoint", "project")`
3. 根据内容直接续接工作
4. **★ 绝不问用户"之前干了啥"**（硬性约束）
5. **★ 不假设上下文** — 如果用户说"继续"但checkpoint里没有明确记录当前主题，应先确认："你说继续是指 XX 还是 YY？" 避免跑偏

## 初始化规则（吸收自 session-initialization-rules）
- **先看提示词里的记忆列表**，不去文件系统翻找
- **别碰 reasonix_pack/**（那是配置备份包，不是待安装）
- **全局记忆**在 `~/.reasonix/memory/global/`（scope:global）
- **项目记忆**在 `~/.reasonix/memory/<hash>/`（scope:project）
- 用 `remember` 工具写，不用 write_file

## 参考
- token 效率另见 `token-efficiency`
