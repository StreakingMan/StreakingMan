// 主页上所有的字，中英两份。改内容只改这里，然后 node scripts/build.mjs。
// 语气：说做了什么、学到了什么，不报星数、不比数字、不用「巅峰」「爆款」这类词。
export const LANGS = ['zh', 'en'];
export const t = (v, lang) => (typeof v === 'string' ? v : v[lang]);

export const GH = 'https://github.com/StreakingMan';

export const QUOTE = {
  zh: '种一棵树最好的时间是十年前，其次是现在。',
  en: 'The best time to plant a tree was ten years ago. The second best time is now.',
};

// ---------- 技能树 ----------
// 一棵树，纵轴是时间（越往上越新），地面是 2022-11-30（ChatGPT 发布）。
// 每条枝是一项技能：从 AI 之前最早用上它的地方（根）一路往上长，穿过地面，变成 AI 之后的枝叶。
// 一站 = [日期, 名字, 选项]；名字里可以写 ★{仓库名}（构建时换成实时星数）；选项 fruit: 上线了的作品，画成发光的果子。
export const TREE = {
  ground: { zh: '2022-11-30 · ChatGPT 发布', en: '2022-11-30 · ChatGPT released' },
  burst: { zh: '2025-02 · Claude Code 发布', en: '2025-02 · Claude Code released' },
  after: { zh: 'AI 之后', en: 'After AI' },
  before: { zh: 'AI 之前', en: 'Before AI' },
  lanes: [
    { color: '#60a5fa', name: { zh: '框架与界面', en: 'UI & frameworks' }, stops: [
      ['2017-12', { zh: 'Java · Android 原生开发起步', en: 'started with Java · Android' }],
      ['2019-01', { zh: 'Vue 2 中后台开发', en: 'Vue 2 admin apps' }],
      ['2021-03', { zh: 'Vue 3 可视化简历编辑器 ★{vue3-resume-editor}', en: 'Vue 3 resume editor ★{vue3-resume-editor}' }],
      ['2022-03', { zh: '转 React：配置化思维导图', en: 'to React: mind-map tool' }],
      ['2024-04', { zh: 'B2B 采购平台（买家 / 供应商端）', en: 'B2B sourcing platform' }],
      ['2025-04', { zh: '电商独立站（React 19 · Stripe）', en: 'e-commerce store, React 19' }],
      ['2025-12', { zh: '德州扑克交互式教学', en: "interactive Hold'em tutor" }],
      ['2026-05', { zh: '个人站（Astro，构建中）', en: 'homepage (Astro, WIP)' }],
    ] },
    { color: '#fbbf24', name: { zh: '工程化与基建', en: 'Tooling & infra' }, stops: [
      ['2019-01', { zh: 'webpack 构建 · npm 发包', en: 'webpack builds · npm packages' }],
      ['2020-11', { zh: '前端版本标记方案', en: 'build version stamps' }],
      ['2021-05', { zh: 'GitHub Actions 自动化', en: 'GitHub Actions automation' }],
      ['2022-02', { zh: 'Node 脚手架 · 代码规范', en: 'Node CLI · lint rules' }],
      ['2023-04', { zh: 'pnpm monorepo 实践', en: 'pnpm monorepo' }],
      ['2023-05', { zh: '团队 CLI：一键自动提测', en: 'team CLI: one-click QA' }],
      ['2024-05', { zh: '前端基建：组件与工具 monorepo', en: 'frontend infra monorepo' }],
      ['2024-11', { zh: 'Docker 容器化部署', en: 'Docker deploys' }],
      ['2026-02', { zh: '多仓合并为一个 monorepo', en: 'repos → one monorepo' }],
      ['2026-09', { zh: '联机后台 · 确定性回放测试', en: 'game server · replay tests' }],
    ] },
    { color: '#f97316', name: { zh: '图形与游戏', en: 'Graphics & games' }, stops: [
      ['2022-06', { zh: 'Pixi · Spine 2D 动画探索', en: 'Pixi · Spine 2D animation' }],
      ['2022-09', { zh: '有解版羊了个羊 ★{solvable-sheep-game}', en: 'solvable sheep game ★{solvable-sheep-game}' }],
      ['2022-11', { zh: 'Electron 桌面卡牌游戏探索', en: 'Electron card game' }],
      ['2026-06', { zh: 'Godot 4 引擎探索', en: 'exploring Godot 4' }],
      ['2026-07', { zh: '小游戏：重力律动方块', en: 'mini game: Gravity Tetris' }, { fruit: true }],
      ['2026-09', { zh: '小游戏：涂鸦大乱斗（联机）', en: 'mini game: Doodle Wars' }, { fruit: true }],
    ] },
    { color: '#c084fc', name: { zh: 'AI 与 Agent', en: 'AI & agents' }, stops: [
      ['2022-11', { zh: 'ChatGPT 辅助编码', en: 'coding with ChatGPT' }],
      ['2025-03', { zh: 'MCP 工具接入探索', en: 'exploring MCP tools' }],
      ['2025-06', { zh: 'Context Engineering 实践', en: 'context engineering' }],
      ['2025-12', { zh: 'AI 陪伴应用开发', en: 'AI companion app' }],
      ['2026-04', { zh: 'Claude Code 全流程开发', en: 'shipping with Claude Code' }],
      ['2026-11', { zh: 'Skills · Hooks 沉淀工作流', en: 'Skills · Hooks workflows' }],
    ] },
    { color: '#38bdf8', name: { zh: 'AI × 电商', en: 'AI × e-commerce' }, stops: [
      ['2024-06', { zh: 'Agent 对话界面', en: 'agent chat UI' }],
      ['2025-04', { zh: 'AIGC 生成商品图', en: 'AIGC product shots' }],
      ['2025-06', { zh: 'AI 一句话建站', en: 'AI site builder' }],
      ['2026-05', { zh: '3D 包材真实尺寸预览', en: 'real-scale 3D packaging' }],
      ['2026-11', { zh: '埋点与归因获客分析', en: 'events · attribution' }],
    ] },
    { color: '#34d399', name: { zh: '家与内容', en: 'Home & content' }, stops: [
      ['2020-05', { zh: 'Jekyll 技术博客', en: 'Jekyll tech blog' }],
      ['2024-11', { zh: '智能书墙：扫码录书 · AI 找书', en: 'smart book wall' }],
      ['2026-05', { zh: '3D 建模与打印', en: '3D modeling · printing' }],
      ['2026-08', { zh: 'home-jarvis 家庭助手（构建中）', en: 'home-jarvis (WIP)' }],
      ['2026-11', { zh: 'Remotion 宣发视频 · 声音克隆', en: 'Remotion promos · voice clone' }],
    ] },
  ],
};


