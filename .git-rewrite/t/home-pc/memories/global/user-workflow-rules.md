---
name: user-workflow-rules
description: /plan优先、VPN桌面可见、信任会话批量确认
type: feedback
scope: global
created: 2026-05-18
priority: high
---
## 用户工作流规则

### 1. VPN / Clash 操作必须桌面可见
- 每次调用 Clash Verge / VPN 相关操作，**必须弹窗显示在桌面上**
- 不能后台静默调用——用户需要亲眼看到 VPN 在运行，否则会一直扣费
- 调用前确认用户能看到界面，而不是在后台偷偷跑

### 2. 推荐 /plan 模式
- 多步操作优先使用 /plan 模式，审后执行

### 3. 信任当前会话 + 批量确认（功能需求）
- 信任会话免确认 + 多操作合并到一次 review

**Why:** 用户 VPN 按流量/时长计费，看不见就是浪费钱
**How to apply:** 任何涉及 Clash / VPN / 代理的操作，必须让程序窗口弹出到桌面前台
