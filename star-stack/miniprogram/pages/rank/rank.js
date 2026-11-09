const ds = require('../../utils/dataService.js');
const iconUrl = require('../../utils/icons.js');
const ghAvatar = require('../../utils/avatar.js');
const GRADS = ['#07C160', '#5b6ef5', '#f59e0b', '#e6573c', '#0ea5e9', '#8f6ef5'];
const app = getApp();

Page({
  data: {
    tabs: ['项目飙升榜', '工具热度榜', '经验热帖榜'],
    tab: '项目飙升榜',
    rows: [],
    trophyIcon: iconUrl('mdi/trophy', '#f7b500'),
    toolIcon: iconUrl('mdi/toolbox-outline', '#f7b500')
  },

  onShow() {
    this.load();
    const bar = this.getTabBar && this.getTabBar();
    if (bar) bar.setData({ selected: 1 });
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.t });
    this.load();
  },

  load() {
    const { tab } = this.data;
    const ch = tab === '项目飙升榜' ? '热门项目' : tab === '工具热度榜' ? '工具网站' : '经验分享';
    ds.rankBy(ch).then(posts => {
      if (ch !== '热门项目') posts.sort((a, b) => b.likes - a.likes);
      const rows = posts.map((p, i) => {
        const base = { id: p._id, top: i < 3, rank: i + 1 };
        if (ch === '热门项目') {
          return {
            ...base,
            title: p.title.split(/[—：]/)[0].trim(),
            sub: (p.stars ? p.stars + ' stars · ' : '') + p.views + ' 人在看',
            tail: '本周 ' + (p.weekly || '+' + (p.likes / 100).toFixed(1) + 'k'),
            avatar: ghAvatar.resolve(p),
            logo: p.title[0], bg: GRADS[(p.id || 0) % GRADS.length] || GRADS[0]
          };
        }
        if (ch === '工具网站') {
          return {
            ...base,
            title: p.title.split(/[—–]/)[0].trim(),
            sub: (p.title.split(/[—–]/)[1] || '').trim() || p.tags.join(' · '),
            tail: '赞 ' + p.likes + '\n收藏 ' + Math.round(p.likes * 0.6)
          };
        }
        return {
          ...base,
          title: p.title,
          sub: p.author + ' · 赞 ' + p.likes + ' · 阅读 ' + p.views,
          tail: '热度\n' + Math.round(p.likes + p.views / 10)
        };
      });
      this.setData({ rows });
    }).catch(err => {
      console.error('[星栈] 榜单加载失败:', err);
      wx.showToast({ title: String(err.errMsg || err.message || '榜单加载失败'), icon: 'none' });
    });
  },

  onTap(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  }
});
