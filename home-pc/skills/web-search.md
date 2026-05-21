---
name: web-search
description: 快速网络搜索（curl + Clash代理7897），3秒出结果
runAs: inline
allowed-tools:
  - run_command
---

# Web Search (快速版)

## 核心原则
- **只用 curl**，不用 Python
- **只抓必要信息**，不下载整页
- **最多 3 次调用**，超时 8 秒不等的
- 结果直接提取摘要，不需要的就跳过

## 搜索引擎选择
- 中文内容 → 百度（直连，不用代理）
- 英文/国际内容 → Bing（走 Clash 7897 代理）

## 命令模板

### 百度搜索（中文，直连）
```
curl -s "https://www.baidu.com/s?wd=URL_ENCODED_QUERY" -H "User-Agent: Mozilla/5.0" --connect-timeout 5 -o out.html
```
然后从 out.html 中找关键文字。百度搜索结果标题在 `<h3>` 标签里，摘要在 `<span class="content-right_">` 里。

### Bing 搜索（英文，走代理）
```
curl -s "https://www.bing.com/search?q=URL_ENCODED_QUERY&count=10" --proxy http://127.0.0.1:7897 -H "User-Agent: Mozilla/5.0" --connect-timeout 5 -o out.html
```

### 直接抓取页面内容
```
curl -s "URL" --proxy http://127.0.0.1:7897 -H "User-Agent: Mozilla/5.0" --connect-timeout 5 -o out.html
```
然后用 `findstr` 快速提取文字摘要。

## 限制
- 最多 3 次 curl 调用
- 每次超时 8 秒
- 不解析 JavaScript 渲染页面
- 搜不到就直说，不要换方法重试
