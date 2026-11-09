// 云开发实现：全部读写走云函数（管理员权限，无需配置集合读权限）
// 集合：posts、comments、userLikes（由 initData 自动创建）
function callFn(name, data) {
  return wx.cloud.callFunction({ name, data }).then(r => r.result);
}

function list(channel, skip) {
  return callFn('readApi', { action: 'list', channel, skip: skip || 0 });
}

function get(id) {
  return callFn('readApi', { action: 'get', id });
}

function rankBy(ch) {
  return callFn('readApi', { action: 'rank', ch });
}

// 返回 { liked, likes }
function toggleLike(id) {
  return callFn('toggleLike', { postId: id });
}

function addPost({ ch, title, body, tags, link }) {
  return callFn('addPost', { ch, title, body, tags, link });
}

function commentsFor(id) {
  return callFn('readApi', { action: 'comments', postId: id });
}

// TODO 收藏也迁云端（集合 userFavs）；原型阶段先存本地
const FAV_KEY = 'ss_favs_v1';

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

module.exports = { list, get, rankBy, toggleLike, toggleFav, isFav, addPost, commentsFor };
