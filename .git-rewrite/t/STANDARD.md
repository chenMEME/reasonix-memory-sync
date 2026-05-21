# Reasonix Memory Sync Standard v1.0

通用的 Reasonix 记忆/配置/Skills 多设备同步开放标准。

## 概述

本标准定义了一种通过 Git 仓库在多个设备间同步 Reasonix 记忆的方法。
任何 Reasonix 用户都可以搭建自己的同步仓库，或复用他人的同步方案。

## 核心概念

### 电脑（Computer）
每台参与同步的设备有一个唯一 ID，由用户自由命名：
- `home-pc`、`work-laptop`、`macbook-pro`、`server` …

### 路径对（Path Pair）
不同电脑上指向同类资源的路径映射。例如工作区根目录在家用机是 `G:\reasonix`，
在公司机是 `D:\Reasonix`，就构成一个路径对。

### 快照（Snapshot）
某台电脑在某个时间点的完整记忆/配置/Skills 备份。

## 仓库结构

```
<repo-root>/
├── README.md                    # 使用说明
├── STANDARD.md                  # 本规范文档
├── computers.json               # 电脑注册表和路径映射表
├── <computer-id>/               # 每台电脑一个目录
│   ├── snapshot.json            # 快照元数据
│   ├── config.json              # Reasonix 配置（apiKey 已过滤）
│   ├── memories/
│   │   ├── global/              # 全局记忆（scope:global）
│   │   │   ├── MEMORY.md        # 全局记忆索引
│   │   │   └── *.md             # 单条记忆文件
│   │   └── project/             # 项目记忆（scope:project）
│   │       ├── MEMORY.md        # 项目记忆索引
│   │       └── *.md
│   └── skills/
│       ├── index.json           # Skills 元数据
│       └── *.md                 # Skill 文件
└── merged/                      # （可选）合并结果缓存
    └── latest/
```

## 文件格式规范

### computers.json

