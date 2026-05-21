---
name: pac-proxy-solution
description: Clash Verge内置PAC模式，DeepSeek直连+省流量，重启不丢失
type: reference
scope: global
created: 2026-05-18
priority: medium
---
# PAC 代理方案（Clash Verge 内置）

## 状态：已生效 ✅
用 Clash Verge 内置 PAC 模式替代硬编码系统代理。

## verge.yaml 配置
路径: `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\verge.yaml`

## 效果
- 重启后自动加载，DeepSeek 直连规则保留
- VPN断开时 DeepSeek 仍可用，Reasonix 不掉线
- 省流量：国内网站不经 Clash，不消耗 VPN 配额

## 历史教训
- 不要改 Merge.yaml 的 rules: 段
- 不要手动改注册表 ProxyServer（Clash 重启会覆盖）
- 正确做法：Clash Verge 的 proxy_auto_config 开启 PAC 模式