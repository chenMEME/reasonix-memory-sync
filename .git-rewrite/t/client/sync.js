#!/usr/bin/env node
/**
 * Reasonix Memory Sync — 多设备记忆同步脚本
 * STANDARD.md v1.0 的确定性实现，零外部依赖
 *
 * 用法:
 *   node sync.js init [--id <computerId>] [--desc "<描述>"]
 *   node sync.js collect          ← 收集本机记忆（输出到 stdout）
 *   node sync.js write            ← 从 stdin 读取 JSON 写入本地
 *   node sync.js diff             ← 对比本地与远程快照（从 stdin 读 JSON）
 *   node sync.js backup           ← 备份 .reasonix 目录
 *   node sync.js restore <path>   ← 从备份目录恢复
 *
 * 混合模式: AI 通过 MCP 工具操作 GitHub API, sync.js 做本地文件操作
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const homeDir = process.env.USERPROFILE || process.env.HOME || os.homedir();
const reasonixDir = path.join(homeDir, '.reasonix');
const memoryDir = path.join(reasonixDir, 'memory');
const globalDir = path.join(memoryDir, 'global');
const configPath = path.join(reasonixDir, 'config.json');
const syncConfigPath = path.join(reasonixDir, 'sync-config.json');

function log(...args) { console.error('[sync]', ...args); }

// ============ 工具函数 ============

function readJSON(fp) {
  try {
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch { return null; }
}

function hashText(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

function hashFile(fp) {
  try {
    if (!fs.existsSync(fp)) return '';
    return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
  } catch { return ''; }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (e.isFile()) fs.copyFileSync(s, d);
  }
}

function findProjDir() {
  if (!fs.existsSync(memoryDir)) return null;
  for (const e of fs.readdirSync(memoryDir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== 'global') return path.join(memoryDir, e.name);
  }
  return null;
}

function readStdin() {
  return new Promise(resolve => {
    let input = '';
    process.stdin.on('data', d => input += d);
    process.stdin.on('end', () => resolve(input));
  });
}

// ============ 电脑身份识别 ============

function readSyncConfig() {
  return readJSON(syncConfigPath);
}

function detectComputerId() {
  // 1. 优先读 sync-config.json（由 init 命令写入，最可靠）
  const sc = readSyncConfig();
  if (sc && sc.computerId) return sc.computerId;
  // 2. fallback: 用 hostname
  const hostname = os.hostname().toLowerCase();
  log(`未找到 sync-config.json，尝试 hostname 匹配: ${hostname}`);
  log('无法确定电脑身份，请运行: node sync.js init --id <computerId>');
  return 'unknown';
}

function getWorkspaceDir() {
  const cfg = readJSON(configPath);
  return cfg && cfg.workspaceDir ? cfg.workspaceDir : '';
}

// ============ init 命令 ============

function cmdInit() {
  const args = process.argv.slice(3);
  let computerId = '', description = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && i + 1 < args.length) computerId = args[++i];
    if (args[i] === '--desc' && i + 1 < args.length) description = args[++i];
  }

  const existing = readSyncConfig() || {};

  if (!computerId) {
    const hostname = os.hostname().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    computerId = hostname;
    log(`未指定 --id，使用 hostname: ${computerId}`);
  }

  const config = {
    ...existing,
    computerId,
    description: description || `${os.hostname()} (${os.platform()})`,
    platform: os.platform(),
    hostname: os.hostname(),
    workspace: getWorkspaceDir(),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(syncConfigPath, JSON.stringify(config, null, 2), 'utf8');
  log(`已写入 ${syncConfigPath}`);
  log(`  computerId : ${config.computerId}`);
  log(`  description: ${config.description}`);
  log(`  platform   : ${config.platform}`);
  log(`  hostname   : ${config.hostname}`);
  log(`  workspace  : ${config.workspace}`);
  console.log(JSON.stringify({ success: true, config }));
}

// ============ collect ============

async function cmdCollect() {
  const config = readJSON(configPath);
  const ws = getWorkspaceDir();
  const computerId = detectComputerId();

  const globalMemories = [];
  if (fs.existsSync(globalDir)) {
    for (const f of fs.readdirSync(globalDir)) {
      if (f.endsWith('.md')) globalMemories.push({
        name: f, content: fs.readFileSync(path.join(globalDir, f), 'utf8'),
      });
    }
  }

  const projectMemories = [];
  const projDir = findProjDir();
  if (projDir) {
    for (const f of fs.readdirSync(projDir)) {
      if (f.endsWith('.md')) projectMemories.push({
        name: f, content: fs.readFileSync(path.join(projDir, f), 'utf8'),
      });
    }
  }

  const skills = [];
  const skillsDir = ws ? path.join(ws, '.reasonix', 'skills') : '';
  if (skillsDir && fs.existsSync(skillsDir)) {
    for (const f of fs.readdirSync(skillsDir)) {
      if (f.endsWith('.md')) skills.push({
        name: f, content: fs.readFileSync(path.join(skillsDir, f), 'utf8'),
      });
    }
  }

  const result = {
    computer: computerId,
    timestamp: new Date().toISOString(),
    workspace: ws,
    memories: { global: globalMemories, project: projectMemories },
    skills,
    config: config ? { ...config, apiKey: '[FILTERED]' } : null,
  };
  console.log(JSON.stringify(result, null, 2));
  log(`收集完成: ${globalMemories.length} 条全局, ${projectMemories.length} 条项目, ${skills.length} 个 skill`);
}

// ============ diff ============

async function cmdDiff() {
  const input = await readStdin();
  try {
    const remote = JSON.parse(input);
    const result = {};

    const localGlobal = [];
    if (fs.existsSync(globalDir)) {
      for (const f of fs.readdirSync(globalDir)) {
        if (f.endsWith('.md')) localGlobal.push({
          name: f, content: fs.readFileSync(path.join(globalDir, f), 'utf8'),
        });
      }
    }
    result.global = diffMemories(localGlobal, remote.memories?.global || []);

    const localProject = [];
    const projDir = findProjDir();
    if (projDir) {
      for (const f of fs.readdirSync(projDir)) {
        if (f.endsWith('.md')) localProject.push({
          name: f, content: fs.readFileSync(path.join(projDir, f), 'utf8'),
        });
      }
    }
    result.project = diffMemories(localProject, remote.memories?.project || []);

    const ws = getWorkspaceDir();
    const localSkills = [];
    const skillsDir = ws ? path.join(ws, '.reasonix', 'skills') : '';
    if (skillsDir && fs.existsSync(skillsDir)) {
      for (const f of fs.readdirSync(skillsDir)) {
        if (f.endsWith('.md')) localSkills.push({
          name: f, content: fs.readFileSync(path.join(skillsDir, f), 'utf8'),
        });
      }
    }
    result.skills = diffMemories(localSkills, remote.skills || []);

    const localConfig = readJSON(configPath);
    result.configChanged = false;
    if (remote.config && localConfig) {
      const lMcp = (localConfig.mcp || []).sort().join(',');
      const rMcp = (remote.config.mcp || []).sort().join(',');
      result.configChanged = lMcp !== rMcp;
    }

    console.log(JSON.stringify(result, null, 2));
    const g = result.global; const p = result.project; const s = result.skills;
    log(`差异: 全局 +${g.added.length} ~${g.modified.length} -${g.deleted.length} | 项目 +${p.added.length} ~${p.modified.length} -${p.deleted.length} | skills +${s.added.length} ~${s.modified.length} -${s.deleted.length} | config ${result.configChanged ? '有变化' : '一致'}`);
  } catch (e) {
    log(`对比失败: ${e.message}`);
    console.log(JSON.stringify({ error: e.message }));
  }
}

function diffMemories(localList, remoteList) {
  const local = new Map(localList.map(m => [m.name, hashText(m.content)]));
  const remote = new Map(remoteList.map(m => [m.name, hashText(m.content)]));
  const added = [], modified = [], deleted = [], unchanged = [];

  for (const [name, rHash] of remote) {
    if (!local.has(name)) {
      added.push(name);
    } else if (local.get(name) !== rHash) {
      modified.push(name);
    } else {
      unchanged.push(name);
    }
  }
  for (const [name] of local) {
    if (!remote.has(name)) deleted.push(name);
  }
  return { added, modified, deleted, unchanged };
}

// ============ write ============

async function cmdWrite() {
  const input = await readStdin();
  try {
    const data = JSON.parse(input);
    const ws = data.workspace || getWorkspaceDir();
    let written = 0;

    if (data.memories?.global) {
      fs.mkdirSync(globalDir, { recursive: true });
      for (const m of data.memories.global) {
        fs.writeFileSync(path.join(globalDir, m.name), m.content, 'utf8');
        written++;
      }
    }

    if (data.memories?.project) {
      const dir = findProjDir() || path.join(memoryDir, 'project');
      fs.mkdirSync(dir, { recursive: true });
      for (const m of data.memories.project) {
        fs.writeFileSync(path.join(dir, m.name), m.content, 'utf8');
        written++;
      }
    }

    if (data.skills && ws) {
      const dir = path.join(ws, '.reasonix', 'skills');
      fs.mkdirSync(dir, { recursive: true });
      for (const s of data.skills) {
        fs.writeFileSync(path.join(dir, s.name), s.content, 'utf8');
        written++;
      }
    }

    if (data.config) {
      const cur = readJSON(configPath) || {};
      const rem = data.config;
      if (!cur.workspaceDir && rem.workspaceDir) cur.workspaceDir = rem.workspaceDir;
      if (!cur.recentWorkspaces && rem.recentWorkspaces) cur.recentWorkspaces = rem.recentWorkspaces;
      const rMcp = rem.mcp || []; const lMcp = cur.mcp || [];
      const names = new Set(lMcp.map(e => e.split('=')[0]));
      for (const e of rMcp) {
        const n = e.split('=')[0];
        if (!names.has(n)) { lMcp.push(e); names.add(n); log(`  config 新增 MCP: ${n}`); }
      }
      cur.mcp = lMcp;
      fs.writeFileSync(configPath, JSON.stringify(cur, null, 2), 'utf8');
      log('  config.json 已合并');
      written++;
    }

    log(`写入完成: ${written} 个文件`);
    console.log(JSON.stringify({ success: true, written }));
  } catch (e) {
    log(`写入失败: ${e.message}`);
    console.log(JSON.stringify({ success: false, error: e.message }));
  }
}

// ============ backup ============

function cmdBackup() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(homeDir, `.reasonix.backup-${ts}`);
  if (fs.existsSync(reasonixDir)) {
    copyDir(reasonixDir, dest);
    log(`备份到 ${dest}`);
    console.log(JSON.stringify({ backup: dest }));
  } else {
    log('.reasonix 目录不存在');
    console.log(JSON.stringify({ backup: null }));
  }
}

// ============ restore ============

function cmdRestore() {
  const bp = process.argv[3];
  if (!bp) {
    log('用法: node sync.js restore <备份路径>');
    console.log(JSON.stringify({ success: false, error: '请指定备份路径' }));
    return;
  }
  const src = path.resolve(bp);
  if (!fs.existsSync(src)) {
    log(`备份目录不存在: ${src}`);
    console.log(JSON.stringify({ success: false, error: '备份目录不存在' }));
    return;
  }
  if (!fs.existsSync(path.join(src, 'config.json')) && !fs.existsSync(path.join(src, 'memory'))) {
    log(`不是有效的备份: ${src}`);
    console.log(JSON.stringify({ success: false, error: '不是有效的备份目录' }));
    return;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const pre = path.join(homeDir, `.reasonix.pre-restore-${ts}`);
  if (fs.existsSync(reasonixDir)) {
    copyDir(reasonixDir, pre);
    log(`当前配置已备份到 ${pre}`);
  }
  if (fs.existsSync(reasonixDir)) fs.rmSync(reasonixDir, { recursive: true });
  copyDir(src, reasonixDir);
  log(`已从 ${src} 恢复`);
  console.log(JSON.stringify({ success: true, restoredFrom: src, preRestoreBackup: pre }));
}

// ============ 主入口 ============

const action = process.argv[2];
(async () => {
  switch (action) {
    case 'init':    cmdInit(); break;
    case 'collect': await cmdCollect(); break;
    case 'write':   await cmdWrite(); break;
    case 'diff':    await cmdDiff(); break;
    case 'backup':  cmdBackup(); break;
    case 'restore': cmdRestore(); break;
    default:
      console.log(`
用法:
  node sync.js init [--id <id>] [--desc "<desc>"]   初始化本机身份
  node sync.js collect                               收集本机记忆
  node sync.js write                                 从 stdin 写入本地
  node sync.js diff                                  对比本地与远程快照
  node sync.js backup                                备份 .reasonix 目录
  node sync.js restore <path>                        从备份恢复
`);
  }
})();
