---
name: mcp-servers-configured
description: 已配4个MCP: memory/filesystem/github(90天token)/chrome-devtools，filesystem路径见config
type: reference
scope: global
created: 2026-05-18
---
# 已配置的 MCP 服务器

## 当前 MCP 列表（~/.reasonix/config.json）
1. **memory** — `npx -y @modelcontextprotocol/server-memory`
2. **filesystem** — `npx -y @modelcontextprotocol/server-filesystem {{WORKSPACE}}`
3. **github** — `npx -y @modelcontextprotocol/server-github`（需 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量，90天有效）
4. **chrome-devtools** — `npx -y chrome-devtools-mcp@latest`（Google官方，45+工具，自动找Chrome）
5. **ssh** — 暂未配置（需用户自行设置 SSH 环境变量，或用 vps-ssh skill 通过 paramiko 连接）

## 环境变量
- `GITHUB_PERSONAL_ACCESS_TOKEN` — GitHub API token（用户级）
- `CHROME_PATH` — Chrome 安装路径（用户级，因机而异）
- `SSH_SERVICES` — 用户自行配置（VPS 连接凭据，勿硬编码）

## 注意
- `@modelcontextprotocol/server-ssh` 在 npm 上不存在，不要用
- 修改 config.json 后需要重启 Reasonix 生效
- 配置文件必须用 UTF-8 无 BOM 编码