// ---------- 卡片 ----------
// 代表作：大图卡片，图会轮播。qr：右下角放小程序码
export const FEATURED = [
  { imgs: ['doodle-1', 'doodle-2', 'doodle-3'], qr: 'qrcode-doodle-wars', year: '2026', href: './assets/shots/qrcode-doodle-wars.jpg',
    name: { zh: '手绘涂鸦大乱斗', en: 'Doodle Wars' },
    desc: { zh: '画零件、拼战机、自动对撞', en: 'Draw, build, then fight' },
    tags: [{ zh: '微信小游戏', en: 'WeChat mini game' }, 'planck.js', 'Canvas 2D'] },
  { cover: 'jarvis', year: '2026', wip: true, href: 'https://github.com/StreakingMan/home-jarvis', repo: 'home-jarvis',
    name: { zh: 'home-jarvis', en: 'home-jarvis' },
    desc: { zh: '把 Home Assistant 改造成家庭贾维斯', en: 'Home Assistant → a home Jarvis' },
    tags: ['Home Assistant', 'LLM'] },
  { imgs: ['gravity-1', 'gravity-2', 'gravity-3'], qr: 'qrcode-gravity-tetris', year: '2026', href: 'https://gravity-tetris.vercel.app',
    name: { zh: '重力律动方块', en: 'Gravity Tetris' },
    desc: { zh: '俄罗斯方块 × 配重物理 × 音乐律动', en: 'Tetris × physics × rhythm' },
    tags: [{ zh: '微信小游戏', en: 'WeChat mini game' }, 'Physics', 'WebAudio'] },
  { imgs: ['home-wide'], year: '2026', wip: true, href: 'https://www.streakingman.com', repo: 'streakingman.com',
    name: { zh: '个人站', en: 'Homepage' },
    desc: { zh: '主页、作品、知识库、博客', en: 'Home, works, notes and blog' },
    tags: ['Astro', 'React 19'] },
  { imgs: ['texas-wide'], year: '2025', href: 'https://texas.streakingman.com', repo: 'texas-holdem',
    name: { zh: '德州扑克教学', en: "Hold'em trainer" },
    desc: { zh: 'WebRTC 多人教学，几乎全由 AI 写', en: 'WebRTC multiplayer, mostly AI-written' },
    tags: ['Vue 3.5', 'WebRTC'] },
  { imgs: ['sheep-wide'], year: '2022', href: 'https://solvable-sheep-game.streakingman.com/', repo: 'solvable-sheep-game',
    name: { zh: '能解出来的羊了个羊', en: 'A solvable sheep game' },
    desc: { zh: '可自定义主题的消除小游戏', en: 'A tile-matching game with custom themes' },
    tags: ['React 18', 'Vite'] },
  { imgs: ['resume-wide'], year: '2021', href: 'https://resume-editor.streakingman.com', repo: 'vue3-resume-editor',
    name: { zh: 'Vue3 简历编辑器', en: 'Vue 3 resume editor' },
    desc: { zh: '拖拽、对齐、分页、打印的可视化画布', en: 'Drag, align, paginate, print' },
    tags: ['Vue 3', 'Vuetify'] },
];

