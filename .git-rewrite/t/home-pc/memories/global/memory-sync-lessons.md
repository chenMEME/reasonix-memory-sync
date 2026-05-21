---
name: memory-sync-lessons
description: GitHub记忆同步首次同步教训：先diff预览、config.json需手动合并、检查明文密码、路径翻译
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# 记忆同步首次同步教训（2026-05-18）

## 流程教训

### 1. 先 diff 再写入
同步前必须用 `node sync.js diff < remote.json` 预览变更，**绝不能不对比直接覆盖**。
- diff 输出 added/modified/deleted/unchanged 四类
- config.json 的 MCP 差异也要预览
- 用户确认后再执行 write

### 2. config.json 需单独合并
sync.js 的 write 命令需要处理 config.json 合并：
- 保留本机路径（workspaceDir、filesystem 路径等）
- 合并 MCP 列表（远程有本机没有的追加，不覆盖本机已有的）
- 保留本机 apiKey、editMode 等字段

### 3. 脱敏前置查
上传到 GitHub 前必须检查：
- description 字段不能含密码/token 痕迹
- 正文密码用 `[已更新，存储在 XX]` 替代
- 本地路径用环境变量引用或通用占位符
- 端口号标注为"以本机实际为准"

### 4. 路径翻译（pathPairs）
不同机器的路径不同（G:\ vs D:\），同步后需自动翻译路径。
目前需手动检查：user-role-bid-tech、clash-verge-location、mcp-servers-configured 等。

## 指令
下次执行记忆同步时自动引用本教训。