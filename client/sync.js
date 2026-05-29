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
const { execSync } = require('child_process');

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

// ============ 脱敏 ============

function redactText(text, ws) {
  const hd = homeDir.replace(/\\/g, '\\\\');
  const patterns = [
    { re: new RegExp(hd, 'gi'), ph: '[HOME_DIR]' },
    { re: new RegExp(os.hostname(), 'gi'), ph: '[HOSTNAME]' },
    { re: new RegExp(os.userInfo().username, 'gi'), ph: '[USERNAME]' },
  ];
  if (ws) patterns.push({ re: new RegExp(ws.replace(/\\/g, '\\\\'), 'gi'), ph: '[WORKSPACE]' });
  let r = text;
  for (const p of patterns) r = r.replace(p.re, p.ph);
  return r;
}

// ============ collect ============

function collectData() {
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

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const _ws = ws || '';
  const _r = (arr) => arr.map(m => ({ ...m, content: redactText(m.content, _ws) }));

  return {
    computer: computerId,
    timestamp,
    workspace: _ws,
    memories: { global: _r(globalMemories), project: _r(projectMemories) },
    skills: _r(skills),
    config: config ? { ...config, apiKey: '[FILTERED]' } : null,
  };
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

// ============ buildManifest ============

function buildManifest(dirPath) {
  const entries = [];
  function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isSymbolicLink()) continue; // skip symlinks (latest)
      if (e.isDirectory()) { walk(full, r); continue; }
      if (!e.isFile()) continue;
      entries.push({
        path: r.replace(/\\/g, '/'),
        sha256: hashFile(full),
        size: fs.statSync(full).size,
      });
    }
  }
  walk(dirPath, '');
  return entries;
}

// ============ git backup (backup --repo <url>) ============

function cmdBackupGit(repoUrl) {
  log(`git backup → ${repoUrl}`);
  const data = collectData();
  log(`收集完成: ${data.memories.global.length} 条全局, ${data.memories.project.length} 条项目, ${data.skills.length} 个 skill`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reasonix-git-'));
  let gitDir = tmpDir;

  try {
    // 尝试 clone 已有仓库（含其他电脑的备份）
    execSync(`git clone --depth 1 "${repoUrl}" "${tmpDir}"`, { stdio: 'pipe', timeout: 60000 });
    log('已克隆现有仓库');
  } catch {
    // 首次备份：初始化空仓库
    execSync(`git init "${tmpDir}"`, { stdio: 'pipe' });
    execSync(`git -C "${tmpDir}" remote add origin "${repoUrl}"`, { stdio: 'pipe' });
    log('已初始化新仓库');
  }

  try {
    // 创建 backup/<computerId>/<timestamp>/ 目录结构
    const backupDir = path.join(gitDir, 'backup', data.computer, data.timestamp);
    const memoriesDir = path.join(backupDir, 'memories');
    const globalMemDir = path.join(memoriesDir, 'global');
    const projectMemDir = path.join(memoriesDir, 'project');
    const skillsDir = path.join(backupDir, 'skills');
    fs.mkdirSync(globalMemDir, { recursive: true });
    fs.mkdirSync(projectMemDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });

    // 写入 config.json（apiKey 已在上层 collectData 中过滤为 [FILTERED]）
    fs.writeFileSync(
      path.join(backupDir, 'config.json'),
      JSON.stringify(data.config || {}, null, 2),
      'utf8'
    );

    // 写入记忆文件
    for (const m of data.memories.global) {
      fs.writeFileSync(path.join(globalMemDir, m.name), m.content, 'utf8');
    }
    for (const m of data.memories.project) {
      fs.writeFileSync(path.join(projectMemDir, m.name), m.content, 'utf8');
    }
    for (const s of data.skills) {
      fs.writeFileSync(path.join(skillsDir, s.name), s.content, 'utf8');
    }

    // 写入 manifest.json（文件清单 + sha256，排除自身）
    const manifest = buildManifest(backupDir);
    const manifestPath = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    // 将 manifest.json 自身也加入清单
    manifest.push({
      path: 'manifest.json',
      sha256: hashFile(manifestPath),
      size: fs.statSync(manifestPath).size,
    });
    // 重新写入包含自身哈希的完整清单
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    // 创建/更新 latest 符号链接
    const computerDir = path.join(gitDir, 'backup', data.computer);
    const latestPath = path.join(computerDir, 'latest');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(data.timestamp, latestPath);
    log(`latest → ${data.timestamp}`);

    // git add + commit + push
    execSync(`git -C "${gitDir}" add -A`, { stdio: 'pipe' });
    execSync(
      `git -C "${gitDir}" commit -m "backup: ${data.computer} ${data.timestamp}"`,
      { stdio: 'pipe' }
    );
    execSync(`git -C "${gitDir}" push origin HEAD`, { stdio: 'pipe', timeout: 120000 });

    log('git backup 成功!');
    console.log(JSON.stringify({
      success: true,
      computer: data.computer,
      timestamp: data.timestamp,
      repo: repoUrl,
      files: manifest.length,
    }));
  } catch (e) {
    log(`git backup 失败: ${e.message}`);
    console.log(JSON.stringify({ success: false, error: e.message }));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
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

// ============ deploy ============

function promptUser(question) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.toLowerCase().trim()); });
  });
}

