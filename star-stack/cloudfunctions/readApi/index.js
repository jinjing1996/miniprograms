const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 按当前用户 openid 标注 liked（点赞是用户级状态，不能存在帖子文档上）
async function withLiked(posts) {
  const { OPENID } = cloud.getWXContext();
  if (!posts.length || !OPENID) return posts;
  const r = await db.collection('userLikes')
    .where({ openid: OPENID, postId: _.in(posts.map(p => p._id)) })
    .limit(100).get();
  const mine = new Set(r.data.map(x => x.postId));
  return posts.map(p => ({ ...p, liked: mine.has(p._id) }));
}

// 统一读接口：云函数以管理员权限查询，无需配置集合读权限
exports.main = async (event) => {
  const { action, channel, id, ch, postId, skip } = event;

  if (action === 'list') {
    let q = db.collection('posts');
    if (channel && channel !== '推荐') q = q.where({ ch: channel });
    const r = await q.orderBy('createdAt', 'desc').skip(Number(skip) || 0).limit(20).get();
    return withLiked(r.data);
  }
  if (action === 'get') {
    const r = await db.collection('posts').doc(id).get();
    const one = await withLiked([r.data]);
    return one[0];
  }
  if (action === 'rank') {
    const r = await db.collection('posts').where({ ch })
      .orderBy('likes', 'desc').limit(20).get();
    return withLiked(r.data);
  }
  if (action === 'comments') {
    const r = await db.collection('comments').where({ postId })
      .orderBy('createdAt', 'asc').limit(50).get();
    return r.data.map(c => ({ n: c.nick, c: c.content }));
  }
  return { error: 'unknown action' };
};
