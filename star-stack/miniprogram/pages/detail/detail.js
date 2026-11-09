const ds = require('../../utils/dataService.js');
const iconUrl = require('../../utils/icons.js');
const ghAvatar = require('../../utils/avatar.js');
const GRADS = ['#07C160', '#5b6ef5', '#f59e0b', '#e6573c', '#0ea5e9', '#8f6ef5'];
const BADGE = { '热门项目': 'hot', '经验分享': 'vibe', '工具网站': '' };

function heartIcon(liked) {
  return iconUrl(liked ? 'mdi/heart' : 'mdi/heart-outline', liked ? '#FA5151' : '#999999');
}
function starIcon(fav) {
  return iconUrl(fav ? 'mdi/star' : 'mdi/star-outline', fav ? '#f7b500' : '#999999');
}

Page({
  data: { post: null, badge: '', comments: [], liked: false, fav: false },

  onLoad(options) {
    Promise.all([ds.get(options.id), ds.commentsFor(options.id), ds.isFav(options.id)])
      .then(([post, comments, fav]) => {
        this.post = post;
        this.setData({
          post,
          badge: BADGE[post.ch] || '',
          avatarUrl: ghAvatar.resolve(post),
          avatarBg: GRADS[String(post._id).charCodeAt(String(post._id).length - 1) % GRADS.length],
          comments: comments.map(c => ({
            ...c, bg: GRADS[c.n.charCodeAt(0) % GRADS.length]
          })),
          liked: !!post.liked,
          fav,
          heart: heartIcon(!!post.liked),
          star: starIcon(fav),
          linkIcon: iconUrl('mdi/web', '#07C160')
        });
        wx.setNavigationBarTitle({ title: post.ch });
      })
      .catch(err => {
        console.error('[星栈] 帖子加载失败:', err);
        wx.showToast({ title: String(err.errMsg || err.message || '帖子加载失败'), icon: 'none' });
      });
  },

  onCopyLink() {
    wx.setClipboardData({
      data: 'https://' + this.data.post.link,
      success: () => wx.showToast({ title: '链接已复制，浏览器打开', icon: 'none' })
    });
  },

  onLike() {
    ds.toggleLike(this.post._id).then(r => {
      this.setData({
        liked: r.liked,
        'post.likes': r.likes,
        'post.liked': r.liked,
        heart: heartIcon(r.liked)
      });
    }).catch(() => {
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  },

  onFav() {
    ds.toggleFav(this.post._id).then(fav => {
      this.setData({ fav, star: starIcon(fav) });
      wx.showToast({ title: fav ? '已加入收藏' : '已取消收藏', icon: 'none' });
    });
  },

  onComment() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' });
  }
});
