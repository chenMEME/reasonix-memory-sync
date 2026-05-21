---
name: default-browser-chrome
description: 必须用Chrome不要用夸克，Chrome设为默认浏览器
type: feedback
scope: global
created: 2026-05-18
priority: high
---
## 默认浏览器硬性规则

1. **用户默认浏览器是 Chrome，不是夸克**
2. 任何需要打开网页/URL 的任务，必须调用 Chrome（具体路径因机而异），不能用 `start` 命令（`start` 会打开系统默认浏览器，可能是夸克）
3. 调用方式：用变量引用的 Chrome 路径启动，具体路径因机而异
4. 夸克浏览器占后台资源，不要让它成为默认浏览器

**Why:** 夸克浏览器会劫持协议关联，占用后台资源
**How to apply:** 任何时候要打开浏览器/网页，直接运行 chrome.exe 路径，不要用 start 命令