const config = require('./config.js');

// 种子内容有变动时递增，冷启动会把种子里缺失的帖子补进云端
const SEED_VER = 4;

App({
  globalData: {
    pendingChannel: ''
  },
  onLaunch() {
    if (config.useCloud) {
      wx.cloud.init({ env: config.env, traceUser: true });
      if (wx.getStorageSync('ss_inited') !== SEED_VER) this.syncSeed(0);
    }
  },

  // 云函数单次最多导入一批，循环调用直到没有缺口
  syncSeed(round) {
    wx.cloud.callFunction({ name: 'initData' })
      .then(res => {
        const r = res.result || {};
        console.log('[星栈] initData:', r);
        if (r.more && round < 10) return this.syncSeed(round + 1);
        if (!r.more) wx.setStorageSync('ss_inited', SEED_VER);
      })
      .catch(err => console.error('[星栈] initData 失败:', err));
  }
});
