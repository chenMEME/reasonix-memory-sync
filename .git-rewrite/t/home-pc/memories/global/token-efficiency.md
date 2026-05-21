---
name: token-efficiency
description: 最短token完成任务：先看提示词后动工具、批量操作、不轮询、不重复踩坑
type: feedback
scope: global
created: 2026-05-18
priority: high
---
# Token 效率铁律

## 核心原则
**先看提示词，后动工具。** 系统提示里已经有的信息（记忆列表、用户指令、工具结果）是权威来源，不要再去文件系统或网络翻找验证。

## 铁律清单

1. **先看提示词再调工具** — 系统提示已有记忆列表时，先看列表再决定要不要 read_file/search
2. **先读后写** — 不盲猜文件内容，read_file 看懂再改，避免反复修
3. **批量操作** — 能用 multi_edit 一次改 N 处，绝不拆成 N 个 edit_file
4. **不重复踩坑** — 之前 run_background 不支持 &&，就不要再试 &&；之前 .value 报错，就一次性修完
5. **命令合并** — 能用 `;` 或单条命令完成的事，不拆成多次 run_command
6. **不轮询** — 用 wait_for_job 一次性等待，不用 job_output 循环
7. **不探索已知信息** — 用户告诉过的事实、之前报过的错，不再重新查证
8. **不重写已有记忆** — 系统提示已有记忆索引时，不 read_file 重读/重写一遍
9. **工具重试≤3次** — 同一工具连续失败>3次立即停，不换方式再试（edit_file SEARCH/REPLACE 匹配失败除外，可以修正后重试）

**Why:** 用户反馈 token 消耗太多，要求优化
**How to apply:** 每次写代码/调命令前，先想"最少调用次数"是多少