async function cmdDeploy() {
  const args = process.argv.slice(3);
  let repoUrl = '', atTimestamp = '', autoYes = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo' && i + 1 < args.length) repoUrl = args[++i];
    if (args[i] === '--at' && i + 1 < args.length) atTimestamp = args[++i];
    if (args[i] === '-y' || args[i] === '--yes') autoYes = true;
  }

  if (!repoUrl) {
    log('用法: node sync.js deploy --repo <url> [--at <timestamp>] [-y]');
    console.log(JSON.stringify({ success: false, error: '请指定 --repo' }));
    return;
  }

  const tempDir = path.join(homeDir, '.reasonix-deploy-tmp');
  const repoDir = path.join(tempDir, 'repo');

  // Clean any stale temp
  if (fs.existsSync(tempDir)) {
    try { fs.rmSync(tempDir, { recursive: true }); } catch {}
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // ── 1. git clone ──
    log(`克隆仓库: ${repoUrl}`);
    execSync(`git clone "${repoUrl}" "${repoDir}"`, { stdio: 'pipe', timeout: 120000 });
    log('克隆完成');

    // ── 2. List available computers from backup/ ──
    const backupDir = path.join(repoDir, 'backup');
    if (!fs.existsSync(backupDir)) {
      throw new Error('仓库中没有 backup/ 目录，请先运行 backup');
    }

    const computers = fs.readdirSync(backupDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);

    if (computers.length === 0) throw new Error('backup/ 中没有电脑备份');

    // ── 3. Determine target computer ──
    const localId = detectComputerId();
    let targetComputer = '';

    if (computers.includes(localId)) {
      targetComputer = localId;
    } else {
      log(`本机 ID "${localId}" 在备份中未找到`);
      log(`可用电脑: ${computers.join(', ')}`);
      targetComputer = computers[0];
      log(`将使用 "${targetComputer}" 的最新备份`);

      if (!autoYes) {
        const ans = await promptUser(`将从电脑 "${targetComputer}" 部署到本机，是否继续？[Y/n] `);
        if (ans === 'n' || ans === 'no') throw new Error('用户取消部署');
      }
    }

    // ── 4. Determine timestamp ──
    const computerDir = path.join(backupDir, targetComputer);
    const timestamps = fs.readdirSync(computerDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== 'latest')
      .map(e => e.name)
      .sort();

    if (timestamps.length === 0) throw new Error(`${targetComputer} 没有备份`);

    const ts = atTimestamp || timestamps[timestamps.length - 1];
    const snapshotDir = path.join(computerDir, ts);
    if (!fs.existsSync(snapshotDir)) throw new Error(`时间戳 "${ts}" 不存在`);

    log(`部署来源: ${targetComputer}/${ts}`);

    // ── Check local memories count (warn before overwrite) ──
    let localMemCount = 0;
    if (fs.existsSync(globalDir)) {
      localMemCount += fs.readdirSync(globalDir).filter(f => f.endsWith('.md')).length;
    }
    const projDir = findProjDir();
    if (projDir && fs.existsSync(projDir)) {
      localMemCount += fs.readdirSync(projDir).filter(f => f.endsWith('.md')).length;
    }
    if (localMemCount > 0 && !autoYes) {
      const ans = await promptUser(`本机已有 ${localMemCount} 条记忆，将全部替换为远程版本，是否继续？[Y/n] `);
      if (ans === 'n' || ans === 'no') throw new Error('用户取消部署');
    }

    // ── 5. Pre-deploy backup ──
    const preDeployTs = new Date().toISOString().replace(/[:.]/g, '-');
    const preDeployDir = path.join(reasonixDir, `pre-deploy-${preDeployTs}`);
    if (fs.existsSync(reasonixDir)) {
      copyDir(reasonixDir, preDeployDir);
      log(`当前 ~/.reasonix 已备份到 ${preDeployDir}`);
    }

    // ── 6. Read manifest ──
    const manifestPath = path.join(snapshotDir, 'manifest.json');
    const manifest = readJSON(manifestPath);
    if (!manifest) throw new Error('manifest.json 不存在或格式错误');
    const manifestFiles = Array.isArray(manifest) ? manifest : (manifest.files || []);
    log(`清单: ${manifestFiles.length} 个文件`);

    // ── 7. Write files ──
    let written = 0;
    const ws = getWorkspaceDir();
    const remoteConfigPath = path.join(snapshotDir, 'config.json');
    const remoteConfig = readJSON(remoteConfigPath) || {};

    // --- Global memories ---
    const remoteGlobalDir = path.join(snapshotDir, 'memories', 'global');
    if (fs.existsSync(remoteGlobalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
      for (const f of fs.readdirSync(remoteGlobalDir)) {
        if (f.endsWith('.md')) {
          fs.copyFileSync(path.join(remoteGlobalDir, f), path.join(globalDir, f));
          written++;
        }
      }
    }

    // --- Project memories ---
    const remoteProjectDir = path.join(snapshotDir, 'memories', 'project');
    if (fs.existsSync(remoteProjectDir)) {
      const localProjDir = findProjDir() || path.join(memoryDir, 'project');
      fs.mkdirSync(localProjDir, { recursive: true });
      for (const f of fs.readdirSync(remoteProjectDir)) {
        if (f.endsWith('.md')) {
          fs.copyFileSync(path.join(remoteProjectDir, f), path.join(localProjDir, f));
          written++;
        }
      }
    }

    // --- Skills (use local workspaceDir) ---
    const remoteSkillsDir = path.join(snapshotDir, 'skills');
    if (fs.existsSync(remoteSkillsDir) && ws) {
      const localSkillsDir = path.join(ws, '.reasonix', 'skills');
      fs.mkdirSync(localSkillsDir, { recursive: true });
      for (const f of fs.readdirSync(remoteSkillsDir)) {
        if (f.endsWith('.md')) {
          fs.copyFileSync(path.join(remoteSkillsDir, f), path.join(localSkillsDir, f));
          written++;
        }
      }
    }

    // --- Config merge (preserve local apiKey & workspaceDir) ---
    const curConfig = readJSON(configPath) || {};
    const mergedConfig = { ...remoteConfig };
    if (curConfig.apiKey) mergedConfig.apiKey = curConfig.apiKey;
    if (curConfig.workspaceDir) mergedConfig.workspaceDir = curConfig.workspaceDir;
    // Merge MCP entries (add remote ones not already present)
    const lMcp = curConfig.mcp || [];
    const rMcp = remoteConfig.mcp || [];
    const names = new Set(lMcp.map(e => e.split('=')[0]));
    for (const e of rMcp) {
      const n = e.split('=')[0];
      if (!names.has(n)) { lMcp.push(e); names.add(n); }
    }
    mergedConfig.mcp = lMcp;
    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');
    log('config.json 已合并（保留本机 apiKey 和 workspaceDir）');
    written++;

    // ── 8. Clean up temp ──
    fs.rmSync(tempDir, { recursive: true, force: true });

    // ── 9. Run verify silently ──
    log('运行 verify 检查...');
    const verifyResult = cmdVerify(true);

    // ── 10. Report ──
    const pathWarning = (ws && remoteConfig.workspaceDir && ws !== remoteConfig.workspaceDir);

    log('========== Deploy 报告 ==========');
    log(`来源电脑 : ${targetComputer}`);
    log(`备份时间 : ${ts}`);
    log(`写入文件 : ${written} 个`);
    if (pathWarning) {
      log(`⚠ 路径差异: 备份中 workspaceDir="${remoteConfig.workspaceDir}", 本机="${ws}"`);
      log(`   Skills 已写入本机工作目录`);
      log(`   如记忆内容中包含旧路径，请手动修改`);
    }
    if (fs.existsSync(preDeployDir)) {
      log(`💾 部署前备份: ${preDeployDir}`);
      log(`   回滚: node sync.js restore ${preDeployDir}`);
    }
    const vp = verifyResult;
    log(`Verify: ${vp.passed} ✅, ${vp.failed} ❌ — ${vp.allOk ? '全部通过 🎉' : vp.failed + ' 项未通过 ⚠'}`);
    log('================================');

    console.log(JSON.stringify({
      success: true,
      source: targetComputer,
      timestamp: ts,
      written,
      preDeployBackup: fs.existsSync(preDeployDir) ? preDeployDir : null,
      pathWarning: pathWarning ? `备份中的 workspaceDir 是 "${remoteConfig.workspaceDir}", 本机是 "${ws}"` : null,
      verify: verifyResult,
    }));

  } catch (e) {
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    log(`部署失败: ${e.message}`);
    console.log(JSON.stringify({ success: false, error: e.message }));
    process.exit(1);
  }
}

