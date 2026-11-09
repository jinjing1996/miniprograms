// 抓取帖子作者的 GitHub 头像到本地 assets/avatars/，供 upload-avatars.js 上传云存储。
//
//   node .verify/fetch-avatars.js                      # 直连
//   node .verify/fetch-avatars.js --proxy=127.0.0.1:7890   # 走本地代理（开梯子后）
//   node .verify/fetch-avatars.js --force              # 重抓已存在的
//
// 抓不到也可以手动把图片存成 assets/avatars/{owner}.png|jpg，manifest 会在上传时按目录重建。
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'avatars');
const SEED = path.join(ROOT, 'cloudfunctions', 'initData', 'seed.json');
const GH = /^github\.com\/([\w.-]+)/i;

const arg = name => {
  const hit = process.argv.find(a => a.startsWith('--' + name));
  if (!hit) return '';
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};

const proxy = (() => {
  const raw = arg('proxy') || process.env.HTTPS_PROXY || process.env.https_proxy || '';
  if (!raw) return '';
  return /^https?:\/\//.test(raw) ? raw : 'http://' + raw;
})();
const force = !!arg('force');
const TIMEOUT_MS = 30000;

// 同一 owner 依次试这些源，第一个拿到合法图片的胜出。
// 实测本机网络：github.com 直连超时，avatars.githubusercontent.com 与 unavatar.io 可达，
// 所以把 avatars.githubusercontent.com 放第一个，github.com 只兜底。
const sourcesFor = owner => [
  ['gh-avatars', `https://avatars.githubusercontent.com/${owner}?v=4&s=80`],
  ['unavatar', `https://unavatar.io/github/${owner}?width=80&fallback=false`],
  ['github', `https://github.com/${owner}.png?size=80`]
];

function ownersFromSeed() {
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const set = new Set();
  for (const p of seed.posts) {
    const m = GH.exec(String(p.link || '').trim().replace(/^https?:\/\//, ''));
    if (m) set.add(m[1].toLowerCase());
  }
  const only = arg('only');
  if (!only) return [...set];
  const want = String(only).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return [...set].filter(o => want.includes(o));
}

function sniff(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.length > 6 && buf.slice(0, 3).toString() === 'GIF') return 'gif';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  const head = buf.slice(0, 200).toString('utf8').trim();
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'svg';
  return '';
}

function curl(url, dest) {
  const args = ['-sS', '-L', '--fail', '--max-time', String(Math.floor(TIMEOUT_MS / 1000)), '-A', 'starstack-avatar/1.0'];
  if (proxy) args.push('-x', proxy);
  args.push('-o', dest, url);
  return new Promise(res => {
    const child = spawn('curl', args, { windowsHide: true });
    let err = '';
    child.stderr.on('data', d => err += d);
    const timer = setTimeout(() => { child.kill(); res({ ok: false, reason: 'timeout' }); }, TIMEOUT_MS + 3000);
    child.on('error', e => { clearTimeout(timer); res({ ok: false, reason: 'spawn ' + e.code }); });
    child.on('close', code => {
      clearTimeout(timer);
      res(code === 0 ? { ok: true } : { ok: false, reason: 'curl ' + code + ' ' + err.trim().split('\n').pop() });
    });
  });
}

async function fetchOne(owner) {
  const tried = [];
  for (const [src, url] of sourcesFor(owner)) {
    const tmp = path.join(OUT_DIR, `.tmp-${owner}`);
    const got = await curl(url, tmp);
    if (!got.ok) {
      tried.push(`${src}: ${got.reason}`);
      try { fs.unlinkSync(tmp); } catch (e) { /* 没落盘 */ }
      continue;
    }
    const buf = fs.readFileSync(tmp);
    const ext = sniff(buf);
    if (!ext || buf.length < 100) {
      tried.push(`${src}: 非图片响应 (${buf.length}B)`);
      fs.unlinkSync(tmp);
      continue;
    }
    for (const stale of fs.readdirSync(OUT_DIR)) {
      if (stale.startsWith(owner + '.')) fs.unlinkSync(path.join(OUT_DIR, stale));
    }
    const file = `${owner}.${ext}`;
    fs.renameSync(tmp, path.join(OUT_DIR, file));
    return { owner, file, bytes: buf.length, type: ext, source: src };
  }
  return { owner, error: tried.join(' | ') };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const owners = ownersFromSeed();
  console.log(`待抓取 owner: ${owners.length} 个${proxy ? '，代理 ' + proxy : '，未使用代理'}`);

  const manifest = {};
  const done = [];
  const failed = [];
  for (const owner of owners) {
    const existing = fs.readdirSync(OUT_DIR).find(f => f.toLowerCase().startsWith(owner + '.'));
    if (existing && !force) {
      const buf = fs.readFileSync(path.join(OUT_DIR, existing));
      const type = sniff(buf);
      if (type) {
        manifest[owner] = { file: existing, bytes: buf.length, type, source: 'preexisting' };
        done.push(owner);
        console.log(`= ${owner} 已存在，跳过`);
        continue;
      }
    }
    const r = await fetchOne(owner);
    if (r.error) { failed.push(owner); console.log(`x ${owner}  ${r.error}`); }
    else { manifest[owner] = r; done.push(owner); console.log(`+ ${owner} -> ${r.file} (${r.bytes}B, ${r.source})`); }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 1), 'utf8');
  console.log(`\n成功 ${done.length} / ${owners.length}，失败 ${failed.length}`);
  if (failed.length) {
    console.log('失败清单: ' + failed.join(', '));
    console.log(proxy
      ? '代理已启用但仍失败：多半是代理节点不通 github，换个节点或直接手动存图。'
      : '本机直连 github.com 是超时的：开代理后加 --proxy=127.0.0.1:<端口> 重跑，或手动把图片存成 assets/avatars/{owner}.png。');
  }
})();
