const posts = [
  { id: 1, ch: '热门项目', title: 'Raycast — 取代 Spotlight 的效率启动器',
    desc: '基于插件生态的 macOS 快捷工具，开发者聚集度极高，插件市场年增速 300%。适合学习其插件架构与跨端设计。',
    tags: ['macOS', '插件架构', 'TypeScript'], stars: '78.2k', weekly: '+2.1k', link: 'raycast.com',
    likes: 1240, views: 8900, author: '阿星', hours: 3, liked: false,
    body: '推荐理由：\n\n1. 插件体系设计优雅，开发者贡献成本极低；\n2. 从 0 到 1 的品类创新：把启动器做成平台；\n3. 前端团队公开了大量工程实践分享。\n\n可借鉴点：本地优先 + 云同步的架构、以开发者为核心的增长飞轮。' },
  { id: 2, ch: '热门项目', title: 'Zod v4 发布：性能提升 5 倍，体积减半',
    desc: 'TypeScript 首选校验库大版本更新，全新协议系统，值得关注生态迁移成本。',
    tags: ['TypeScript', '开源', 'v4'], stars: '35.6k', weekly: '+1.5k', link: 'github.com/colinhacks/zod',
    likes: 890, views: 5400, author: '小林', hours: 6, liked: false,
    body: '升级要点：\n\n- 核心重写，解析性能提升约 5x；\n- 新增微型语法 z.hex()、z.uuid() 等；\n- 与 JSON Schema 双向互转。\n\n迁移建议：先用 codemod 扫一遍，再重点测试 error map 相关逻辑。' },
  { id: 3, ch: '热门项目', title: 'Ollama：本地跑大模型只需要一行命令',
    desc: '把 llama.cpp 封装成开发者体验极佳的本地模型服务，一周增长 2k star。',
    tags: ['LLM', '本地部署', 'Go'], stars: '112k', weekly: '+2.8k', link: 'github.com/ollama/ollama',
    likes: 2100, views: 15000, author: 'Kevin', hours: 9, liked: false,
    body: '为什么火：\n\n- 极低门槛：curl 安装 + ollama run 即跑；\n- REST API 让本地模型秒接应用；\n- Modelfile 让微调像写 Dockerfile。\n\n搭建个人 AI 助手项目的推荐组合：Ollama + Open WebUI。' },
  { id: 4, ch: '工具网站', title: 'Excalidraw — 手绘风白板，画架构图比 PPT 快 10 倍',
    desc: '开源免费的在线白板，手绘风格天然适合技术方案、架构图和脑暴，支持实时协作，免注册即用。',
    tags: ['白板', '架构图', '开源'], link: 'excalidraw.com', likes: 1830, views: 9600, author: '阿星', hours: 2, liked: false,
    body: '网站：excalidraw.com\n\n使用场景：\n\n- 写技术方案时画系统架构图，比 PPT 形状快太多；\n- 团队协作脑暴：发个链接多人同画；\n- 嵌进 README：导出 .excalidraw 文件可二次编辑。\n\n小技巧：按住 Alt 复制拖动，Library 里有现成的 AWS/K8s 图标库。' },
  { id: 5, ch: '工具网站', title: 'Photopea — 浏览器里的免费 Photoshop',
    desc: '打开即用的在线图片编辑器，界面和快捷键几乎复刻 PS，支持 PSD/AI/Sketch 文件，应急改图神器。',
    tags: ['图片编辑', '在线工具', '免费'], link: 'photopea.com', likes: 940, views: 5200, author: 'Momo', hours: 5, liked: false,
    body: '网站：photopea.com\n\n为什么推荐：\n\n- 完全免费，无需安装，网页打开即用；\n- 直接打开 PSD / AI / Sketch / XD 文件；\n- 快捷键与 PS 基本一致，零学习成本。\n\n适合场景：临时改设计稿、抠图、切图导出，不用再为一张图开一个 PS。' },
  { id: 6, ch: '工具网站', title: 'TinyPNG + Squoosh 组合：图片资源压缩流水线',
    desc: 'TinyPNG 批量有损压缩肉眼无感，Squoosh 精细调参，两步把首页图片体积砍掉 70%。',
    tags: ['图片压缩', '性能优化'], link: 'tinypng.com', likes: 710, views: 4300, author: 'Yumi', hours: 8, liked: false,
    body: '网站：tinypng.com / squoosh.app\n\n我的压缩流水线：\n\n1. TinyPNG 批量过一遍（WebP 格式顺手转掉）；\n2. 首屏大图再用 Squoosh 手动调 AVIF 质量到 60-75；\n3. CI 里加 size-limit 卡住回退。\n\n实测：活动页从 4.2MB 降到 1.1MB，LCP 提升 1.3s。' },
  { id: 7, ch: '经验分享', title: '我把重构老项目的流程总结成了这 5 步',
    desc: '接手 8 年老项目不敢动？先补测试、再抽边界、小步替换。这套流程帮我们把构建时间从 4min 降到 40s。',
    tags: ['重构', '工程化'], likes: 672, views: 4100, author: '老周', hours: 12, liked: false,
    body: '五步法：\n\n1. 冻结：先给核心链路补快照测试；\n2. 划线：圈出模块边界，禁止新增跨层调用；\n3. 替换：新功能一律走新架构；\n4. 搬运：按用例逐块搬迁旧代码；\n5. 删除：旧路径流量归零后果断删掉。\n\n关键是第 5 步——很多团队只拆不删，最后两套并存。' },
  { id: 8, ch: '经验分享', title: '上线后被 PM 追问的埋点事故复盘',
    desc: '一次字段改名导致 3 天数据全丢。分享我们的埋点契约化方案：Schema 注册 + CI 校验。',
    tags: ['复盘', '数据埋点'], likes: 445, views: 3200, author: 'Momo', hours: 15, liked: false,
    body: '事故链：开发改了事件字段名 → 数据侧无感知 → 报表口径断裂 3 天。\n\n修复方案：\n- 所有埋点进 schema 仓库注册；\n- CI 阶段 diff 校验，破坏性改名直接 block；\n- 上线前自动比对线上/预发事件结构。\n\n教训：埋点是接口，不是日志。' },
  { id: 9, ch: '经验分享', title: '远程协作两年，我沉淀的 6 条异步沟通原则',
    desc: '能写文档不开会；会议只用来做决定。异步写作的清晰度决定团队速度。',
    tags: ['远程办公', '协作'], likes: 531, views: 3900, author: 'Yumi', hours: 18, liked: false,
    body: '6 条原则：\n\n1. 先给结论，再给背景；\n2. 需要回复的，写清 deadline；\n3. 文档优于聊天记录；\n4. 会议必须有 decision log；\n5. 时区重叠 3 小时是黄金协作期；\n6. 「在吗」= 直接说事。' },
  { id: 10, ch: '经验分享', title: '用 Claude Code 两天 Vibe 出一个可用小程序的全流程',
    desc: '从提示词分层、上下文管理到真机联调，关键是先让它写 spec 再写代码。',
    tags: ['Claude Code', '工作流', 'VibeCoding'], likes: 1580, views: 11200, author: '阿星', hours: 21, liked: false,
    body: '我的流程：\n\n1. 一句话需求 → 让它反问我 10 个问题补全需求；\n2. 生成 spec.md 并人工修订（这步最值钱）；\n3. 按 spec 拆 task list，一次只做一个任务；\n4. 每个任务完成就跑测试，红了马上修；\n5. 提交前让它自审一遍 diff。\n\n心得：Vibe 不是放任，是把「写」的活交出去，把「想」的活留下。' },
  { id: 11, ch: '经验分享', title: 'Prompt 里加这一句，AI 生成的代码 bug 少一半',
    desc: '「先写会失败的测试用例，再写实现」——TDD 提示词是让 AI 代码可靠的最便宜手段。',
    tags: ['Prompt技巧', 'VibeCoding'], likes: 2210, views: 16800, author: '小林', hours: 24, liked: false,
    body: '对比实验：同一需求跑 20 次。\n\n- 直接要代码：一次通过率 45%；\n- 加上「先写失败测试，再实现，最后跑测试确认」：一次通过率 82%。\n\n原理：强制模型走验证回路，而不是单向生成。' },
  { id: 12, ch: '经验分享', title: '上下文爆了怎么办？大项目喂给 AI 的分层策略',
    desc: 'AGENTS.md 当目录，模块文档当抽屉，永远不要让 AI 全仓检索。实测 token 消耗降 70%。',
    tags: ['上下文管理', 'VibeCoding'], likes: 1120, views: 8700, author: 'Kevin', hours: 27, liked: false,
    body: '三层投喂：\n\n1. 根级 AGENTS.md：项目地图 + 约定，几百 token；\n2. 模块级 README：接口、边界、坑；\n3. 任务级：只贴直接相关的文件。\n\n配合 grep 按需取码，效果远好于整目录塞入。' }
];

const library = require('./library.js');
posts.push(...library);

const comments = {
  default: [
    { n: '路人甲', c: '学到了，正好在手搓类似的东西' },
    { n: 'DevZw', c: '第 3 点深有同感，我们团队踩过一模一样的坑' },
    { n: '小鱼', c: '有完整的 demo 仓库链接吗？' }
  ]
};

module.exports = { posts, comments };
