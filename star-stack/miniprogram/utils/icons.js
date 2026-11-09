const BASE = 'https://api.iconify.design/';

// 开发者工具需在详情设置勾选「不校验合法域名」；上线前把 api.iconify.design 加入 request/downloadFile 白名单，或改存本地
module.exports = function iconUrl(name, color) {
  return BASE + name + '.svg?color=' + encodeURIComponent(color || '#333333');
};
