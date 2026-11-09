const iconUrl = require('../../utils/icons.js');
const ghAvatar = require('../../utils/avatar.js');
const GRADS = ['#07C160', '#5b6ef5', '#f59e0b', '#e6573c', '#0ea5e9', '#8f6ef5'];
const BADGE = { '热门项目': 'hot', '经验分享': 'vibe', '工具网站': '' };

Component({
  properties: {
    post: { type: Object, observer(p) {
      if (!p) return;
      const key = String(p._id || p.id);
      this.setData({
        badge: BADGE[p.ch] || '',
        avatarBg: GRADS[key.charCodeAt(key.length - 1) % GRADS.length],
        avatarUrl: ghAvatar.resolve(p),
        shortName: p.title.split(/[—：]/)[0].trim(),
        heart: iconUrl(p.liked ? 'mdi/heart' : 'mdi/heart-outline', p.liked ? '#FA5151' : '#999999'),
        chat: iconUrl('mdi/chat-outline', '#999999'),
        star: iconUrl('mdi/star-outline', '#999999'),
        starFill: iconUrl('mdi/star', '#999999'),
        fire: iconUrl('mdi/fire', '#999999'),
        commentCnt: (p.likes / 47 | 0) + 3
      });
    } }
  },
  data: {},
  methods: {
    onTap() {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + this.data.post._id });
    },
    onLike() {
      this.triggerEvent('like', { id: this.data.post._id });
    },
    onFav() {
      wx.showToast({ title: '已加入收藏', icon: 'none' });
    }
  }
});
