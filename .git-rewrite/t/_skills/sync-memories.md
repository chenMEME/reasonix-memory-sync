---
name: sync-memories
description: 「更新记忆」— 从 GitHub 同步记忆到本机（确定性脚本 + AI 协调）
---
# sync-memories — 从 GitHub 同步记忆到本机

## 前置条件
- 已安装 Node.js
- `sync.js` 在 workspace 根目录（从 GitHub 仓库 `client/sync.js` 获取）
- GitHub MCP 正常工作
- **本机已运行过 `node sync.js init --id <电脑ID>`**（检查 `~/.reasonix/sync-config.json`）

## 流程

### 0. 检查身份
确认 `~/.reasonix/sync-config.json` 存在。
- 不存在 → 提示用户先运行 `node sync.js init --id <电脑ID>`
- 存在 → 读取 `computerId`，继续

### 1. 备份
运行 `node sync.js backup`。
输出包含备份路径。出错时可用此路径调用 `node sync.js restore <path>` 恢复。

### 2. 读取 computers.json
`github_get_file_contents` → `chenMEME/reasonix-memory-sync` 的 `computers.json`
获取 pathPairs 和所有电脑列表。过滤出**非本机的电脑**作为同步源。

### 3. 读取远程数据
对每台远程电脑，读取其完整数据：

- **snapshot.json** — `{id}/snapshot.json`（获取文件清单）
- **全局记忆** — 遍历 `memories/global/{file}`，逐个读取
- **项目记忆** — 遍历 `memories/project/{file}`，逐个读取
- **Skills** — 遍历 `skills/{file}`，逐个读取
- **Config** — `config.json`

组装为 JSON 格式：
```json
{
  "computer": "home-pc",
  "timestamp": "...",
  "workspace": "G:\\reasonix",
  "memories": {
    "global": [{ "name": "xxx.md", "content": "..." }, ...],
    "project": [...]
  },
  "skills": [...],
  "config": { ... }
}
```

### 4. 差异对比
将远程 JSON 通过 stdin 管道传给 `node sync.js diff`。
输出显示：全局、项目、Skills 各自的 +新增 ~修改 -删除 统计。

### 5. 路径翻译
用 computers.json 的 pathPairs，将远程路径替换为本机路径。
遍历所有记忆/skill 内容，按路径对 ID 逐个替换。

### 6. 写入本地
将翻译后的完整 JSON 通过 stdin 管道传给 `node sync.js write`。
sync.js 会自动：
- 写全局记忆到 `~/.reasonix/memory/global/`
- 写项目记忆到 `~/.reasonix/memory/<hash>/`
- 写 Skills 到 `<workspace>/.reasonix/skills/`
- 合并 MCP 配置到 `~/.reasonix/config.json`

### 7. 报告
输出同步结果：新增/更新/删除了哪些文件、路径翻译了几处、备份路径。

## 注意事项
- 如果某台电脑未运行过 `init`，其 `computerId` 为 `unknown`，该电脑的数据会被跳过
- 发生冲突时保留本地版本，远程版本内容加 `[from <computerId>]` 标记
- 写入前自动合并 config，不会覆盖本机的 apiKey 和 workspaceDir