// ============ verify ============

/**
 * Verify local Reasonix data integrity.
 * Can be called directly (from CLI) or silently (from deploy).
 * @param {boolean} silent - If true, returns result object instead of printing
 * @returns {object|null} Result object (only returned if silent=true)
 */
function cmdVerify(silent) {
  const results = [];

  function check(label, ok, detail) {
    results.push({ label, ok, detail: detail || '' });
  }

  let allOk = true;

  // ── 1. Check ~/.reasonix structure ──
  const reasonixExists = fs.existsSync(reasonixDir);
  check('~/.reasonix 目录存在', reasonixExists);
  if (!reasonixExists) {
    allOk = false;
    const r = { allOk: false, passed: 0, failed: 1, checks: results };
    if (!silent) {
      log('❌ ~/.reasonix 目录不存在');
      console.log(JSON.stringify(r));
      process.exit(1);
    }
    return r;
  }

  // ── 2. Check config.json ──
  const config = readJSON(configPath);
  check('config.json 存在且有效', !!config);
  if (config) {
    // Check workspaceDir
    const wsDir = config.workspaceDir;
    if (wsDir) {
      const wsExists = fs.existsSync(wsDir);
      check(`workspaceDir: ${wsDir}`, wsExists);
      if (!wsExists) allOk = false;
    } else {
      check('workspaceDir 配置', true);
    }

    // Check MCP paths
    const mcpEntries = config.mcp || [];
    if (mcpEntries.length > 0) {
      for (const entry of mcpEntries) {
        const parts = entry.split('=');
        if (parts.length >= 2) {
          const prog = parts.slice(1).join('=').trim();
          const exists = fs.existsSync(prog);
          if (!exists) allOk = false;
          check(`MCP: ${parts[0]} → ${prog}`, exists);
        }
      }
    }
  }

  // ── 3. Check global memories ──
  if (fs.existsSync(globalDir)) {
    const files = fs.readdirSync(globalDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      check('全局记忆', true);
    }
    for (const f of files) {
      const fp = path.join(globalDir, f);
      const exists = fs.existsSync(fp);
      let readable = false;
      let hash = '';
      try {
        const content = fs.readFileSync(fp, 'utf8');
        readable = content.length > 0;
        hash = hashFile(fp);
      } catch {}
      check(`全局: ${f}`, exists && readable);
      if (!exists || !readable) allOk = false;
    }
  } else {
    check('全局记忆目录', true);
  }

  // ── 4. Check project memories ──
  const projDir = findProjDir();
  if (projDir && fs.existsSync(projDir)) {
    const files = fs.readdirSync(projDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      check('项目记忆', true);
    }
    for (const f of files) {
      const fp = path.join(projDir, f);
      const exists = fs.existsSync(fp);
      let readable = false;
      try {
        const content = fs.readFileSync(fp, 'utf8');
        readable = content.length > 0;
      } catch {}
      check(`项目: ${f}`, exists && readable);
      if (!exists || !readable) allOk = false;
    }
  } else {
    check('项目记忆', true);
  }

  // ── 5. Check skills ──
  const ws = getWorkspaceDir();
  const skillsDir = ws ? path.join(ws, '.reasonix', 'skills') : '';
  if (skillsDir && fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      check('Skills', true);
    }
    for (const f of files) {
      const fp = path.join(skillsDir, f);
      const exists = fs.existsSync(fp);
      let readable = false;
      try {
        const content = fs.readFileSync(fp, 'utf8');
        readable = content.length > 0;
      } catch {}
      check(`Skill: ${f}`, exists && readable);
      if (!exists || !readable) allOk = false;
    }
  } else {
    check('Skills', true);
  }

  // ── Summary ──
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  if (!silent) {
    log('');
    log(`📊 Verify 报告: ${passed} ✅, ${failed} ❌`);
    log(allOk ? '🎉 全部通过' : `⚠ ${failed} 项未通过`);
  }

  const report = { allOk, passed, failed, checks: results };

  if (!silent) {
    console.log(JSON.stringify(report));
    if (!allOk) process.exit(1);
  }

  return report;
}

