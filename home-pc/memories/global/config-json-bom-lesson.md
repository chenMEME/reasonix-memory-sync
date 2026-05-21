---
name: config-json-bom-lesson
description: 改~/.reasonix/config.json必须用无BOM的UTF-8编码，否则Reasonix解析失败丢失配置
type: feedback
scope: global
created: 2026-05-18
---
# Reasonix 配置文件编码教训

## 规则
修改 `~/.reasonix/config.json` 时，**必须使用 UTF-8 无 BOM 编码**，否则 Reasonix 解析失败导致配置丢失。

## 正确做法
PowerShell 写入无 BOM 的 UTF-8：
```powershell
[System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
```

## 错误做法（会导致配置丢失）
```powershell
# ❌ PowerShell 5 的 Set-Content -Encoding UTF8 会写 BOM
$config | ConvertTo-Json | Set-Content $path -Encoding UTF8

# ❌ Out-File 同样会写 BOM
$config | ConvertTo-Json | Out-File $path -Encoding UTF8
```

## 症状
- 写入后看起来正常（`type` 能看到内容）
- 重启 Reasonix 后大量配置消失
- 只保留 apiKey（用户手动重新输入后的值）

## 为什么浪费 token
- 第一次修改后没有检查编码问题
- 花了一整轮排查才知道是 BOM 问题
- 让用户多重启了一次

**Why:** 编码问题导致 Reasonix 启动时解析失败，配置全部丢失
**How to apply:** 改 config.json 必须用无 BOM 的 UTF-8 写入
