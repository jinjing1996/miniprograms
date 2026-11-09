// 本地 mock 实现：Storage 持久化（点赞/收藏/发帖重启不丢）
const seed = require('../data/posts.js');

const KEY = 'ss_posts_v1';
const FAV_KEY = 'ss_favs_v1';

function ensure() {
  if (!wx.getStorageSync(KEY)) {
    const now = Date.now();
    wx.setStorageSync(KEY, seed.posts.map(p => ({
      ...p, createdAt: now - p.hours * 3600 * 1000
    })));
  }
}

function withId(p) {
  return { ...p, _id: String(p.id) };
}

function save(list) {
  wx.setStorageSync(KEY, list);
}

function list(channel, skip) {
  ensure();
  const all = wx.getStorageSync(KEY).map(withId);
  const filtered = (channel && channel !== '推荐') ? all.filter(p => p.ch === channel) : all;
  return filtered.slice(skip || 0, (skip || 0) + 20);
}

function get(id) {
  return list().find(p => p._id === String(id)) || null;
}

function rankBy(ch) {
  return list(ch);
}

function toggleLike(id) {
  ensure();
  const all = wx.getStorageSync(KEY);
  const p = all.find(x => String(x.id) === String(id));
  p.liked = !p.liked;
  p.likes += p.liked ? 1 : -1;
  save(all);
  return withId(p);
}

function toggleFav(id) {
  const favs = wx.getStorageSync(FAV_KEY) || [];
  const k = String(id);
  const i = favs.indexOf(k);
  i >= 0 ? favs.splice(i, 1) : favs.push(k);
  wx.setStorageSync(FAV_KEY, favs);
  return i < 0;
}

function isFav(id) {
  return (wx.getStorageSync(FAV_KEY) || []).indexOf(String(id)) >= 0;
}

function addPost({ ch, title, body, tags, link }) {
  ensure();
  const all = wx.getStorageSync(KEY);
  const p = {
    id: Date.now(), ch, title,
    desc: body.length > 60 ? body.slice(0, 60) + '…' : body,
    tags: tags && tags.length ? tags : ['新帖'],
    link: link || '',
    likes: 0, views: 1, author: '星标开发者', hours: 0, liked: false, body,
    createdAt: Date.now()
  };
  all.unshift(p);
  save(all);
  return withId(p);
}

function commentsFor() {
  return seed.comments.default;
}

module.exports = { list, get, rankBy, toggleLike, toggleFav, isFav, addPost, commentsFor };
