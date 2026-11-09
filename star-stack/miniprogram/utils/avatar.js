// 帖子头像：优先用云端已落库的 fileID，其次 GitHub 直链，最后由调用方回落字母头像
const GH = /^github\.com\/([\w.-]+)/i;

// 由 post.link 推导 GitHub 头像地址，非 GitHub 链接返回 ''
function fromLink(link) {
  if (!link) return '';
  const m = GH.exec(String(link).trim().replace(/^https?:\/\//, ''));
  return m ? 'https://github.com/' + m[1] + '.png?size=80' : '';
}

// 库里存的是云上传后的 cloud:// fileID（真机免配合法域名）；
// 没回写过的帖子仍会走 GitHub 直链，本机网络下取不到会静默回落字母头像。
function resolve(post) {
  if (!post) return '';
  return post.avatar || fromLink(post.link);
}

module.exports = { fromLink, resolve };
