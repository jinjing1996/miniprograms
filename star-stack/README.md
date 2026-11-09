# 星栈 StarStack · 微信小程序

热门项目 / 工具网站 / 开发经验分享（含 VibeCoding 技巧）的开发者社区小程序。

## 目录结构

```
project.config.json      项目配置（appid: wxa6a25679f1301807）
miniprogram/
  config.js              数据源开关 useCloud + 云环境 ID
  app.json               页面路由 + 自定义 tabBar
  custom-tab-bar/        底部导航（首页/榜单/我的）
  pages/
    index/               首页：搜索 + 频道 Tab + 信息流
    rank/                榜单：项目飙升榜 / 工具热度榜 / 经验热帖榜
    detail/              帖子详情 + 评论 + 点赞收藏
    publish/             发布表单
    mine/                个人中心 + 发布入口
  components/post-card/  信息流卡片（项目卡 / 帖子卡两种形态）
  data/posts.js          种子内容（12 条基础帖 + 合并 library.js）
  data/library.js        GitHub 项目条目（30 条，含网址/tags/star 数，由链接整理录入）
  utils/
    dataService.js       数据服务门面（统一异步接口）
    localStore.js        本地 Storage 实现
    cloudStore.js        云数据库/云函数实现
    avatar.js            由 link 推导 GitHub 项目头像（非 GitHub 回落字母头像）
    icons.js             Iconify SVG 图标 URL 工具
cloudfunctions/
  readApi/               统一读接口（list/get/rank/comments，按 openid 标注 liked）
  initData/              集合创建 + 种子数据导入（幂等，顺带清理验证测试帖）
  toggleLike/            点赞/取消（userLikes 防重复 + 原子计数）
  addPost/               发帖（板块白名单 + 长度截断 + 内容安全预留）
  uploadAvatars/         接收头像 base64 → 传云存储 avatars/ → 回写 posts.avatar（cloud:// fileID）
assets/avatars/          本地头像缓存（fetch-avatars.js 产出，upload-avatars.js 消费）
.verify/
  check.js               端到端自动化验证（miniprogram-automator 驱动开发者工具）
  gh-fetch.js            抓取 GitHub 仓库公开元数据（desc/star/topics），供录入新链接时整理文案
  fetch-avatars.js       抓取帖子作者的 GitHub 头像到 assets/avatars/（可续传、可走代理）
  upload-avatars.js      把本地头像经小程序端上传云存储并回写 posts.avatar；--check 只统计覆盖率
index.html               网页版交互原型（设计稿，浏览器直接打开）
```

## 如何运行

1. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 用注册了本小程序的微信号登录开发者工具
3. 「导入项目」选择本目录（`hub-star/`），AppID 已在 `project.config.json` 中配好
4. 详情 → 本地设置 → 勾选 **「不校验合法域名」**（图标走 api.iconify.design）

打开即跑云端数据：首次冷启动会自动调用 `initData` 建集合 + 灌种子数据。
即可体验：频道切换、下拉刷新、点赞（云端按用户记录）、收藏（本地）、发布新帖写入云端。

> 云开发新用户免费 6 个月，之后最低约 ¥19.9/月。

## 上真机 / 上线前需知

- **图标**：把 `api.iconify.design` 加入小程序后台 downloadFile 合法域名，或将常用图标下载为本地文件改 `utils/icons.js`
- **内容安全**：`addPost` 中的 `msgSecCheck` 目前注释掉了，正式对外开放发帖前必须启用

## 云开发（已接入）

环境 ID `cloud1-d6guu610ze703236e`，`miniprogram/config.js` 中 `useCloud: true`。
集合：`posts`、`comments`、`userLikes`（由 `initData` 云函数自动创建并写入种子内容，现共 42 条）。

种子的录入是分批 + 幂等的：`initData` 每次按标题比对，最多补 8 条（避开云函数 3s 超时），返回 `more: true` 时
`app.js` 会继续调用直到补齐，全部完成后把版本号写进本地 `ss_inited`。
以后台新增内容时把 `SEED_VER` 递增一次，冷启动即自动补录，不用手动跑云函数。

列表分页：`readApi` 的 `list` 支持 `skip`，首页触底追加，取回不足 20 条即置 `noMore`。

