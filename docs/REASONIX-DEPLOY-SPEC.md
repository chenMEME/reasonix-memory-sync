# Reasonix Deploy — v1.0 Windows MVP

> 版本: v1.0-draft · 仅限 Windows  
> 目标: 让 Reasonix 用户在 Windows 电脑之间，能一键备份 + 部署记忆、MCP 配置、Skills  
> 非目标（此版本不做）: macOS / Linux 支持、增量合并、冲突智能合并、多用户

---

## 零、认证模型（重要）

**sync.js 不处理任何认证。** 它只调用 `git` 命令，所有认证由 Git 自身处理。

用户需要确保在自己的电脑上已经能 `git push/pull` 到目标仓库：
- 用 SSH Key（推荐）：`git clone git@github.com:xxx/repo.git`
- 用 GitHub CLI：`gh auth login`
- 用 HTTPS + credential helper：配好就不需要每次输密码

sync.js 不做认证配置。这是 Git 的事。

```bash
# 用户自己先验证：
git clone https://github.com/xxx/reasonix-backup.git  # 能跑通
# 然后交给 sync.js：
node sync.js backup https://github.com/xxx/reasonix-backup.git
```

---

## 一、命令设计（v1.0 仅三个命令）

```
sync.js backup <repo-url>     收集本机数据 → git push
sync.js deploy <repo-url>     git pull → 落地 → 验证
sync.js verify                校验本地数据完整性
```

### backup 流程

```
1. 读取 ~/.reasonix/config.json
   ├─ workspaceDir
   ├─ mcp[]（服务器列表）
   └─ apiKey → 过滤为 [FILTERED]
2. 收集全局记忆  ~/.reasonix/memory/global/*.md
3. 收集项目记忆  ~/.reasonix/memory/<hash>/*.md（如果存在）
4. 收集 Skills   <workspaceDir>/.reasonix/skills/*.md（如果存在）
5. 写入临时目录 backup/<电脑ID>/<时间戳>/
   ├── manifest.json      ← 文件清单 + sha256
   ├── config.json        ← MCP 配置（apiKey 已过滤）
   ├── memories/
   │   ├── global/*.md
   │   └── project/*.md
   └── skills/*.md
6. git add + commit + push
7. **不覆盖历史** — 每次在 backup/<电脑ID>/ 下新建时间戳目录
```

### deploy 流程

```
1. git clone <repo-url>（首次）或 git pull（已有）
2. 读取 backup/ 目录下所有电脑的备份
3. **取最新的 backup**（按时间戳排序）
4. 进入递送:
   ┌──────────────────────────────┐
   │  v1.0 递送策略：全量覆盖      │
   ├─────────────┬────────────────┤
   │ 全局记忆    │ 覆盖本地        │
   │ 项目记忆    │ 覆盖本地        │
   │ Skills      │ 覆盖本地        │
   │ MCP 配置    │ 全量替换        │
   │ config.json │ 全量替换        │
   │ apiKey      │ 保留本地        │
   │ workspaceDir│ 保留本地        │
   └─────────────┴────────────────┘
   v1.0 不做增量合并、不做冲突标记。
   新机器上本来就是空的，全量覆盖就是正确行为。
5. 文件写入:
   ├─ 全局记忆 → ~/.reasonix/memory/global/
   ├─ 项目记忆 → ~/.reasonix/memory/<hash>/
   ├─ Skills   → <workspaceDir>/.reasonix/skills/
   └─ config.json → ~/.reasonix/config.json（合并 apiKey 和 workspaceDir）
6. 执行 verify
7. 输出报告
```

### verify 流程

```
检查项:
1. ✅ manifest 完整性 — 所有 manifest 中列出的文件都存在
2. ✅ 文件哈希 — 每个文件 sha256 与 manifest 一致
3. ✅ 格式检查 — 所有 .md 文件可读
4. ✅ MCP 路径 — config.json 中引用的程序路径存在（如 chrome.exe）
5. ✅ workspace 路径 — config.json 中的 workspaceDir 目录存在

输出:
  ✅ = 通过
  ❌ = 失败（给出具体文件和修复建议）

退出码:
  0 = 全部通过
  1 = 有失败
```

---

## 二、仓库结构

```
backup/
└── <computerId>/              ← 由 --id 指定
    ├── 2026-05-19T06-00-00Z/  ← 每次 backup 新建
    │   ├── manifest.json
    │   ├── config.json
    │   ├── memories/
    │   │   ├── global/
    │   │   └── project/
    │   └── skills/
    ├── 2026-05-18T15-00-00Z/  ← 历史版本
    └── latest -> 2026-05-18T15-00-00Z/  ← 符号链接
```

