// 数据服务门面：统一异步接口，按 config.useCloud 切换本地/云端
const config = require('../config.js');
const local = require('./localStore.js');
const cloud = require('./cloudStore.js');

const impl = config.useCloud ? cloud : local;
const p = fn => (...args) => Promise.resolve(fn.apply(impl, args));

module.exports = {
  list: p(impl.list),
  get: p(impl.get),
  rankBy: p(impl.rankBy),
  toggleLike: p(impl.toggleLike),
  toggleFav: p(impl.toggleFav),
  isFav: p(impl.isFav),
  addPost: p(impl.addPost),
  commentsFor: p(impl.commentsFor)
};
