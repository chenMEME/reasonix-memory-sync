---
name: web-fetch-proxy-lesson
description: web_fetch不走Clash代理，翻墙时得用curl --proxy代替
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# web_fetch 代理问题教训

## 规则
`web_fetch` 工具**不走 Clash 代理**（127.0.0.1:7897），翻墙访问外网资源时必然超时。

## 正确的做法
用 `run_command` + `curl --proxy` 代替：
```bash
curl -s "URL" --proxy http://127.0.0.1:7897 -H "User-Agent: Mozilla/5.0" --connect-timeout 8 -o out.html
```

## 适用场景
- 访问 GitHub raw 内容（raw.githubusercontent.com）
- 访问 npm / 外文文档
- 任何需要翻墙才能访问的 URL

## 什么时候用 web_fetch
- 国内直连可达的网站（百度、知乎、国内 CDN）
- HTTPS 但不是墙外资源

## 为什么浪费 token
- web_fetch 超时等了好几轮才知道不行
- 每次超时 15 秒，白等

**Why:** web_fetch 不支持代理配置，翻墙环境必超时
**How to apply:** 外网资源一律用 `curl --proxy http://127.0.0.1:7897`，国内资源用 web_fetch
