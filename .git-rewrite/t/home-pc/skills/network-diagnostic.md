---
name: network-diagnostic
description: 标准化网络排查流程：curl直连→走代理→检服务→检安全组→定位问题根因
---
# Network Diagnostic — 网络排查标准化流程

## 适用场景
- 浏览器访问不了某 IP/域名，但不确定是服务挂了还是代理问题
- 直连能通但浏览器报错
- 端口访问超时/被拒绝

## 标准化排查步骤（按顺序执行，每步出结果再走下一步）

### Step 1: 本机直连测试
```bash
curl -sI --connect-timeout 5 http://<目标IP>:<端口>/
```
- HTTP 200 → 服务正常，问题在代理/浏览器
- 超时 → 安全组或防火墙问题，检查云安全组
- 拒绝连接 → 服务没跑或者端口不对

### Step 2: 走 Clash 代理测试
```bash
curl -sI --connect-timeout 5 --proxy http://127.0.0.1:7897 http://<目标IP>:<端口>/
```
- 直连 200 + 代理超时/502 → **Clash 规则问题**，需要加直连规则
- 直连 200 + 代理 200 → 浏览器问题（缓存/DNS/插件）

### Step 3: 检查 Clash 规则是否生效
查规则增强文件 `profiles/rnlsNO5XsvKb.yaml` 的 `prepend` 部分：
```
IP-CIDR,<目标IP>/32,DIRECT
```
如果规则已经在了但代理测试仍不通 → 需要重启 Clash 重载配置

### Step 4: VPS 本机自检（如果可 SSH）
```bash
curl -sI http://127.0.0.1:<端口>/
```
- 200 → 服务正常，问题在云安全组
- 无响应 → 服务挂了或 Docker 容器没跑

### Step 5: 检查云安全组
在云控制台检查入方向规则是否放行了目标端口

### Step 6: 输出诊断结论
一句话总结根因，附带每个步骤的测试结果

## 历史教训
- 浏览器 502 + 本机 curl 200 → 99% 是 Clash 代理问题（走代理返回了502）
- 加直连规则必须改 `rnlsNO5XsvKb.yaml` 的 `prepend`，不是主配置文件
- 改完规则需要重载 Clash 配置才能生效
- 杀 Clash 进程会导致前端打不开，改用"重新加载配置"按钮
