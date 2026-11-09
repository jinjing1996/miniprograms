const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { ch, title, body, tags, link } = event;

  if (!title || !body || !['工具网站', '热门项目', '经验分享'].includes(ch)) {
    return { error: '参数不合法' };
  }
  // 内容安全：上线前建议启用（后台需开通权限）
  // await cloud.openapi.security.msgSecCheck({ content: title + '\n' + body });

  const doc = {
    ch, title: String(title).slice(0, 60), body: String(body).slice(0, 5000),
    desc: body.length > 60 ? body.slice(0, 60) + '…' : body,
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    link: normLink(link),
    likes: 0, views: 1, author: '星标开发者', authorId: OPENID,
    likedBy: [], createdAt: Date.now()
  };
  const r = await db.collection('posts').add({ data: doc });
  return { _id: r._id, ...doc };
};

// 官网网址统一存裸域名（小程序内不能直接跳外链，详情页展示 + 一键复制）
function normLink(raw) {
  if (!raw) return '';
  const s = String(raw).trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const i = s.indexOf('/');
  const host = (i < 0 ? s : s.slice(0, i)).toLowerCase();
  const rest = i < 0 ? '' : s.slice(i);
  const out = host + rest;
  if (!/^[\w-]+(\.[\w-]+)+(\/[\w./?%&=-]*)?$/.test(out) || out.length > 200) return '';
  return out;
}
