---
name: session-length-guideline
description: 建议每 80-100 条消息开新会话，用 /new 继承记忆
type: feedback
scope: global
created: 2026-05-17
priority: medium
---
## 会话长度建议

1. **超过 80-100 条消息建议开新会话**（输入 /new）
2. 超出后 AI 性能下降：token 消耗大、响应慢、早期信息可能丢失
3. 新会话会**自动加载所有高优先级记忆**，不需要重新教
4. 切换任务主题时也应该开新会话
5. 同一主题连续做可以超过 100 条，但超过 150 条无论如何都建议开新的

**Why:** 长上下文降低 AI 效率，增加 token 消耗
**How to apply:** 当用户消息数接近 80+ 时，主动提示建议开新会话
