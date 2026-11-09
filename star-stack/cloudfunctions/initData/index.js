const cloud = require('wx-server-sdk');
const seed = require('./seed.json');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 幂等：集合不存在则创建；按标题补齐种子里缺失的帖子。
// 单次调用最多导入 BATCH 条（云函数默认 3s 超时），小程序冷启动会连续调用直到 more=false。
const BATCH = 8;

exports.main = async () => {
  for (const name of ['posts', 'comments', 'userLikes']) {
    try { await db.createCollection(name); } catch (e) { /* 已存在 */ }
  }
  // 清理自动化验证写入的测试帖
  const junk = await db.collection('posts')
    .where({ title: db.RegExp({ regexp: '^自动化验证帖' }) }).get();
  for (const p of junk.data) {
    await db.collection('posts').doc(p._id).remove();
    await db.collection('comments').where({ postId: p._id }).remove();
  }

  const have = await db.collection('posts').field({ title: true, link: true }).limit(1000).get();
  const titles = new Set(have.data.map(p => p.title));
  const missing = seed.posts.filter(p => !titles.has(p.title));

  const now = Date.now();
  let added = 0, comments = 0;
  for (const p of missing.slice(0, BATCH)) {
    const doc = {
      ...p, liked: undefined,
      createdAt: now - (p.hours || 1) * 3600 * 1000,
      authorId: 'system'
    };
    const r = await db.collection('posts').add({ data: doc });
    added++;
    for (const c of seed.comments.default) {
      await db.collection('comments').add({
        data: { postId: r._id, nick: c.n, content: c.c, createdAt: now }
      });
      comments++;
    }
  }
  const total = await db.collection('posts').count();
  return { added, comments, posts: total.total, more: missing.length > BATCH,
    cleaned: junk.data.length, linked: await syncLinks(have.data) };
};

// 种子数据里的官网网址变化时同步到已有帖子（复用已查到的列表，幂等）
async function syncLinks(docs) {
  const byTitle = {};
  docs.forEach(d => { byTitle[d.title] = d; });
  let n = 0;
  for (const p of seed.posts) {
    const doc = byTitle[p.title];
    if (doc && (doc.link || '') !== (p.link || '')) {
      await db.collection('posts').doc(doc._id).update({ data: { link: p.link || '' } });
      n++;
    }
  }
  return n;
}
