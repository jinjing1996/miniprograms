const ds = require('../../utils/dataService.js');
const iconUrl = require('../../utils/icons.js');
const PAGE = 20;
const app = getApp();

Page({
  data: {
    channels: ['推荐', '工具网站', '热门项目', '经验分享'],
    channel: '推荐',
    list: [],
    noMore: false,
    loadingMore: false,
    err: '',
    searchIcon: iconUrl('mdi/magnify', '#999999')
  },

  onShow() {
    if (app.globalData.pendingChannel) {
      this.setData({ channel: app.globalData.pendingChannel });
      app.globalData.pendingChannel = '';
    }
    this.load();
    const bar = this.getTabBar && this.getTabBar();
    if (bar) bar.setData({ selected: 0 });
  },

  load() {
    this.try = 0;
    this.skip = 0;
    this.fetch(true);
  },

  fetch(reset) {
    ds.list(this.data.channel, this.skip)
      .then(page => this.applyPage(page, reset))
      .catch(err => this.applyPage([], reset, err));
  },

  // 冷启动时 initData 可能仍在分批写库，空结果延迟补拉
  applyPage(page, reset, err) {
    const list = reset ? page : this.data.list.concat(page);
    this.setData({
      list,
      noMore: page.length < PAGE,
      loadingMore: false,
      err: list.length ? '' : (err ? String(err.errMsg || err.message || err) : '')
    });
    if (reset && !list.length && !err && this.try < 3) {
      this.try += 1;
      setTimeout(() => this.fetch(true), 2000);
    }
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loadingMore) return;
    this.skip += PAGE;
    this.setData({ loadingMore: true });
    this.fetch(false);
  },

  onTab(e) {
    this.setData({ channel: e.currentTarget.dataset.c });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    this.load();
  },

  onSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },

  onRetry() {
    this.load();
  },

  onLike(e) {
    const id = e.detail.id;
    ds.toggleLike(id).then(r => {
      const i = this.data.list.findIndex(p => p._id === id);
      if (i < 0) return;
      this.setData({ [`list[${i}].liked`]: !!r.liked, [`list[${i}].likes`]: r.likes });
    }).catch(() => wx.showToast({ title: '网络异常，请重试', icon: 'none' }));
  },

  onPullDownRefresh() {
    this.load();
    wx.stopPullDownRefresh();
  }
});
