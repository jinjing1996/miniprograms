const TABS = [
  { pagePath: '/pages/index/index', text: '首页', icon: 'mdi/home' },
  { pagePath: '/pages/rank/rank', text: '榜单', icon: 'mdi/trophy-outline' },
  { pagePath: '/pages/mine/mine', text: '我的', icon: 'mdi/account-circle-outline' }
];
const iconUrl = require('../utils/icons.js');

Component({
  data: { selected: 0, tabs: [] },
  lifetimes: {
    attached() {
      this.setData({
        tabs: TABS.map(t => ({
          ...t,
          gray: iconUrl(t.icon, '#999999'),
          green: iconUrl(t.icon, '#07C160')
        }))
      });
    }
  },
  methods: {
    onTap(e) {
      const i = e.currentTarget.dataset.i;
      wx.switchTab({ url: TABS[i].pagePath });
      this.setData({ selected: i });
    }
  }
});
