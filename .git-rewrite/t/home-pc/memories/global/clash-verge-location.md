---
name: clash-verge-location
description: Clash Verge 安装路径见{{CLASH_DIR}}，API端口9097，配置端口7897
type: reference
scope: global
created: 2026-05-18
priority: low
---
# Clash Verge Rev（{{CLASH_DIR}}）

> ⚠ 这是**家用电脑**的 Clash 配置。公司电脑在公司包里，不要混用。

## 安装信息
- **可执行文件:** `{{CLASH_DIR}}\clash-verge.exe`
- **桌面快捷方式:** 无（可从可执行文件直接启动）
- **版本:** v2.4.7（内核 verge-mihomo）
- **配置目录:** `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\`
- **混合端口:** 7897
- **API 端口:** 9097（无认证）

## 规则情况
Clash 已有国内直连规则，**不需要额外加 DeepSeek 规则**：
- `DomainSuffix cn → DIRECT`
- `GeoIP cn → DIRECT`
- DeepSeek 服务器在国内，GeoIP cn 规则已覆盖
- PAC 模版已配置（verge.yaml 中），DeepSeek→DIRECT 冗余保护
- Script.js 过滤 HY2 节点（skip-cert-verify: true）

## 关键注意点
- **不要随便改 Merge.yaml 的 rules:** 段
- **改规则必须改增强模板**的 `prepend`
- API 不再监听 9097（v2.4.7改用 Windows 命名管道 `\\.\pipe\verge-mihomo`）

## VPN 断连 → Reasonix 掉线根因
- 系统代理开启时所有流量走 Clash 7897 端口
- Clash 节点断开 → 7897 端口不可用 → 所有连接都挂
- 解决办法：PAC 模式已启用，DeepSeek 直连不受影响

## 操作方法
- **启动:** `{{CLASH_DIR}}\clash-verge.exe`
- **重启:** taskkill → 重新运行 exe