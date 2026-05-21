---
name: upload-memories
description: 「上传记忆」— 收集本机记忆并上传到 GitHub 同步仓库（确定性脚本 + AI 协调）
---
# upload-memories — 上传本机记忆到同步仓库

## 前置条件
- 已安装 Node.js
- `sync.js` 在 workspace 根目录（从 GitHub 仓库 `client/sync.js` 获取）
- GitHub MCP 正常工作
- **本机已运行过 `node sync.js init --id <电脑ID>`**（检查 `~/.reasonix/sync-config.json`）

## 流程

### 1. 检查身份
检查 `~/.reasonix/sync-config.json` 是否存在且包含 `computerId`。
- 不存在 → 提示用户先运行 `node sync.js init --id <电脑ID>`
- 存在 → 继续

### 2. 读取远程快照
`github_get_file_contents` → `{computerId}/snapshot.json`
记录远程已有文件列表，用于检测删除。

### 3. 收集本机数据
运行 `node sync.js collect`，获取 JSON 输出。
```json
{
  "computer": "work-laptop",
  "timestamp": "2026-05-19T...",
  "workspace": "G:\\reasonix",
  "memories": {
    "global": [{ "name": "xxx.md", "content": "..." }, ...],
    "project": [...]
  },
  "skills": [...],
  "config": { ... }
}
```

### 4. 上传文件到 GitHub
对每一类数据，调用 `github_create_or_update_file`：

**全局记忆** → `{computerId}/memories/global/{name}`
**项目记忆** → `{computerId}/memories/project/{name}`
**Skills** → `{computerId}/skills/{name}`
**Config** → `{computerId}/config.json`

已有文件需要传 `sha` 参数（覆盖更新），新增文件不用。

对比远程 snapshot 的 manifest：
- 本地有、远程没有 → 新增文件（不传 sha）
- 本地有、远程也有 → 覆盖更新（传 sha）
- 远程有、本地没有 → 记录到 deleted 清单

### 5. 更新 snapshot.json
用最新 manifest 更新 `{computerId}/snapshot.json`：
```json
{
  "computer": "work-laptop",
  "uploadedAt": "2026-05-19T...",
  "manifest": {
    "globalMemories": { "total": N, "files": [...], "deleted": [...] },
    "projectMemories": { "total": N, "files": [...], "deleted": [...] },
    "skills": { "total": N, "files": [...], "deleted": [...] }
  }
}
```

### 6. 更新 computers.json 的 lastSync
读取 `computers.json`，更新本机 `computers.{computerId}.lastSync` 为当前时间，写回。

### 7. 报告
输出上传统计：文件数、变动数、新增/更新/删除明细。

## 注意事项
- apiKey 已在 collect 阶段自动过滤为 `[FILTERED]`，不上传明文密钥
- 路径翻译由同步的另一端处理，上传时保持原始路径
- 上传前不会自动备份——安全起见先手动 `node sync.js backup`
