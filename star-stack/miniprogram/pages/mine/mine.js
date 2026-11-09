const iconUrl = require('../../utils/icons.js');
const app = getApp();
const G = '#999999';

Page({
  data: {
    icons: {
      post: iconUrl('mdi/text-box-outline', G),
      star: iconUrl('mdi/star-outline', G),
      history: iconUrl('mdi/history', G),
      cog: iconUrl('mdi/cog-outline', G),
      feedback: iconUrl('mdi/message-text-outline', G),
      about: iconUrl('mdi/information-outline', G),
      plus: iconUrl('mdi/plus', '#07C160')
    }
  },

  onShow() {
    const bar = this.getTabBar && this.getTabBar();
    if (bar) bar.setData({ selected: 2 });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goPosts() {
    app.globalData.pendingChannel = '经验分享';
    wx.switchTab({ url: '/pages/index/index' });
  },

  toast(e) {
    wx.showToast({ title: e.currentTarget.dataset.t, icon: 'none' });
  }
});