- **不覆盖历史**：每次 backup 建新目录，可回滚
- **`latest`**：指向最新一次，deploy 默认取此
- **deploy 可选指定时间戳**：`node sync.js deploy <repo> --at 2026-05-18T15-00-00Z`

---

## 三、路径适配

旧电脑和新电脑的工作目录可能不同：
- 家用机: `G:\reasonix`
- 公司机: `D:\Reasonix`

deploy 流程中需处理：

1. deploy 写入 Skills 时，使用本机 config.json 中的 workspaceDir，而不是 backup 源中的路径
2. 记忆文件内容中如果包含旧路径，deploy 不自动替换（v1.0 不做内容级路径翻译）
3. 提示用户：如果记忆内容中提到了旧路径（如 `G:\GTAV\clashverge`），需要手动修改

---

## 四、需要用户确认的事项

deploy 过程中遇到以下情况需要暂停并提示用户：

| 场景 | 提示 |
|------|------|
| 本地已有记忆 | "本机已有 N 条记忆，将全部替换为远程版本，是否继续？" |
| workspaceDir 不同 | "备份中的工作目录是 G:\reasonix，本机是 D:\Reasonix，Skills 将写入本机目录" |
| MCP 程序路径不存在 | "config.json 中引用了 xxx.exe，但本机未找到该程序，是否继续？" |
| 备份来自陌生电脑 | "将从 <电脑ID> 的最新备份部署，确认？" |

---

## 五、安全性

| 风险 | 方案 |
|------|------|
| apiKey 泄露 | backup 时自动过滤为 `[FILTERED]` |
| deploy 覆盖现有配置 | deploy 前自动备份当前 ~/.reasonix 到 ~/.reasonix/pre-deploy-<时间戳>/ |
| git commit 包含敏感信息 | manifest.json 不记录环境变量、不记录路径中的用户名 |
| deploy 中断 | 在临时目录操作，全部完成后再写入目标位置 |

---

## 六、Windows 路径注意点

