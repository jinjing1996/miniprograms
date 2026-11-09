// 把 assets/avatars/ 里的头像经小程序端上传到云存储并回写 posts.avatar。
// 需先在开发者工具里开自动化端口：
//   cli.bat auto --project D:\Work\cursorProject\star-stack --auto-port 9421
//
//   node .verify/upload-avatars.js --limit=2    # 先试传 2 个
//   node .verify/upload-avatars.js --only=voltagent   # 只传指定 owner（逗号分隔）
//   node .verify/upload-avatars.js              # 全量
//   node .verify/upload-avatars.js --check      # 只查库里有没有 avatar
const fs = require('fs');
const path = require('path');
const automator = require('miniprogram-automator');

const DIR = path.join(__dirname, '..', 'assets', 'avatars');
const AUTO_PORT = 9421;
const has = name => process.argv.includes('--' + name);
const numOf = (name, dflt) => {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  return hit ? Number(hit.split('=')[1]) : dflt;
};
const listOf = name => {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.split('=')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : null;
};

function loadLocal() {
  // 以目录为准：manifest 只在 fetch 脚本跑完时才落盘，中途中断会留旧数据
  const files = fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
    : [];
  return files.map(f => ({ owner: f.replace(/\.[^.]+$/, '').toLowerCase(), file: f }));
}

const check = async mp => {
  const r = await mp.evaluate(() => new Promise(async resolve => {
    const all = [];
    for (let skip = 0; skip < 200; skip += 20) {
      const page = await new Promise(res => {
        wx.cloud.callFunction({ name: 'readApi', data: { action: 'list', channel: '热门项目', skip } })
          .then(x => res(x.result || [])).catch(e => res({ error: e.errMsg }));
      });
      if (page.error) return resolve({ error: page.error });
      all.push(...page.map(p => ({ t: p.title.slice(0, 20), link: p.link, avatar: p.avatar || '' })));
      if (page.length < 20) break;
    }
    resolve(all);
  }));
  if (r.error) return console.log('readApi 失败:', r.error);
  const gh = r.filter(x => /^github\.com\//i.test(x.link));
  const withAvatar = r.filter(x => x.avatar);
  console.log(`热门项目共 ${r.length} 条，其中 GitHub 链接 ${gh.length} 条，已落云头像 ${withAvatar.length} 条`);
  const missing = gh.filter(x => !x.avatar).map(x => (x.link.split('/')[1] || '').toLowerCase());
  console.log('仍缺头像的 owner:', missing.length ? [...new Set(missing)].join(', ') : '(无)');
};

(async () => {
  const mp = await automator.connect({ wsEndpoint: `ws://localhost:${AUTO_PORT}` });

  if (has('check')) { await check(mp); process.exit(0); }

  let locals = loadLocal();
  const only = listOf('only');
  if (only) {
    const missing = only.filter(o => !locals.some(x => x.owner === o));
    if (missing.length) console.log('本地缺这些 owner 的图片，先跑 fetch-avatars.js --only=' + missing.join(','));
    locals = locals.filter(x => only.includes(x.owner));
  }
  if (!locals.length) { console.log('assets/avatars 下没有图片，先跑 fetch-avatars.js'); process.exit(1); }

  const limit = numOf('limit', locals.length);
  const queue = locals.slice(0, limit);
  console.log(`本地头像 ${locals.length} 个，本次上传 ${queue.length} 个`);

  // 云函数默认超时 3s（CLI 无法改），一次只传一张：上传 + 回写 稳在超时内，
  // 且云存储同 cloudPath 覆盖，失败的 owner 直接重跑即可
  const MAX_BATCH_BYTES = 40 * 1024;
  const MAX_BATCH_ITEMS = 1;
  const batches = [];
  let cur = [], curBytes = 0;
  for (const item of queue) {
    const buf = fs.readFileSync(path.join(DIR, item.file));
    const b64 = buf.toString('base64');
    if (cur.length && (cur.length >= MAX_BATCH_ITEMS || curBytes + b64.length > MAX_BATCH_BYTES)) {
      batches.push(cur); cur = []; curBytes = 0;
    }
    cur.push({ owner: item.owner, ext: item.file.split('.').pop(), base64: b64 });
    curBytes += b64.length;
  }
  if (cur.length) batches.push(cur);
  console.log(`分 ${batches.length} 批调用 uploadAvatars`);

  const ok = [], bad = [];
  for (let i = 0; i < batches.length; i++) {
    const res = await mp.evaluate(items => new Promise(resolve => {
      wx.cloud.callFunction({ name: 'uploadAvatars', data: { items } })
        .then(r => resolve(r.result))
        .catch(e => resolve({ error: e.errMsg }));
    }), batches[i]);

    if (!res || res.error) {
      batches[i].forEach(x => bad.push(x.owner + ': ' + (res && res.error)));
      console.log(`批 ${i + 1} 失败: ${res && res.error}`);
      continue;
    }
    for (const r of res.results) {
      if (r.error) { bad.push(r.owner + ': ' + r.error); console.log('x', r.owner, r.error); }
      else { ok.push(r.owner); console.log(`+ ${r.owner} -> ${r.fileID} (回写 ${r.posts} 条)`); }
    }
  }

  console.log(`\n上传成功 ${ok.length}，失败 ${bad.length}`);
  if (bad.length) console.log('失败: ' + bad.join(' | '));
  console.log('--- 库内校验 ---');
  await check(mp);
  process.exit(0);
})().catch(e => { console.error('UPLOAD FAILED:', e); process.exit(1); });
