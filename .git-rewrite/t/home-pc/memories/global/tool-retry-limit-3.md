---
name: tool-retry-limit-3
description: 同一工具重试>3次立即停止，避免浪费token
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# 工具重试限制

## 规则
同一个工具调用连续失败 >3 次后，立即停止重试，不要再尝试其他变通方式。

## 原因
- 每次重试都在消耗 token
- 连续失败说明当前方案有根本性问题（网络限制、被封禁等）
- 换搜索后端、换参数、换UA等都大概率同样失败

## 例外
不适用于 edit_file SEARCH/REPLACE 匹配失败——这种可以准确修正后再试。
