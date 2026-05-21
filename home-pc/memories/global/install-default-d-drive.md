---
name: install-default-d-drive
description: 软件默认装D盘，C盘仅60+GB。winget装C盘则手动搬
type: feedback
scope: global
created: 2026-05-18
priority: medium
---
# 软件安装默认 D 盘

C 盘仅 60+ GB 空间，不够充裕。优先装 D 盘。

## 规则
- winget / choco / npm install — 先检查是否有 `--location` 指定 D: 路径
- 安装程序 exe/msi — 手动选择 D:\tools\、D:\Programs\ 等目录
- 如果 winget 不支持自定义路径（装到了 C:\Program Files），手动搬移到 D:\ 同路径后加环境变量
- 大文件下载 → 先存 D:\tools\ 或 D:\downloads\
- Python pip — 默认在用户目录，空间占用小可忽略
