const ds = require('../../utils/dataService.js');
const app = getApp();

Page({
  data: {
    channels: ['工具网站', '热门项目', '经验分享'],
    ch: '经验分享',
    title: '',
    body: '',
    tags: '',
    link: '',
    submitting: false
  },

  onPick(e) {
    this.setData({ ch: e.currentTarget.dataset.c });
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.f]: e.detail.value });
  },

  onSubmit() {
    const { ch, title, body, tags, link } = this.data;
    if (!title.trim() || !body.trim()) {
      wx.showToast({ title: '请填写标题和正文', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    ds.addPost({
      ch,
      title: title.trim(),
      body: body.trim(),
      tags: tags.trim().split(/\s+/).filter(Boolean),
      link: link.trim()
    }).then(() => {
      this.setData({ title: '', body: '', tags: '', link: '', submitting: false });
      app.globalData.pendingChannel = ch;
      wx.switchTab({ url: '/pages/index/index' });
      wx.showToast({ title: '发布成功', icon: 'success' });
    }).catch(() => {
      this.setData({ submitting: false });
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    });
  }
});