// ============ 脱敏引擎 ============

/**
 * 四级脱敏规则（REASONIX-DEPLOY-SPEC.md 第8节）
 */

// 级别1 — 硬性过滤
const L1_SENSITIVE_KEYS = ['apiKey', 'API_KEY', 'api_key', 'apikey', 'ApiKey'];
const L1_SECRET_KEYS = ['password', 'secret', 'token', 'Password', 'Secret', 'Token'];
// 匹配 ssh-, ghp_, sk- 等前缀 + 20+ 字符的敏感token
const L1_TOKEN_PREFIX_RE = /\b(?:ssh-[a-zA-Z0-9+/=]{20,}|ghp_[a-zA-Z0-9]{20,}|gho_[a-zA-Z0-9]{20,}|ghu_[a-zA-Z0-9]{20,}|ghs_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9+/=]{20,})\b/g;
// 匹配 Bearer / Authorization 头
const L1_BEARER_RE = /(Bearer\s+)[a-zA-Z0-9._~+/=-]+/g;
const L1_AUTH_RE = /(Authorization:\s*(?:Bearer\s+)?)[a-zA-Z0-9._~+/=-]+/g;

// 级别2 — 模式匹配
const L2_IP_RE = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
const L2_EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g;
const L2_WIN_USER_RE = /(C:\\Users\\)[^\\]+/gi;
const L2_DRIVE_PATH_RE = /\b([A-Z]:\\(?:[^\\\n\r]+\\)*[^\\\n\r]*)\b/g;

