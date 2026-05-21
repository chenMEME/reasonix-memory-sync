---
name: memory-transfer-warning
description: 用户打包记忆换机时，必须主动提醒哪些记忆含本地路径/配置，换机不通用
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# 换机记忆转移提醒

## 规则
当用户提到"打包记忆"、"迁移"、"换机"、"搬到另一台电脑"时，**必须主动列出可能造成困惑的本地化记忆**，提醒用户哪些需要排除或修改。

## 需要提醒的记忆特征
- 包含绝对路径（如 D:\xxx、C:\Users\xxx）
- 包含本机端口号（如 API 9097、代理 7897）
- 包含本机特有的配置文件路径
- 包含本机特有的软件版本信息

## 更好的方法：使用记忆同步系统
项目已有自动同步方案，优先推荐使用：
1. **上传记忆** — `run_skill("upload-memories")` 上传本机快照到 GitHub
2. **更新记忆** — `run_skill("sync-memories")` 从 GitHub 拉取合并
详见全局记忆 `memory-sync-system`

## 当前记忆中的本地化条目
- `clash-verge-location` — 含本机 Clash 安装路径、端口号、配置目录
- `default-browser-chrome` — Chrome 路径可能换机不同
- `install-default-d-drive` — D 盘策略可能换机不适用
- `launch-programs-like-human` — 桌面快捷方式因机而异
- `mcp-servers-configured` — MCP 配置含本机路径
- `user-role-bid-tech` — 工作区路径因机而异

## 执行方式
提示句式："以下记忆含有本机路径/端口信息，换机后可能不适用或产生困惑，建议使用 `上传记忆` + `更新记忆` 自动同步"