```json
{
  "standardVersion": "1.0",
  "computers": {
    "home-pc": {
      "description": "家用台式机",
      "platform": "windows",
      "lastSync": "2026-05-18T15:30:00Z"
    },
    "work-laptop": {
      "description": "公司笔记本",
      "platform": "windows",
      "lastSync": "2026-05-17T09:00:00Z"
    }
  },
  "pathPairs": [
    {
      "id": "workspace",
      "description": "Reasonix 工作区根目录",
      "paths": {
        "home-pc": "G:\\reasonix",
        "work-laptop": "D:\\Reasonix"
      }
    },
    {
      "id": "chrome",
      "description": "Chrome 浏览器可执行文件路径",
      "paths": {
        "home-pc": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "work-laptop": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      }
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `standardVersion` | 本标准版本号，客户端据此判断兼容性 |
| `computers` | 所有参与同步的电脑，key 为电脑 ID |
| `computers[].description` | 可读名称 |
| `computers[].platform` | `windows` / `macos` / `linux` |
| `computers[].lastSync` | 该电脑最后上传快照的时间 |
| `pathPairs` | 路径映射表 |
| `pathPairs[].id` | 路径对唯一标识 |
| `pathPairs[].paths` | key = 电脑 ID, value = 该电脑上的路径 |

### snapshot.json

每台电脑目录下的快照元数据。

```json
{
  "computer": "home-pc",
  "uploadedAt": "2026-05-18T15:30:00Z",
  "manifest": {
    "globalMemories": {
      "total": 22,
      "files": ["MEMORY.md", "check-before-delete.md"],
      "deleted": ["old-obsolete-memory.md"]
    },
    "projectMemories": {
      "total": 3,
      "files": ["MEMORY.md", "session-checkpoint.md"],
      "deleted": []
    },
    "skills": {
      "total": 17,
      "files": ["brainstorming.md", "systematic-debugging.md"],
      "deleted": []
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `computer` | 电脑 ID，必须与 computers.json 中的 key 一致 |
| `uploadedAt` | ISO-8601 上传时间 |
| `manifest.globalMemories.files` | 该电脑拥有的全局记忆文件列表 |
| `manifest.globalMemories.deleted` | 该电脑已删除（希望同步到其他电脑也删除）的记忆文件 |

### 记忆文件（.md）

遵循 Reasonix 原生的 `remember` 工具格式：

```markdown
# 记忆标题

## 规则
核心规则描述

## 补充细节（可选）

**Why:** 原因说明
**How to apply:** 执行方式
```

对于跨电脑同步的文件，内容中的路径应通过 `pathPairs` 翻译。
合并时如需标记来源，使用 `[from home-pc]` 格式。

### Skill 文件（.md）

遵循 Reasonix 原生 Skill frontmatter 格式：

```yaml
---
name: systematic-debugging
description: 系统化调试流程
version: 2.1
updatedAt: 2026-05-18
---
```

`version` 字段用于冲突解决（版本号高者优先）。

### config.json（已清理）

与 `~/.reasonix/config.json` 结构相同，但：
- `apiKey` 字段替换为 `"[FILTERED]"`
- 保留所有 MCP 配置、shellAllowed、editMode

## 同步算法

### 上传（Upload）

1. 收集本机所有全局记忆（`~/.reasonix/memory/global/`）
2. 收集本机所有项目记忆（`~/.reasonix/memory/<hash>/`）
3. 收集本机所有 Skills（workspace `.reasonix/skills/` + global `~/.reasonix/skills/`）
4. 读取 `~/.reasonix/config.json`，过滤 apiKey
5. 写入 `<computer-id>/` 目录：
   - 覆盖已有文件（git 历史保留旧版本）
   - 更新 `snapshot.json`（含删除清单）
   - 提交到 `main` 分支

### 下载与合并（Sync）

1. **备份**：备份本地 `~/.reasonix/` 到 `~/.reasonix/backup-{timestamp}/`
2. **拉取**：读取当前分支的最新内容
3. **读表**：读取 `computers.json`，获取 pathPairs
4. **逐类合并**：

   **全局记忆：**
   - 对每个记忆文件，检查本地 vs 所有远程电脑的版本
   - 本地独有 → 保留
   - 远程独有 → 添加（路径翻译后）
   - 两边都有 → 比较内容 hash：
     - 相同 → 跳过
     - 不同 → 取版本较新者；无法判断时内容合并，冲突部分加 `[from <computer-id>]` 标记
   - 在远程的 `deleted` 清单中 → 本地也删除

   **项目记忆：**
   - 用 `remember(scope: "project", name, content)` 写入
   - 不直接操作文件系统（避免 hash 路径问题）

   **Skills：**
   - 同名 skill 比较 `version` 字段，高版本覆盖低版本
   - 版本相同但内容不同 → 保留本地版本，远程版本加上 `[from <computer-id>]` 标记

   **Config：**
   - MCP：补充本地没有的服务器条目
   - shellAllowed：取并集去重
   - 不覆盖 editMode、apiKey、workspaceDir

5. **路径翻译**：
   - 遍历所有记忆/skill 内容
   - 对每个 `pathPair`，将远程电脑路径替换为本机路径
   - 按路径对 ID 逐个替换

6. **验证**：检查写入结果
7. **报告**：输出变更统计

### 冲突解决策略

| 场景 | 策略 |
|------|------|
| 同文件，仅一端修改 | 取修改后的版本 |
| 同文件，两端都改，版本号不同 | 取高版本 |
| 同文件，两端都改，版本号相同 | 内容合并，用 `[from <id>]` 标记冲突段落 |
| 电脑 A 删了某记忆，电脑 B 还保留 | 尊重删除（A 的 deleted 清单中列出） |
| 电脑 A 新增记忆，电脑 B 没有 | 直接添加 |

## 扩展性

### 新增记忆类型
未来可在 `<computer-id>/memories/` 下新增子目录（如 `knowledge-graph/`），
只需在 STANDARD.md 中补充描述，现有算法忽略不识别的目录。

### 跨平台
- `pathPairs` 天然支持跨平台路径替换（Windows `\` ↔ Unix `/`）
- `platform` 字段提示客户端可能存在的平台差异

### 多仓库
一台电脑可同时参与多个同步仓库（如工作项目一个仓、个人一个仓），
相互独立，互不干扰。
