# 记忆同步首次同步 — 问题总结

> 日期: 2026-05-18
> 仓库: chenMEME/reasonix-memory-sync
> 同步方向: GitHub → 本机（首次）

---

## Bug 1: sync.js write 不处理 config.json
**严重度** 🔴 高 | **状态** ✅ 已修复

**现象:** write 只写入了 memories 和 skills，config.json 不同步
**修复:** cmdWrite() 增加 config.json 合并逻辑

## Bug 2: VPS 密码明文暴露
**严重度** 🔴 高 | **状态** ✅ 已修复

**现象:** vps-info.md 的 description 含密码痕迹
**修复:** 改为 `密码已更新（非明文存储）`

## Bug 3: 无对比直接覆盖
**严重度** 🟡 中 | **状态** ✅ 已修复

**现象:** 拉取后直接写入，无预览
**修复:** sync.js 新增 diff 命令

## Bug 4: 同步后路径不匹配
**严重度** 🟡 中 | **状态** ✅ 已修复

**现象:** 远程 G:\ 路径与本地 D:\ 不匹配
**修复:** 手动替换 + 用 {{WORKSPACE}} 占位符脱敏

## Bug 5: Chrome 安装路径误判
**严重度** 🟡 中 | **状态** ✅ 已修复

**现象:** 只搜了 (x86) 忽略 Program Files
**修复:** 全面搜索注册表+硬盘多个位置

## Bug 6: MEMORY.md 索引不同步
**严重度** 🟢 低 | **状态** ❓ 部分修复

## Bug 7: sync.js 缺少回滚
**严重度** 🟢 低 | **状态** ✅ 已修复 — 新增 restore 命令

## Bug 8: 首次同步没有迁移检查
**严重度** 🟢 低 | **状态** 待修复