- 使用 `path.join` 处理路径，不要硬编码 `\`
- git 在 Windows 上可能需配置 `core.autocrlf`，sync.js 初始化时检查
- 运行 `git` 命令前检查 `where git` 是否可用

---

## 七、验收标准

一个 Release 需通过以下测试：

1. **backup 测试** — 旧电脑运行 backup，Git 仓库里有带时间戳的备份，manifest.json 哈希正确
2. **deploy 到空机** — 全新 Reasonix 的新电脑，deploy 后所有记忆、MCP、Skills 到位
3. **deploy 到已有机器** — deploy 前自动备份旧数据，deploy 后全部替换为远端内容
4. **verify 测试** — 故意改坏一个 .md 文件，verify 能检测出哈希不匹配
5. **verify 通过** — deploy 后立即 verify，全部 ✅
6. **多次 backup** — 第二次 backup 不会覆盖第一次，`latest` 指向最新
7. **MCP 路径检查** — config.json 引用了不存在的 exe，verify 能报出
8. **回滚** — deploy 后的 pre-deploy 备份可用

---

## 八、脱敏引擎（v1.0 补充）

> 在 `collect → output` 流水线中插入 **`sanitize` 阶段**，
> 实现「公开共享」场景下的自动脱敏。

### 8.1 背景

v1.0 基础版只过滤了 `config.json` 中的 `apiKey`，其余内容原样传输。
这在「自有多设备同步」场景下够用，但进入「公开共享记忆包」场景时不够。

### 8.2 架构

```
collect → [sanitize] → output
```

sanitize 是可选阶段，通过 `--mode` 控制：

| 模式 | 行为 |
|------|------|
| `--mode private` | 跳过 sanitize，原文输出（默认，自用同步行为） |
| `--mode public`  | 执行全量脱敏 |
| `--mode inspect` | 只预览会改什么，不改数据 |

### 8.3 四级脱敏规则

#### 级别 1 — 硬性过滤

**匹配到直接终止 collect 或强制替换。**

| 模式 | 替换为 | 示例 |
|------|--------|------|
| `apiKey` / `API_KEY` 等键值 | `[FILTERED]` | `"apiKey": "sk-xxx"` → `"apiKey": "[FILTERED]"` |
| `password` / `secret` / `token` + 值 | `[FILTERED]` | `password: xxxxx` → `password: [FILTERED]` |
| `ssh-` / `ghp_` / `sk-` 等前缀 + 20+ 字符 | `[FILTERED]` | SSH 私钥片段、GitHub token、API key |
| Bearer / Authorization 头值 | `[FILTERED]` | `Authorization: Bearer xxx` |

#### 级别 2 — 模式匹配

| 模式 | 正则 | 替换为 |
|------|------|--------|
| IPv4 地址 | `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` | `{{IP}}` |
| 内网 IP | 10.x.x.x / 192.168.x.x / 172.16-31.x.x | `{{LAN_IP}}` |
| 邮箱 | `\b[\w.+-]+@[\w-]+\.[\w.]+\b` | `{{EMAIL}}` |
| Windows 用户名路径 | `C:\\Users\\[^\\]+` | `C:\\Users\\{{USER}}` |
| 盘符绝对路径 | `[A-Z]:\\(?:[^\\]+\\)*[^\\]*` | `{{PATH}}` |

#### 级别 3 — PathPairs 精确替换

用户 / AI 在 `sync-config.json` 中预定义的路径 ↔ 占位符映射：

```json
{
  "computerId": "desktop-o56g1ts",
  "pathPairs": {
    "D:\\\\clash\\\\clash-verge.exe": "{{CLASH_EXE}}",
    "D:\\\\Reasonix": "{{WORKSPACE}}",
    "64\\.83\\.39\\.99": "{{VPS_IP}}",
    "cliapi\\.mudechen\\.org": "{{API_DOMAIN}}"
  }
}
```

CLI 管理命令：
```
node sync.js pathpair add    "D:\clash" "{{CLASH_DIR}}"
node sync.js pathpair remove "D:\clash"
node sync.js pathpair list
```

#### 级别 4 — 整文件排除（machineSpecific）

某些记忆文件天生就是本机专属，没有公开价值：

```json
{
  "machineSpecific": [
    "clash-verge-location.md",
    "vps-info.md",
    "install-default-d-drive.md",
    "launch-programs-like-human.md"
  ]
}
```

在 `public` 模式下直接排除。

### 8.4 输出格式

```json
{
  "computer": "desktop-o56g1ts",
  "timestamp": "2026-06-03T14:00:00Z",
  "_sanitized": true,
  "_sanitizeMode": "public",
  "_sanitizeLog": [
    {
      "file": "vps-info.md",
      "replacements": [
        { "pattern": "IPv4", "count": 3 },
        { "pattern": "pathPair: VPS_IP", "count": 1 }
      ]
    }
  ],
  "_machineSpecificExcluded": ["clash-verge-location.md"],
  "memories": { "global": [] },
  "skills": []
}
```

接收方 `write` 时检测到 `_sanitized: true` 后：
- 输出脱敏摘要
- 尝试用本机 `pathPairs` 反向还原（占位符 → 本机值）
- 未还原的占位符保持原样，写入 deploy 报告

### 8.5 反向还原（Fill）

```
收到的记忆        本机 pathPairs             写入本地
─────────────────────────────────────────────────────────
{{VPS_IP}}   →  {{VPS_IP}} ← 本机 VPS IP   → {{VPS_IP}}
{{CLASH_DIR}} →  D:\clash                     → D:\clash
{{IP}}       →  无映射                       → 保持 {{IP}}（提示用户）
```

### 8.6 命令变更

新增子命令：
```
node sync.js sanitize < input.json > output.json    独立脱敏
node sync.js pathpair add|remove|list                管理映射
node sync.js exclude add|remove|list                 管理排除列表
node sync.js inspect < input.json                    预览脱敏
```

修改子命令：
```
node sync.js collect --mode public    收集 + 脱敏
node sync.js collect --mode inspect   收集 + 预览
node sync.js collect --mode private   收集 + 原文（默认）
```

### 8.7 安全边界

| 风险 | 缓解 |
|------|------|
| 正则遗漏敏感信息 | inspect 模式让用户预览 |
| pathPairs 过于具体 | machineSpecific 排除无法脱敏的文件 |
| 反向还原不完全 | deploy 报告列出未还原占位符 |
| 用户忘了开 `--mode public` | 默认 `private`（安全默认） |

### 8.8 与 v1.0 现有功能的关系

- sanitize 是 collect 的可选下游阶段，**不修改本地 .md 文件**
- `backup` 命令仍然备份原文（本地备份不需要脱敏）
- `diff` 在 public 模式下比较脱敏后的版本