export const UI = {
  switch: { zh: '<b>中文</b> · <a href="./README.en.md">English</a>', en: '<a href="./README.md">中文</a> · <b>English</b>' },
  motto: { zh: '互联网时代，每个人都在裸奔。', en: 'In the internet age, everyone is running naked.' },
  meta: { zh: '前端出身 · 杭州', en: 'Frontend background · Hangzhou' },
  afterH: { zh: 'AI 之后 · 在做的事', en: 'After AI · what I’m doing' },
  afterSub: { zh: '我说清楚想要什么、做取舍、验收；代码大多交给 AI。', en: 'I describe what I want, make the calls and review; AI writes most of the code.' },
  works: { zh: '作品', en: 'Works' },
  featured: { zh: '我的项目', en: 'My projects' },
  mapAlt: { zh: '我的成长：按时间生长的一棵树', en: 'My growth, a tree grown over time' },
  growth: { zh: '我的成长', en: 'My growth' },
  more: { zh: '其他', en: 'More' },
  stack: { zh: '常用的', en: 'Stack' },
  divider: { zh: '每年在 GitHub 上留下的痕迹', en: 'Contributions per year' },
  beforeH: { zh: 'AI 之前 · 扎下的根', en: 'Before AI · the roots' },
  beforeSub: { zh: '一行一行，亲手敲：从 Vue 2 中后台，到工程化、基建和图形。', en: 'Typed by hand: from Vue 2 admin apps to tooling, infra and graphics.' },
  skills: { zh: '方向', en: 'Focus' },
  route: { zh: '技术演进', en: 'How the stack evolved' },
  routeSub: { zh: '每条线一个方向，越往上越新。', en: 'One line per area; newer is higher.' },
  demos: { zh: '还能打开的', en: 'Still online' },
  projects: { zh: '其他', en: 'Others' },
  recent: { zh: '最近的公开动态', en: 'Recent public activity' },
  auto: { zh: '每 6 小时自动更新', en: 'auto-updated every 6 hours' },
  live: { zh: '在线', en: 'Live' },
  repo: { zh: '源码', en: 'Source' },
  scan: { zh: '微信扫码', en: 'Scan in WeChat' },
  wip: { zh: '构建中', en: 'WIP' },
  archived: { zh: '已归档', en: 'Archived' },
};
