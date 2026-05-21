---
name: mcp-server-fix-lesson
description: MCP连接不上时排查流程：查包是否存在、环境变量、全局安装代替npx
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# MCP 服务器连接不上排查教训

## 规则
MCP 连不上时先排查，不要直接说"重装"。

### 已知的 MCP 服务器
- memory: `@modelcontextprotocol/server-memory` — npx 启动即可
- filesystem: `@modelcontextprotocol/server-filesystem <dir>` — npx 启动即可
- github: `@modelcontextprotocol/server-github` — 需 GITHUB_PERSONAL_ACCESS_TOKEN
- puppeteer: `@modelcontextprotocol/server-puppeteer` — **已弃用**
- ssh: `@modelcontextprotocol/server-ssh` ❌ **不存在** → 用 `@caikiji/mcp-ssh`

### 更好的替代品（本机已装）
- 浏览器自动化 → **`chrome-devtools-mcp`**（Google官方维护，45+工具）
- SSH远程管理 → **`@hypnosis/ssh-mcp-server`**（14个命令，profiles配置）

### 配置文件编码问题
改 `~/.reasonix/config.json` 必须用 UTF-8 无 BOM 编码。

### 环境变量（示例，路径因机而异）
- CHROME_PATH — Chrome 安装路径
- SSH_PROFILES_FILE — SSH profiles 配置路径
- GITHUB_PERSONAL_ACCESS_TOKEN — GitHub API token

**Why:** 前期浪费大量 token 在试错
**How to apply:** 查包存在→查环境依赖→全局安装→用add_mcp_server添加→重启