const automator = require('miniprogram-automator');
const ghAvatar = require('../miniprogram/utils/avatar.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const INDEX = 'pages/index/index';
const DETAIL = 'pages/detail/detail';
const RANK = 'pages/rank/rank';

automator.connect({ wsEndpoint: 'ws://localhost:9421' }).then(async mp => {
  await mp.evaluate(() => { wx.reLaunch({ url: '/pages/index/index' }); });
  await sleep(2000);

  // tabBar 页面各有页面栈，currentPage() 会返回错误的页面，统一按路由读数据 / 调方法
  // 注意：不能用 JSON.parse(JSON.stringify(...)) 回传，当前 automator/IDE 组合下
  // evaluate 返回 JSON.parse 的结果会抛 "Function has non-object prototype"，浅拷贝即可
  const read = (route) => mp.evaluate((r) => {
    const ps = getCurrentPages();
    const p = ps.filter(x => x.route === r).pop() || ps[ps.length - 1];
    return p ? { ...p.data } : null;
  }, route);
  const waitFor = async (route, pick, tries = 12) => {
    for (let i = 0; i < tries; i++) {
      const v = pick(await read(route).catch(() => null));
      if (v) return v;
      await sleep(1200);
    }
    return null;
  };
  const callMethod = (route, fn) => mp.evaluate(([r, f]) => {
    const ps = getCurrentPages();
    const p = ps.filter(x => x.route === r).pop();
    if (p && typeof p[f] === 'function') { p[f](); return true; }
    return false;
  }, [route, fn]);

  await mp.evaluate(() => { wx.switchTab({ url: '/pages/rank/rank' }); });
  await sleep(1500);
  await mp.evaluate(() => { wx.switchTab({ url: '/pages/index/index' }); });

  const list = (await waitFor(INDEX, d => (d && d.list && d.list.length ? d.list : null))) || [];
  console.log('首页云端帖子数:', list.length);
  console.log('第一条:', list[0] && list[0].title, '| _id:', list[0] && list[0]._id);
  console.log('板块分布:', JSON.stringify(list.reduce((m, p) => (m[p.ch] = (m[p.ch] || 0) + 1, m), {})));
  console.log('GitHub 项目头像条数:', list.filter(p => (p.link || '').indexOf('github.com') === 0).length);

  // 触底分页：滚到底把剩下的帖子加载出来
  for (let i = 0; i < 4; i++) {
    await callMethod(INDEX, 'onReachBottom');
    const grown = await waitFor(INDEX, d => (d && d.list && d.list.length > list.length ? d.list : null), 4);
    if (!grown) break;
  }
  const fed = await read(INDEX);
  console.log('触底分页后:', fed.list.length, '条 | noMore:', fed.noMore, fed.list.length >= 40 && fed.noMore ? 'OK' : '(云端共 ' + fed.list.length + ' 条)');

  if (list.length) {
    await mp.evaluate((id) => { wx.navigateTo({ url: '/pages/detail/detail?id=' + id }); }, list[0]._id);
    const d = await waitFor(DETAIL, x => (x && x.post ? x : null));
    console.log('详情页标题:', d && d.post.title);
    console.log('详情页评论数:', d && d.comments.length);
    console.log('详情页官网网址:', d && d.post.link);

    const before = d.post.likes, wasLiked = !!d.post.liked;
    await callMethod(DETAIL, 'onLike');
    // 云函数冷启动可能 2-3 秒，轮询等待页面数据变化
    const chg = await waitFor(DETAIL, x => {
      const p = x && x.post;
      return p && p.likes !== before ? { likes: p.likes, liked: !!p.liked } : null;
    }, 12);
    const after = chg ? chg.likes : before, liked = chg ? chg.liked : wasLiked;
    const ok = !wasLiked ? (after === before + 1 && liked) : (after === before - 1 && !liked);
    console.log('点赞:', before, '->', after, '| liked', wasLiked, '->', liked, ok ? '云端写入OK' : '云端写入FAIL');
    await mp.evaluate(() => { wx.navigateBack(); });
    await sleep(1200);
  }

  await mp.evaluate(() => { wx.switchTab({ url: '/pages/rank/rank' }); });
  const rows = (await waitFor(RANK, x => (x && x.rows && x.rows.length ? x.rows : null))) || [];
  console.log('榜单行数:', rows.length, '| 第一行:', rows[0] && rows[0].title);

  const pub = await mp.evaluate(async () => {
    const stamp = Date.now();
    const a = await wx.cloud.callFunction({
      name: 'addPost',
      data: { ch: '工具网站', title: '自动化验证帖 ' + stamp, body: '正文内容', tags: ['verify'], link: 'https://Example.com/docs/' }
    });
    const b = await wx.cloud.callFunction({
      name: 'addPost',
      data: { ch: '热门项目', title: '自动化验证帖 GH ' + stamp, body: '正文内容', tags: ['verify'], link: 'https://github.com/vercel/ai/tree/main/packages' }
    });
    const after = await wx.cloud.callFunction({ name: 'readApi', data: { action: 'list', channel: '工具网站' } });
    const mine = after.result.filter(p => p.title.indexOf('自动化验证帖') === 0);
    return { a: a.result.link, b: b.result.link, stored: mine.length };
  });
  console.log('发布写入:', pub.stored ? 'OK' : 'FAIL');
  console.log('网址规范化:', pub.a, pub.a === 'example.com/docs' ? 'OK' : 'FAIL');
  console.log('GitHub 网址:', pub.b, pub.b === 'github.com/vercel/ai/tree/main/packages' ? 'OK' : 'FAIL');
  console.log('头像推导:', ghAvatar.fromLink(pub.b) === 'https://github.com/vercel.png?size=80' ? '取仓库 owner 头像 OK' : 'FAIL',
    '| 非 GitHub:', ghAvatar.fromLink(pub.a) === '' ? '回落开发者头像 OK' : 'FAIL');

  const clean = await mp.evaluate(async () => (await wx.cloud.callFunction({ name: 'initData' })).result);
  console.log('清理测试帖:', JSON.stringify(clean));

  await mp.evaluate(() => { wx.reLaunch({ url: '/pages/index/index' }); });
  await mp.disconnect();
  console.log('VERIFY_OK');
}).catch(e => { console.error('VERIFY_FAIL:', e.message); process.exit(1); });
