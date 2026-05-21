---
name: memory-sync-system
description: 多设备记忆同步方案：GitHub 仓库 + STANDARD.md v1.0 + sync.js + 混合 skill
type: reference
scope: global
created: 2026-05-18
priority: high
---
# 多设备记忆同步系统（STANDARD v1.0 + 混合模式）

## 仓库
GitHub: `chenMEME/reasonix-memory-sync`（私有）
规范: [STANDARD.md](https://github.com/chenMEME/reasonix-memory-sync/blob/main/STANDARD.md)
脚本: `client/sync.js`（确定性实现，零依赖 Node.js）

## 架构
**混合模式：** sync.js 做本地文件操作，AI 通过 MCP 工具做 GitHub API 操作
- `node sync.js collect` → 收集本机记忆输出 JSON
- `node sync.js write` → 从 stdin 读 JSON 写入本地
- `node sync.js backup` → 备份 .reasonix 目录

## 优势
- ✅ 确定性 — 文件操作由脚本执行，不依赖 AI 理解
- ✅ 零依赖 — 只用 Node.js 内置模块
- ✅ 免 token — GitHub 操作走 MCP 工具
- ✅ N 台电脑 — 任意数量，ID 自定
- ✅ 路径翻译 — pathPairs 支持跨平台
- ✅ 备份恢复 — sync 前自动备份

## 技能
1. **upload-memories** — 上传本机记忆到 GitHub
2. **sync-memories** — 从 GitHub 同步到本机