function isPrivateIP(a, b, c, d) {
  const ai = parseInt(a, 10), bi = parseInt(b, 10), ci = parseInt(c, 10), di = parseInt(d, 10);
  if (ai === 10) return true;
  if (ai === 192 && bi === 168) return true;
  if (ai === 172 && bi >= 16 && bi <= 31) return true;
  if (ai === 127) return true;
  return false;
}

// 级别3 — PathPairs 精确替换
function buildLevel3Replacements(pathPairs) {
  const result = [];
  if (!pathPairs || typeof pathPairs !== 'object') return result;
  for (const [pattern, placeholder] of Object.entries(pathPairs)) {
    result.push({ pattern, placeholder });
  }
  // 按长度降序排列，优先匹配更长的模式
  result.sort((a, b) => b.pattern.length - a.pattern.length);
  return result;
}

// 级别2 过滤盘符路径时的辅助 — 确保不匹配 C:\Users 这类已处理路径
function isAlreadyMatchedByUserPath(match, offset, fullStr) {
  const userPat = /C:\\Users\\/i;
  const before = fullStr.slice(0, offset);
  const lastNewline = before.lastIndexOf('\n');
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const lineSoFar = before.slice(lineStart);
  const userMatch = lineSoFar.match(userPat);
  if (userMatch) {
    // Check if this drive path is actually part of a C:\Users\... sequence
    const afterUser = lineSoFar.slice(userMatch.index + userMatch[0].length);
    if (afterUser.length > 0 && afterUser.split('\\').length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * 对单段文本执行全部四级脱敏
 * @param {string} text - 原文内容
 * @param {Array} level3Pairs - [{ pattern, placeholder }] 已排序
 * @param {Set} excludedFiles - 级别4排除文件名集合
 * @param {string} filename - 当前文件名（用于级别4检查）
 * @param {Array} log - 替换日志数组
 * @returns {string|null} 脱敏后的文本，如果是排除文件则返回 null
 */
function sanitizeText(text, level3Pairs, excludedFiles, filename, log) {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  const fileLog = { file: filename, replacements: [] };
  const countMap = {};

  function record(pattern, count) {
    if (count > 0) {
      if (countMap[pattern]) countMap[pattern] += count;
      else countMap[pattern] = count;
    }
  }

  // --- 级别1: 硬性过滤 ---

  // 1a. JSON 键值对中的敏感键
  for (const key of L1_SENSITIVE_KEYS) {
    // 匹配 "key": "value" 或 'key': 'value'
    const re = new RegExp(`("${key}"\\s*:\\s*")[^"]+(")`, 'gi');
    result = result.replace(re, (_, p1, p2) => {
      record(`L1:${key}`, 1);
      return `${p1}[FILTERED]${p2}`;
    });
    const re2 = new RegExp(`('${key}'\\s*:\\s*')[^']+(')`, 'gi');
    result = result.replace(re2, (_, p1, p2) => {
      record(`L1:${key}`, 1);
      return `${p1}[FILTERED]${p2}`;
    });
  }

  // 1b. 敏感键值 — 匹配 key: value 或 key=value 格式
  for (const key of L1_SECRET_KEYS) {
    const re = new RegExp(`(${key}\\s*[:=]\\s*)\\S+`, 'gi');
    result = result.replace(re, (_, p1) => {
      record(`L1:${key}`, 1);
      return `${p1}[FILTERED]`;
    });
  }

  // 1c. 敏感 token 前缀
  const tokenMatch = result.match(L1_TOKEN_PREFIX_RE);
  if (tokenMatch) {
    result = result.replace(L1_TOKEN_PREFIX_RE, '[FILTERED]');
    record('L1:token_prefix', tokenMatch.length);
  }

  // 1d. Bearer token
  const bearerMatch = result.match(L1_BEARER_RE);
  if (bearerMatch) {
    result = result.replace(L1_BEARER_RE, '$1[FILTERED]');
    record('L1:Bearer', bearerMatch.length);
  }

  // 1e. Authorization header
  const authMatch = result.match(L1_AUTH_RE);
  if (authMatch) {
    result = result.replace(L1_AUTH_RE, '$1[FILTERED]');
    record('L1:Authorization', authMatch.length);
  }

  // --- 级别3: PathPairs 精确替换 (优先于级别2, 避免被通用模式覆盖) ---
  for (const { pattern, placeholder } of level3Pairs) {
    let count = 0;
    let prev;
    do {
      prev = result;
      result = result.replace(pattern, placeholder);
      if (result !== prev) count++;
    } while (result !== prev);
    if (count > 0) record(`L3:pathPair(${placeholder})`, count);
  }

  // --- 级别2: 模式匹配 ---

  // 2a. IP地址
  result = result.replace(L2_IP_RE, (...args) => {
    const a = args[1], b = args[2], c = args[3], d = args[4];
    record('L2:IP', 1);
    if (isPrivateIP(a, b, c, d)) return '{{LAN_IP}}';
    return '{{IP}}';
  });

  // 2b. 邮箱
  const emailMatch = result.match(L2_EMAIL_RE);
  result = result.replace(L2_EMAIL_RE, '{{EMAIL}}');
  if (emailMatch) record('L2:EMAIL', emailMatch.length);

  // 2c. Windows 用户名路径
  const userMatch = result.match(L2_WIN_USER_RE);
  result = result.replace(L2_WIN_USER_RE, 'C:\\Users\\{{USER}}');
  if (userMatch) record('L2:WinUser', userMatch.length);

  // 2d. 盘符绝对路径（排除已匹配 C:\\Users\\ 的行）
  const driveMatches = [];
  const driveRe = /\b([A-Z]:\\(?:[^\\\n\r"']+\\)*[^\\\n\r"']*)\b/g;
  let m;
  while ((m = driveRe.exec(result)) !== null) {
    const full = m[1];
    if (!/^C:\\Users\\/i.test(full)) {
      driveMatches.push({ full, index: m.index });
    }
  }

  if (driveMatches.length > 0) {
    // 反向替换以避免 index 偏移
    for (let i = driveMatches.length - 1; i >= 0; i--) {
      const { full, index } = driveMatches[i];
      result = result.slice(0, index) + '{{PATH}}' + result.slice(index + full.length);
    }
    record('L2:DrivePath', driveMatches.length);
  }

  // 构建日志条目
  for (const [pat, cnt] of Object.entries(countMap)) {
    fileLog.replacements.push({ pattern: pat, count: cnt });
  }
  if (fileLog.replacements.length > 0) {
    log.push(fileLog);
  }

  return result;
}

/**
 * 主脱敏函数
 * @param {object} data - 收集到的数据对象
 * @param {string} mode - 'private' | 'public' | 'inspect'
 * @returns {object} 脱敏后的数据
 */
function sanitizeData(data, mode) {
  if (mode === 'private') return data;

  // 读取 sync-config.json 获取 pathPairs 和 machineSpecific
  const syncConfig = readSyncConfig() || {};
  const pathPairs = syncConfig.pathPairs || {};
  const machineSpecific = syncConfig.machineSpecific || [];

  // 构建级别3替换列表
  const level3Pairs = buildLevel3Replacements(pathPairs);
  const excludedSet = new Set(machineSpecific);
  const sanitizeLog = [];
  const excludedFiles = [];

  // 对数据进行深拷贝以避免修改原始数据
  const result = JSON.parse(JSON.stringify(data));

  // 添加脱敏元数据
  result._sanitized = true;
  result._sanitizeMode = mode;

  // 处理 memories
  if (result.memories) {
    for (const category of ['global', 'project']) {
      if (Array.isArray(result.memories[category])) {
        const filtered = [];
        for (const mem of result.memories[category]) {
          if (excludedSet.has(mem.name)) {
            excludedFiles.push(mem.name);
            sanitizeLog.push({
              file: mem.name,
              excluded: true,
              reason: 'machineSpecific'
            });
            continue; // 级别4: 整文件排除
          }
          // 脱敏内容
          const sanitizedContent = sanitizeText(mem.content, level3Pairs, excludedSet, mem.name, sanitizeLog);
          if (sanitizedContent !== null) {
            filtered.push({ name: mem.name, content: sanitizedContent });
          } else {
            excludedFiles.push(mem.name);
          }
        }
        result.memories[category] = filtered;
      }
    }
  }

  // 处理 skills
  if (Array.isArray(result.skills)) {
    const filtered = [];
    for (const sk of result.skills) {
      if (excludedSet.has(sk.name)) {
        excludedFiles.push(sk.name);
        sanitizeLog.push({
          file: sk.name,
          excluded: true,
          reason: 'machineSpecific'
        });
        continue;
      }
      const sanitizedContent = sanitizeText(sk.content, level3Pairs, excludedSet, sk.name, sanitizeLog);
      if (sanitizedContent !== null) {
        filtered.push({ name: sk.name, content: sanitizedContent });
      } else {
        excludedFiles.push(sk.name);
      }
    }
    result.skills = filtered;
  }

  // 处理 config (如果有)
  if (result.config) {
    let configStr = JSON.stringify(result.config);
    configStr = sanitizeText(configStr, level3Pairs, excludedSet, 'config.json', sanitizeLog);
    try {
      result.config = JSON.parse(configStr);
    } catch {
      result.config = { _note: 'config sanitized', _original: '(see _sanitizeLog)' };
    }
  }

  // 处理 workspace 字段
  if (result.workspace && typeof result.workspace === 'string') {
    result.workspace = sanitizeText(result.workspace, level3Pairs, excludedSet, 'workspace', sanitizeLog);
  }

  result._sanitizeLog = sanitizeLog;
  if (excludedFiles.length > 0) {
    result._machineSpecificExcluded = excludedFiles;
  }

  return result;
}

// ============ sanitize 命令 ============

async function cmdSanitize() {
  const args = process.argv.slice(3);
  let mode = 'public';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && i + 1 < args.length) {
      const m = args[++i].toLowerCase();
      if (['private', 'public', 'inspect'].includes(m)) mode = m;
      else { log(`无效模式: ${m}，使用默认 public`); mode = 'public'; }
    }
  }

  try {
    const input = await readStdin();
    const data = JSON.parse(input);
    const result = sanitizeData(data, mode);
    console.log(JSON.stringify(result, null, 2));

    const logCount = result._sanitizeLog ? result._sanitizeLog.length : 0;
    const exclCount = result._machineSpecificExcluded ? result._machineSpecificExcluded.length : 0;
    log(`脱敏完成 (mode=${mode}): ${logCount} 条替换记录, ${exclCount} 个排除文件`);
  } catch (e) {
    log(`脱敏失败: ${e.message}`);
    process.exit(1);
  }
}

// ============ inspect 命令 ============

async function cmdInspect() {
  try {
    const input = await readStdin();
    const data = JSON.parse(input);
    // inspect 模式不修改数据，只预览改动
    const preview = sanitizeData(data, 'inspect');
    // 输出预览报告而不是完整数据
    const report = {
      _sanitized: false,
      _sanitizeMode: 'inspect',
      _sanitizeLog: preview._sanitizeLog || [],
      _machineSpecificExcluded: preview._machineSpecificExcluded || [],
      totalMemories: (data.memories?.global?.length || 0) + (data.memories?.project?.length || 0),
      totalSkills: data.skills?.length || 0,
    };
    console.log(JSON.stringify(report, null, 2));
    log('预览模式: 数据未被修改');
  } catch (e) {
    log(`预览失败: ${e.message}`);
    process.exit(1);
  }
}

function saveSyncConfig(config) {
  fs.mkdirSync(path.dirname(syncConfigPath), { recursive: true });
  fs.writeFileSync(syncConfigPath, JSON.stringify(config, null, 2), 'utf8');
}

// ============ pathpair 子命令 ============

function cmdPathpair() {
  const sub = process.argv[3];
  const syncConfig = readSyncConfig() || {};
  if (!syncConfig.pathPairs) syncConfig.pathPairs = {};

  switch (sub) {
    case 'add': {
      const pathArg = process.argv[4];
      const placeholder = process.argv[5];
      if (!pathArg || !placeholder) {
        log('用法: node sync.js pathpair add <path> <placeholder>');
        console.log(JSON.stringify({ error: '请指定路径和占位符' }));
        return;
      }
      syncConfig.pathPairs[pathArg] = placeholder;
      saveSyncConfig(syncConfig);
      log(`已添加 pathPair: "${pathArg}" → ${placeholder}`);
      console.log(JSON.stringify({ success: true, pathPairs: syncConfig.pathPairs }));
      break;
    }
    case 'remove': {
      const pathArg = process.argv[4];
      if (!pathArg) {
        log('用法: node sync.js pathpair remove <path>');
        console.log(JSON.stringify({ error: '请指定路径' }));
        return;
      }
      if (syncConfig.pathPairs[pathArg]) {
        delete syncConfig.pathPairs[pathArg];
        saveSyncConfig(syncConfig);
        log(`已移除 pathPair: "${pathArg}"`);
      } else {
        log(`未找到 pathPair: "${pathArg}"`);
      }
      console.log(JSON.stringify({ success: true, pathPairs: syncConfig.pathPairs }));
      break;
    }
    case 'list': {
      const pairs = syncConfig.pathPairs || {};
      const entries = Object.entries(pairs);
      if (entries.length === 0) {
        log('当前没有 pathPair 映射');
      } else {
        log(`pathPair 映射 (${entries.length} 条):`);
        for (const [p, ph] of entries) {
          log(`  "${p}" → ${ph}`);
        }
      }
      console.log(JSON.stringify({ pathPairs: pairs }));
      break;
    }
    default:
      log('用法:');
      log('  node sync.js pathpair add <path> <placeholder>');
      log('  node sync.js pathpair remove <path>');
      log('  node sync.js pathpair list');
      console.log(JSON.stringify({ error: '未知子命令' }));
  }
}

// ============ exclude 子命令 ============

function cmdExclude() {
  const sub = process.argv[3];
  const syncConfig = readSyncConfig() || {};
  if (!Array.isArray(syncConfig.machineSpecific)) syncConfig.machineSpecific = [];

  switch (sub) {
    case 'add': {
      const filename = process.argv[4];
      if (!filename) {
        log('用法: node sync.js exclude add <filename>');
        console.log(JSON.stringify({ error: '请指定文件名' }));
        return;
      }
      if (!syncConfig.machineSpecific.includes(filename)) {
        syncConfig.machineSpecific.push(filename);
        saveSyncConfig(syncConfig);
        log(`已添加排除文件: "${filename}"`);
      } else {
        log(`"${filename}" 已在排除列表中`);
      }
      console.log(JSON.stringify({ success: true, machineSpecific: syncConfig.machineSpecific }));
      break;
    }
    case 'remove': {
      const filename = process.argv[4];
      if (!filename) {
        log('用法: node sync.js exclude remove <filename>');
        console.log(JSON.stringify({ error: '请指定文件名' }));
        return;
      }
      const idx = syncConfig.machineSpecific.indexOf(filename);
      if (idx !== -1) {
        syncConfig.machineSpecific.splice(idx, 1);
        saveSyncConfig(syncConfig);
        log(`已移除排除文件: "${filename}"`);
      } else {
        log(`"${filename}" 不在排除列表中`);
      }
      console.log(JSON.stringify({ success: true, machineSpecific: syncConfig.machineSpecific }));
      break;
    }
    case 'list': {
      const list = syncConfig.machineSpecific || [];
      if (list.length === 0) {
        log('当前没有排除文件');
      } else {
        log(`排除文件列表 (${list.length} 个):`);
        for (const f of list) {
          log(`  ${f}`);
        }
      }
      console.log(JSON.stringify({ machineSpecific: list }));
      break;
    }
    default:
      log('用法:');
      log('  node sync.js exclude add <filename>');
      log('  node sync.js exclude remove <filename>');
      log('  node sync.js exclude list');
      console.log(JSON.stringify({ error: '未知子命令' }));
  }
}

// ============ 修改 collect 命令以支持 --mode ============

async function cmdCollect() {
  const args = process.argv.slice(3);
  let mode = 'private';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && i + 1 < args.length) {
      const m = args[++i].toLowerCase();
      if (['private', 'public', 'inspect'].includes(m)) mode = m;
    }
  }

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

  // 如果 mode 不是 private，执行脱敏
  let output;
  if (mode === 'public' || mode === 'inspect') {
    output = sanitizeData(result, mode);
    log(`脱敏模式: ${mode}`);
  } else {
    output = result;
  }

  console.log(JSON.stringify(output, null, 2));
  log(`收集完成: ${globalMemories.length} 条全局, ${projectMemories.length} 条项目, ${skills.length} 个 skill`);
}

// ============ redact 命令 ============

function cmdRedact() {
  const sub = process.argv[3] || 'list';
  const cfg = readSyncConfig() || {};
  const rc = cfg.redact || { enabled: true, rules: [] };

  if (sub === 'list') {
    console.log(JSON.stringify(rc, null, 2));
  } else if (sub === 'off') {
    rc.enabled = false;
  } else if (sub === 'on') {
    rc.enabled = true;
  } else if (sub === 'add' && process.argv[4] && process.argv[5]) {
    rc.rules.push({ from: process.argv[4], to: process.argv[5] });
  } else {
    log('用法: node sync.js redact [list|on|off|add <pattern> <placeholder>]');
    return;
  }
  cfg.redact = rc;
  fs.writeFileSync(syncConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
  log('redact 规则已更新:', JSON.stringify(rc));
}


// ============ 主入口 ============

const action = process.argv[2];
(async () => {
  try {
    switch (action) {
      case 'init':    cmdInit(); break;
      case 'collect': await cmdCollect(); break;
      case 'write':   await cmdWrite(); break;
      case 'diff':    await cmdDiff(); break;
      case 'backup': {
        const repoIdx = process.argv.indexOf('--repo');
        if (repoIdx !== -1 && process.argv[repoIdx + 1]) {
          cmdBackupGit(process.argv[repoIdx + 1]);
        } else {
          cmdBackup();
        }
        break;
      }
      case 'restore': cmdRestore(); break;
      case 'deploy':  await cmdDeploy(); break;
      case 'verify':  cmdVerify(false); break;
      case 'sanitize':  await cmdSanitize(); break;
      case 'inspect':   await cmdInspect(); break;
      case 'pathpair':  cmdPathpair(); break;
      case 'exclude':   cmdExclude(); break;
      case 'redact':    cmdRedact(); break;
      default:
        console.log(`
用法:
  node sync.js init [--id <id>] [--desc "<desc>"]     初始化本机身份
  node sync.js collect [--mode public|private|inspect] 收集本机记忆
  node sync.js write                                   从 stdin 写入本地
  node sync.js diff                                    对比本地与远程快照
  node sync.js backup                                  备份 .reasonix 目录
  node sync.js backup --repo <url>                     备份并 git push 到远程仓库
  node sync.js restore <path>                          从备份恢复
  node sync.js deploy --repo <url> [--at <ts>] [-y]   从远程仓库部署
  node sync.js verify                                  验证本地数据完整性

脱敏管理:
  node sync.js sanitize < input.json > output.json    执行脱敏
  node sync.js inspect < input.json                    预览脱敏效果
  node sync.js pathpair add|remove|list                管理路径映射
  node sync.js redact list|on|off|add <pat> <ph>    管理脱敏规则
  node sync.js exclude add|remove|list                 管理排除文件列表
`);
    }
  } catch (e) {
    log(`执行失败: ${e.message}`);
    console.log(JSON.stringify({ success: false, error: e.message }));
    process.exit(1);
  }
})();
