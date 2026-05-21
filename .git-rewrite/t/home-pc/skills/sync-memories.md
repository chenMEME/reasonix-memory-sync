---
name: sync-memories
description: 「更新记忆」— 从 GitHub 同步记忆到本机（确定性脚本 + AI 协调）
---
# sync-memories — 多设备记忆同步（混合模式）

## 前置条件
- 已安装 Node.js
- 已下载 `sync.js`（从 GitHub 仓库 `client/sync.js` 获取）
- GitHub MCP 正常工作

## 流程

### 1. 备份
运行 `node sync.js backup`（sync.js 在 workspace 根目录）。
输出 JSON 包含备份路径。出错时用此路径恢复。

### 2. 读取 computers.json
`github_get_file_contents` → `chenMEME/reasonix-memory-sync` 的 `computers.json`
获取 pathPairs（路径翻译表）和其他电脑清单。

### 3. 逐台同步
对每台远程电脑：

**读取快照：** `github_get_file_contents` → `{id}/snapshot.json`

**读取全局记忆：** 对 manifest 中每个文件，从 `{id}/memories/global/{file}` 读取
**读取项目记忆：** 从 `{id}/memories/project/{file}` 读取
**读取 Skills：** 从 `{id}/skills/{file}` 读取
**读取 Config：** 从 `{id}/config.json` 读取

### 4. 路径翻译
用 computers.json 的 pathPairs，将远程路径替换为本机路径。

### 5. 写入本地
将数据组装为 JSON，写入本地文件：
- 全局记忆 → `~/.reasonix/memory/global/`
- 项目记忆 → `~/.reasonix/memory/<hash>/`
- Skills → `<workspace>/.reasonix/skills/`

### 6. Config 互补
添加本地没有的 MCP 服务器，用无 BOM UTF-8 写回。

### 7. 报告
输出变更统计。
