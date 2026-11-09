// 接收小程序端传来的头像 base64，上传到云存储 avatars/，并把 fileID 回写到对应帖子。
// event: { items: [{ owner, ext, base64 }] }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ALLOWED_EXT = { png: 'png', jpg: 'jpg', jpeg: 'jpg', gif: 'gif', webp: 'webp', svg: 'svg' };
const MAX_BYTES = 200 * 1024;

const safeOwner = o => String(o).toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function one({ owner, ext, base64 }) {
  const o = safeOwner(owner);
  if (!o) return { owner, error: 'bad owner' };
  const type = ALLOWED_EXT[String(ext || '').toLowerCase()];
  if (!type) return { owner: o, error: 'bad ext ' + ext };

  const buf = Buffer.from(String(base64), 'base64');
  if (!buf.length) return { owner: o, error: 'empty file' };
  if (buf.length > MAX_BYTES) return { owner: o, error: `too big ${buf.length}B` };

  const uploaded = await cloud.uploadFile({
    cloudPath: `avatars/${o}.${type}`,
    fileContent: buf
  });
  const fileID = uploaded.fileID;

  // 同一 owner 可能有多条帖子，全部回写
  const res = await db.collection('posts')
    .where({ link: db.RegExp({ regexp: '^github\\.com/' + reEscape(o) + '(/|$)', options: 'i' }) })
    .update({ data: { avatar: fileID } });

  return { owner: o, fileID, posts: res.stats ? res.stats.updated : res.updated, bytes: buf.length };
}

exports.main = async (event) => {
  const items = Array.isArray(event.items) ? event.items : [];
  if (!items.length) return { error: 'no items' };
  const results = [];
  for (const item of items) {
    try {
      results.push(await one(item));
    } catch (e) {
      results.push({ owner: item && item.owner, error: String(e && e.message || e) });
    }
  }
  return { results };
};