数据流：页面 → `utils/dataService.js`（门面，统一异步接口）→ `cloudStore.js` → `wx.cloud.callFunction` → 云函数。
帖子字段：`ch / title / desc / body / tags[] / link / avatar / stars / weekly / likes / views / author / authorId / createdAt`。
`link` 是官网/项目地址（裸域名，`addPost` 会去掉协议与尾斜杠、host 转小写）；小程序内不能直接跳外链，
详情页展示为一行「域名 + 复制」，点击复制到剪贴板。
头像（`utils/avatar.js` 的 `resolve(post)`，三处调用点：`components/post-card`、`pages/detail`、`pages/rank`）：
优先用 `posts.avatar` 里预存的云存储 `cloud://` fileID，没有则回落到由 `link` 推导的 GitHub 直链
（`github.com/{owner}.png`，本机网络下取不到），再不行回落开发者首字母 + 渐变色头像。
不直接用 GitHub 直链的原因：`github.com` 在本机与小程序端都连不通，且它无法作为小程序的
downloadFile 合法域名（需 HTTPS + ICP 备案），真机上必然加载失败。云存储 fileID 免域名免备案，
基础库 2.2.3 起 `<image src>` 原生支持。

头像落库流程（新增 GitHub 项目帖子后跑一次，全程幂等）：

```bash
node .verify/fetch-avatars.js                 # 抓作者头像到 assets/avatars/（--proxy=127.0.0.1:端口 可走代理）
node .verify/upload-avatars.js --limit=1      # 试传一张，验证链路
node .verify/upload-avatars.js                # 全量上传 + 回写 posts.avatar
node .verify/upload-avatars.js --check        # 只看库里覆盖率
```

两个脚本都支持 `--only={owner}`（逗号分隔），只处理新增的那几个作者，比全量快很多；
`fetch-avatars.js` 本身就跳过已存在的文件，所以不加 `--only` 重跑也只补漏。

`fetch-avatars.js` 依次试 `avatars.githubusercontent.com/{owner}` → `unavatar.io` → `github.com`，
按文件魔数判定真实格式（同一批里既有 PNG 也有 JPEG），已存在的文件跳过不重抓。
`upload-avatars.js` 一次调用只传一张图，因为云函数默认超时 3s 且 CLI 改不了；
云存储同 `cloudPath` 覆盖，所以重跑安全。
本地模式仍可用：`config.js` 改 `useCloud: false` 即回落到 `localStore.js`（Storage + `data/posts.js`），无需后端也能跑。

关键设计：**所有读写都走云函数**，因此不需要在云开发控制台配置任何集合权限——
云函数以管理员权限访问数据库，`readApi` 负责读、`toggleLike`/`addPost` 负责写。
`liked`（是否已点赞）是按当前用户 `openid` 从 `userLikes` 实时标注到返回结果上的，
帖子文档本身只存 `likes` 计数，避免用户之间点赞状态互相串号。

改动云函数后用 CLI 部署（无需手动右键上传）：

```bash
"D:/Program Files (x86)/微信web开发者工具/cli.bat" cloud functions deploy \
  --project "D:/Work/cursorProject/star-stack" \
  --env cloud1-d6guu610ze703236e --names readApi --remote-npm-install
```

> 新建的云函数第一次 deploy 可能报「当前函数处于 Creating 状态」——CLI 会先把函数创建出来再推代码，
> 撞上了用 `cloud functions info` 确认状态变 `Active` 后重跑 deploy 即可。

端到端验证（需先在开发者工具「设置 → 安全设置」开启服务端口）：

```bash
"D:/Program Files (x86)/微信web开发者工具/cli.bat" auto \
  --project "D:/Work/cursorProject/star-stack" --auto-port 9421
cd .verify && npm i && node check.js
```

`check.js` 覆盖：首页云端列表 / 板块分布、详情页帖子与评论、点赞与取消点赞（含冷启动轮询）、榜单、发帖写入、测试数据清理。

## 内容录入约定

用户丢来原始链接/描述时，由 agent 整理成帖子并落库，字段固定为：
`ch`（工具网站 / 热门项目 / 经验分享）、`title`（「名称 — 一句话定位」，≤60 字）、`desc`（≤60 字介绍，卡片上用）、
`tags`（3–4 个）、`link`（官网/仓库地址，必填）、`body`（3–5 段中文说明）。
GitHub 项目一律 `link: github.com/owner/repo`，卡片与详情头像会自动取仓库 owner 的 GitHub 头像；
其它来源用开发者首字母头像。若仓库另有官网，写在 `body` 末行「官网：xxx」。

## 后续路线图

- [x] 云开发接入（读写全走云函数，免配置集合权限）
- [x] 首页信息流分页（`readApi` list 支持 skip + 触底追加）
- [ ] 真实登录态：发帖写入 `authorId`（openid）+ 个人中心展示「我的发布」
- [ ] 收藏迁移到云端集合 `userFavs`（目前仍是本地 Storage）
- [ ] 搜索页、话题聚合页
- [ ] 评论发送（含云函数敏感词校验 msgSecCheck）
- [ ] 热门项目自动抓取（云函数定时拉 GitHub Trending）
