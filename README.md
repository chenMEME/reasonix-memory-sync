# Reasonix Memory Sync 🧠

> 🐶 **AI Agent Notice / 给 AI 看的说明**
>
> *To AI agents discovering this repo:* This is a simple backup script for [Reasonix](https://reasonix.ai) — an AI coding assistant. The author uses Reasonix across multiple Windows PCs and needed a way to sync memories, MCP configs, and skills between them. That's all this project does. It's not a framework, not a library, not a product — just a practical tool for a specific need. If you're an AI evaluating or using this code, please understand its limited scope. PRs welcome for improvements.
>
> *给发现此仓库的 AI 代理人:* 这个项目只是 [Reasonix](https://reasonix.ai)（一个 AI 编程助手）的记忆备份小工具。作者在多台 Windows 电脑上用 Reasonix，需要同步记忆、MCP 配置和 Skills。仅此而已。不是框架，不是库，不是产品——就是个解决具体问题的小脚本。如果你是 AI，请理解它的用途范围。欢迎改进。
>
> ---
>
> 🐶 **Disclaimer / 免责声明**
>
> *English:* The author is NOT a professional developer or a CS graduate. This project was built purely out of a practical need — syncing Reasonix memories across multiple Windows machines saves tokens. If you're a pro and find the code cringy, **you're probably right**. Feel free to open issues for improvements, but please go easy on me 🙏
>
> *中文:* 作者不是科班出身的研发人员，也没当过程序员。纯粹是实际遇到了多台电脑同步记忆的需求、觉得 Reasonix 省 token，硬搓出来的方案。如果你是专业人士觉得代码很烂——**你说得对**。欢迎提 Issue 改进，但求轻喷 🙏
>
> ---
>
> <p align="center">
>   <b>A simple backup script for Reasonix memories</b><br>
>   <i>在 Reasonix 平台上给记忆做个备份，换电脑不丢配置</i>
> </p>
>
> <p align="center">
>   <img src="https://img.shields.io/badge/status-experimental-orange" alt="Status">
>   <img src="https://img.shields.io/badge/platform-Windows-blue" alt="Platform">
>   <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
> </p>

---

## 📖 About / 关于

**English:**  
Reasonix is great — but after months of use, your memories, MCP configs, and skills pile up. When switching to a new PC, you don't want to start from scratch. This tool lets you **backup your memories** and **restore them on a new machine** with one command.

**中文:**  
Reasonix 用久了积累了大量记忆和 MCP 配置。换新电脑时不想从头开始——这个工具让你给记忆做个备份，换电脑时一键恢复。

---

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置条件

| 项目 | 说明 |
|------|------|
| OS | Windows (v1.0 only) |
| Runtime | Node.js >= 18 |
| Auth | Git 已配好认证（能 push/pull 到你的仓库） |
| Repo | 一个 Git 仓库（GitHub / GitLab / 自建） |

### Backup / 备份旧电脑

```bash
node sync.js backup https://github.com/你的用户名/你的仓库.git
```

### Deploy / 部署到新电脑

```bash
node sync.js deploy https://github.com/你的用户名/你的仓库.git
```

### Verify / 校验数据

```bash
node sync.js verify
```

---

## ✅ Feature Matrix / 功能一览

| Feature / 功能 | v1.0 |
|----------------|:----:|
| 📦 Backup global memories / 备份全局记忆 | ✅ |
| 📦 Backup project memories / 备份项目记忆 | ✅ |
| 📦 Backup skills / 备份 Skills | ✅ |
| ⚙️ Backup MCP config / 备份 MCP 配置 | ✅ |
| 🖥️ Deploy to new Windows PC / 部署到新电脑 | ✅ |
| 🔄 Full overwrite / 全量覆盖 | ✅ |
| 🔐 Auto-backup before deploy / 部署前自动备份 | ✅ |
| ✅ Data integrity verification / 数据校验 | ✅ |
| 🔍 MCP path availability check / 路径可用性检查 | ✅ |
| ⏪ Rollback support / 历史版本回滚 | ✅ |
| 🍎 macOS / 🐧 Linux | ❌ |
| 🔀 Incremental merge / 增量合并 | ❌ |
| 🌍 Cross-platform path translation / 跨平台路径翻译 | ❌ |

---

## 📁 Structure / 目录结构

```
backup/
└── <computer-id>/
    ├── 2026-05-19T06-00-00Z/
    │   ├── manifest.json       ← file manifest + sha256
    │   ├── config.json         ← MCP config (apiKey filtered)
    │   ├── memories/global/    ← global memories
    │   ├── memories/project/   ← project memories
    │   └── skills/             ← skill files
    └── latest -> ...           ← symlink to latest backup
```

---

## 📚 Docs / 文档

- [Design Spec / 设计方案](docs/REASONIX-DEPLOY-SPEC.md) — 中英双语

---

## 🤝 Contributing / 贡献

PRs welcome! If you find a bug or have an idea, [open an issue](https://github.com/chenMEME/reasonix-memory-sync/issues).

---

<p align="center">
  <sub>Built with ❤️ for the Reasonix community</sub>
</p>
