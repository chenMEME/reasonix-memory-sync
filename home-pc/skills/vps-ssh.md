---
name: vps-ssh
description: 通过SSH在VPS上执行命令（用paramiko，密码从vps-info记忆读取）
---
# VPS SSH — 远程执行命令

## 适用场景
- 需要在 VPS 上执行命令（docker ps、cat log、修改配置等）
- 临时查看服务状态
- 重启容器

## 前置条件
SSH MCP 服务器尚未生效时使用此 skill（通过 Python paramiko）。
生效后直接使用 SSH MCP 工具。

## 使用方法

### 连接默认 VPS
```python
import paramiko
import os
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
# 密码从环境变量 SSH_SERVICES 读取
client.connect('{{VPS_IP}}', username='root', password=os.environ['SSH_SERVICES'], timeout=10)
stdin, stdout, stderr = client.exec_command('<要执行的命令>')
print(stdout.read().decode())
client.close()
```

### 快速执行单条命令
```python
def ssh_run(host, cmd):
    import paramiko
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username='root', password=os.environ.get('SSH_SERVICES',''), timeout=10)
    stdin, stdout, stderr = client.exec_command(cmd)
    result = stdout.read().decode()
    client.close()
    return result
```

## 常用命令速查

### Docker
- `docker ps -a`
- `docker logs <容器名> --tail 30`
- `docker inspect <容器名>`
- `docker stop/rm <容器名>`

### 系统
- `ss -tlnp`
- `systemctl status <服务名>`
- `df -h`
- `free -m`

### 网络
- `curl -sI http://127.0.0.1:<端口>/`
- `ping <目标>`

## 安全注意
- 密码存储在环境变量 `SSH_SERVICES` 中
- 连接默认 VPS 时从环境变量读取凭据
- 避免在日志中泄漏密码