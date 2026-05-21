---
name: launch-programs-like-human
description: 先找桌面快捷方式打开程序，找不到再找原始路径
type: feedback
scope: global
created: 2026-05-18
priority: medium
---
# 启动程序 — 模拟人类操作

## 规则
启动任何程序时，优先检查桌面快捷方式。

## 操作顺序
1. **先找桌面快捷方式**：`dir "%USERPROFILE%\Desktop\*关键词*" /b`
2. 用 `start "" "路径"` 或直接运行 `.lnk` 文件启动
3. 如果桌面上没有，再找安装目录或原始程序路径
4. 把找到的路径记入记忆，下次可以直接用

## 家用桌面常用快捷方式（示例，因机而异）
- 星愿浏览器 → `星愿浏览器.lnk`（Chromium内核，替代Chrome）
- Reasonix → `Reasonix.lnk`
- WPS Office → `WPS Office.lnk`
- VS Code → `Visual Studio Code.lnk`
- 百度网盘 → `百度网盘.lnk`
- 雷电模拟器 → `雷电模拟器9.lnk`

## 为什么
- 桌面快捷方式就是给人双击用的
- 有些程序原始路径不标准，但桌面一定有
- 用户习惯双击桌面图标打开程序