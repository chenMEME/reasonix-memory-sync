---
name: clash-rules-edit-lesson
description: 改Clash规则需通过增强模板(prepend)而非直接改主配置文件，否则不生效
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# Clash 规则编辑教训

## 规则
Clash Verge 远程订阅配置使用**独立的增强模板文件**管理规则，不要直接修改主配置文件。

## 正确的改法
- 规则增强文件: `profiles/rnlsNO5XsvKb.yaml`，在 `prepend` 列表里加规则
- 代理增强文件: `profiles/pITw5w6hNbo8.yaml`
- 策略组增强文件: `profiles/gsxWnLzxPwCo.yaml`
- 合并增强文件: `profiles/m5cXOMM7Am0Z.yaml`

## 排查流程
1. 先确认问题在哪：本机curl直连 vs 走代理(`--proxy http://127.0.0.1:7897`)
2. 走代理不通 → Clash规则未生效，检查增强模板
3. 改完后需重载配置（重启Clash Verge或点重新加载）

## 为什么浪费token
- 直接把规则加到了远程订阅的主配置文件(`RpaKE2o9YAdO.yaml`)中
- 但该配置使用独立的 rules 增强文件(`rnlsNO5XsvKb.yaml`)，prepend才是正确位置
- 还误杀了Clash Verge进程导致前端打不开，多次排查

**Why:** 走弯路浪费大量token
**How to apply:** 排查Clash问题时，先通过`--proxy`测试确认规则是否生效，改规则必须改增强模板的prepend
