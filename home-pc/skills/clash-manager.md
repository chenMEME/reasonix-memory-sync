---
name: clash-manager
description: Clash配置管理：查规则→通过增强模板加规则→重载配置→验证生效
---
# Clash Manager — Clash 配置管理

## 配置文件结构

```
配置目录: %APPDATA%\io.github.clash-verge-rev.clash-verge-rev\
├── config.yaml
├── verge.yaml
├── profiles.yaml
└── profiles\
    ├── RpaKE2o9YAdO.yaml
    ├── rnlsNO5XsvKb.yaml    # ★ 规则增强模板
    ├── pITw5w6hNbo8.yaml    # 代理增强模板
    ├── gsxWnLzxPwCo.yaml    # 策略组增强模板
    ├── m5cXOMM7Am0Z.yaml    # 合并增强模板
    └── Script.js
```

## 加直连规则
编辑 `profiles/rnlsNO5XsvKb.yaml` 的 `prepend`。

## 重载配置
- 方法1：Clash Verge 界面点"重新加载配置"
- 方法2：重启 Clash 进程
- 方法3：通过 API 重载

## 验证规则是否生效
```bash
curl -sI --connect-timeout 5 --proxy http://127.0.0.1:7897 http://目标IP/
```

## 历史教训
- ❌ 改主配置文件 → 下次订阅更新覆盖
- ❌ taskkill /F 杀 clash-verge.exe → 前端打不开
- ✅ 改增强模板的 `prepend` → 持久生效