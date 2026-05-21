---
name: upload-memories
description: 「上传记忆」— 将本机所有记忆、Skills、配置打包上传到GitHub同步仓库
---
# upload-memories — 上传记忆到 GitHub

## 触发方式
用户说"上传记忆"时自动调用此 skill。

## 流程

### Step 1: 识别本机身份
同 sync-memories Step 1。

### Step 2: 收集本地数据
读取并打包以下内容：

**全局记忆：**
- 目录：`~/.reasonix/memory/global/`
- 收集：MEMORY.md + 所有 `.md` 文件的内容
- 用 `read_file` 逐个读取

**Skills：**
- 项目级：`<workspace>/.reasonix/skills/` — 所有 `.md` 文件
- 全局级：`~/.reasonix/skills/` — 所有 `.md` 文件
- 读取文件头部的名称和描述

**Config：**
- `~/.reasonix/config.json` — 完整读取
- 注意标记机器特有的路径和配置

**项目记忆：**
- 搜索 `~/.reasonix/memory/` 下的项目记忆目录
- 读取 MEMORY.md 索引

### Step 3: 上传到 GitHub
使用 `github_create_or_update_file` 上传到仓库 `chenMEME/reasonix-memory-sync`：

```
<computer-name>/
├── snapshot.json              # 快照元数据（时间戳、电脑名）
├── config.json                # 本机配置
├── memories/
│   ├── MEMORY.md              # 全局记忆索引
│   ├── mcp-server-fix-lesson.md  (逐个文件)
│   └── ...                    # 所有全局记忆文件
└── skills/
    ├── sync-memories.md
    └── ...
```

**snapshot.json 格式：**
```json
{
  "computer": "home",
  "uploadedAt": "2026-05-18T15:30:00Z",
  "memoryCount": 25,
  "skillCount": 16,
  "note": ""
}
```

### Step 4: 更新 computers.json
读取 `computers.json`，如果本机不在列表中则添加，更新路径映射：
```json
{
  "computers": {
    "home": {
      "workspace": "G:\\reasonix",
      "chrome": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "hostname": "HOME-PC"
    }
  },
  "pathMappings": {
    "home->work": {
      "G:\\reasonix": "D:\\Reasonix"
    }
  }
}
```

### Step 5: 验证
- 读取刚上传的文件确认内容正确
- 输出报告："上传完成：X 条记忆，Y 个 skill，配置已同步"

## 注意事项
- 不上传敏感信息（apiKey 在 config 中会被过滤掉再上传）
- 不上传本机特有的项目工作区文件
- 上传前替换 config 中的 apiKey 字段为 `"[FILTERED]"`