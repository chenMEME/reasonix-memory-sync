---
name: web-search-skill-works
description: web-search skill通过Clash代理(7897)成功搜索，替代内置web_search
type: feedback
scope: global
created: 2026-05-18
priority: medium
---
# web-search skill 使用经验

## 状态：可用 ✅
`web-search` skill 通过 Clash 代理（127.0.0.1:7897）成功进行网络搜索。

## 使用方式
```
run_skill(name:"web-search", arguments:"搜索关键词")
```

## 原理
- curl 走 Clash 代理 127.0.0.1:7897 访问外网搜索引擎
- 支持中英文搜索
- 搜索结果返回结构化片段

## 为什么不直接用内置 web_search
- 内置 web_search 可能不走代理（原因不明）
- skill 版能可靠翻墙搜索
- 已替代计划中：看到 web_search 调用提示时，改用 run_skill("web-search", ...) 重试
