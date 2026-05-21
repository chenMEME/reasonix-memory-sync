---
name: sync-memories
description: 「更新记忆」— 从GitHub同步远程记忆到本机，自动合并、路径翻译、处理电脑差异
---
# sync-memories — 多设备记忆同步

## 触发方式
用户说"更新记忆"时自动调用此 skill。

## 流程

### Step 1: 识别本机身份
确定当前是哪台电脑：
- 读取 `%USERPROFILE%\..\..\G\reasonix` 或 `G:\reasonix` 是否存在 → **home**（家用机）
- 读取 `D:\Reasonix` 或 `D:\reasonix-workspace` 是否存在 → **work**（公司机）
- 都不匹配 → 问用户"这是哪台电脑？"

定义路径映射表：
- home: `G:\reasonix` ↔ work: `D:\Reasonix`
- home: `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` ↔ work:（公司机Chrome路径）
- 使用 `recall_memory("clash-verge-location", "global")` 获取本机Clash路径

### Step 2: 获取本地记忆清单
读取本地所有记忆文件：
- 全局记忆目录：`~/.reasonix/memory/global/` — 所有 `.md` 文件
- 项目记忆目录：`~/.reasonix/memory/<hash>/` — 搜索 MEMORY.md
- Skills目录：`<workspace>/.reasonix/skills/` 和 `~/.reasonix/skills/`
- config：`~/.reasonix/config.json`

### Step 3: 从 GitHub 获取远程快照
使用 `github_get_file_contents` 读取仓库 `chenMEME/reasonix-memory-sync` 中的：
- 如果是 home 电脑 → 读取 `work/memories/` 下的远程记忆
- 如果是 work 电脑 → 读取 `home/memories/` 下的远程记忆
- 读取 `computers.json` 了解路径映射
- 读取另一边电脑的 `config.json`

### Step 4: 比对与合并
逐文件比对本地和远程的记忆：

**记忆文件（.md）合并规则：**
- 两边都有同一记忆 → 合并内容（取并集），保留各自的 `**Why:**` 和 `**How to apply:**`
- 只有一边有 → 直接添加
- MEMORY.md 索引 → 合并去重，条目按字母排序

**Skills 合并规则：**
- 同名 skill → 比较内容，取较新版本（用 `description` 和 `body` 判断）
- 仅一边有 → 直接添加

**Config 合并规则：**
- 不直接覆盖，而是保留各自配置
- 只在本地 config 中添加对方 MCP 服务器的配置（如果本地没有的话）

**路径翻译（重要）：**
- 远程记忆中的绝对路径（D:\ → G:\ 或反之）要根据本机替换
- 使用 Step 1 中定义的路径映射表
- 带路径/端口的记忆条目（如 clash-verge-location）打上电脑标签

### Step 5: 应用到本地
将合并后的结果写到本地：

**记忆文件：**
- `remember(type, scope, name, description, content)` — 逐个写入全局记忆
- 项目记忆用 scope:"project" 写入

**Skills：**
- `install_skill(name, description, body, scope, runAs)` — 逐个安装

**Config：**
- 读取本地 config.json
- 添加远程的 MCP 服务器（如果本地没有同名的）
- 添加远程的 shellAllowed 命令（去重）
- 用无 BOM UTF-8 写回

### Step 6: 验证与报告
- 验证写入结果：`recall_memory` 检查刚写的记忆
- 输出同步报告："新增 X 条记忆，更新 Y 条，合并 Z 条 skill，新增 N 个 MCP"
- 建议用户 `/new` 新会话让 Skill 索引更新

## 注意事项
- 写 config.json 必须用 `[System.IO.File]::WriteAllText(path, json, [Text.UTF8Encoding]::new($false))`
- 不要覆盖本机专属配置（路径、端口号等）
- 合并时对每条记忆标注来源电脑（`home` / `work`）
- 遇到冲突（两边修改同一文件且内容不同）→ 保留两边版本，在内容中加 `[from home]` / `[from work]` 标记