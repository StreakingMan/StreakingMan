// 定时重画顶部看板 assets/dashboard.<lang>.svg：头像、star / 今年贡献 / PR / issue / followers、
// 最近 30 天的柱子（含私有仓库的计数）、主要在哪个仓库、最近 3 条公开动态。
// 用法：GH_TOKEN=… node scripts/update.mjs（Node 18+，无依赖）
import { writeFileSync } from 'node:fs';

const USER = 'StreakingMan';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('需要 GH_TOKEN');

// 私有仓库在主页上怎么称呼；不在表里的私有仓库只写「私有项目」
const PRIVATE_NAMES = {
  'doodle-wars': { zh: '手绘涂鸦大乱斗', en: 'Doodle Wars' },
  'gravity-tetris': { zh: '重力律动方块', en: 'Gravity Tetris' },
  diao: { zh: 'DIAO', en: 'DIAO' },
  narrator: { zh: 'narrator', en: 'narrator' },
};
const L = {
  zh: { title: '每年在 GitHub 上留下的痕迹', byHand: '← 亲手敲', gpt: 'ChatGPT 2022-11-30 →', top: '今年提交最多', last30: '最近 30 天', busy: '这 30 天在别处忙', today: '今天', priv: '私有项目' },
  en: { title: 'Contributions per year', byHand: '← by hand', gpt: 'ChatGPT 2022-11-30 →', top: 'most commits this year', last30: 'Last 30 days', busy: 'busy elsewhere lately', today: 'today', priv: 'private project' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => n.toLocaleString('en-US');

async function gql(query) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
async function restRaw(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { authorization: `bearer ${TOKEN}`, accept: 'application/vnd.github+json' },
  });
  if (r.status === 409) return []; // 空仓库
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}
const rest = restRaw;
async function restAll(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const batch = await restRaw(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

const repoLabel = (repo, lang) => (repo.isPrivate ? PRIVATE_NAMES[repo.name]?.[lang] || L[lang].priv : repo.name);

// ---------- 数据 ----------
const now = new Date();
const thisYear = now.getUTCFullYear();
const created = new Date((await gql(`{user(login:"${USER}"){createdAt}}`)).user.createdAt);

// GraphQL 的按仓库拆分把私有仓库算成 restricted、不给名字，所以按仓库数提交走 REST：
// 自己名下、在时间段里推过的仓库，逐个数默认分支上自己的提交
const ownRepos = await restAll(`/user/repos?affiliation=owner&sort=pushed`);
async function commitsByRepo(since, limit) {
  const rows = [];
  for (const r of ownRepos) {
    if (r.fork || new Date(r.pushed_at) < since) continue;
    const list = await restAll(`/repos/${r.full_name}/commits?author=${USER}&since=${since.toISOString()}`);
    if (list.length) rows.push({ repo: { name: r.name, isPrivate: r.private }, commits: list.length });
  }
  return rows.sort((a, b) => b.commits - a.commits).slice(0, limit);
}

const years = [];
for (let y = created.getUTCFullYear(); y <= thisYear; y++) {
  const d = await gql(`{user(login:"${USER}"){contributionsCollection(from:"${y}-01-01T00:00:00Z",to:"${y}-12-31T23:59:59Z"){
    contributionCalendar{totalContributions}}}}`);
  years.push({ year: y, total: d.user.contributionsCollection.contributionCalendar.totalContributions, top: null });
}
years[years.length - 1].top = (await commitsByRepo(new Date(Date.UTC(thisYear, 0, 1)), 1))[0] || null;

const from30 = new Date(now.getTime() - 29 * 86400e3);
const recent = (await gql(`{user(login:"${USER}"){contributionsCollection(from:"${from30.toISOString()}",to:"${now.toISOString()}"){
  contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`)).user.contributionsCollection;
const days = recent.contributionCalendar.weeks.flatMap((w) => w.contributionDays).slice(-30);
const repos = await commitsByRepo(from30, 4);

const f1 = (n) => n.toFixed(1);
// ---------- 顶部看板：头像 + 名字 + 几个大数字 + 最近 30 天 ----------
const D = {
  zh: { tagline: '前端出身 · 杭州 · 互联网时代，每个人都在裸奔。', title: '在学着成为 AI Native Engineer', q: '? = 还在找答案',
    stars: '拿到的 star', contrib: `${thisYear} 年的贡献`, prs: 'Pull Requests', issues: 'Issues', followers: 'Followers',
    last30: '最近 30 天', mainly: '主要在', recent: '最近动态', quiet: '最近的活动都在私有仓库里', updated: '自动更新于' },
  en: { tagline: 'Frontend background · Hangzhou · In the internet age, everyone is running naked.', title: 'Learning to be an AI Native Engineer', q: '? = still figuring it out',
    stars: 'stars earned', contrib: `contributions in ${thisYear}`, prs: 'pull requests', issues: 'issues', followers: 'followers',
    last30: 'last 30 days', mainly: 'mostly on', recent: 'recent activity', quiet: 'recent work is in private repos', updated: 'updated' },
};
const profile = (await gql(`{user(login:"${USER}"){avatarUrl(size:240) followers{totalCount} pullRequests{totalCount} issues{totalCount}
  repositories(ownerAffiliations:OWNER,isFork:false,first:100){nodes{stargazerCount}}}}`)).user;
const totalStars = profile.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
const avatarRes = await fetch(profile.avatarUrl);
const avatar = `data:${avatarRes.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await avatarRes.arrayBuffer()).toString('base64')}`;
const ICONS = {
  star: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  pr: 'M6 3v12M6 21a2 2 0 100-4 2 2 0 000 4zM18 21a2 2 0 100-4 2 2 0 000 4zM18 17V8a3 3 0 00-3-3h-4M13 2l-3 3 3 3',
  issue: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 7v6M12 16.5v.5',
  people: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7.5M22 21v-1a6 6 0 00-4-5.6',
};

function dashboardSvg(lang) {
  const L2 = D[lang];
  const W = 1200, H = 470;
  const cur = years[years.length - 1];
  const tiles = [
    ['star', fmt(totalStars), L2.stars],
    ['pulse', fmt(cur.total), L2.contrib],
    ['pr', fmt(profile.pullRequests.totalCount), L2.prs],
    ['issue', fmt(profile.issues.totalCount), L2.issues],
    ['people', fmt(profile.followers.totalCount), L2.followers],
  ];
  const tw = 212, tg = 10, tx0 = 40, ty = 168;
  const tileSvg = tiles.map(([ic, num, label], i) => {
    const x = tx0 + i * (tw + tg);
    return `<g transform="translate(${x},${ty})" class="fade" style="animation-delay:${0.1 + i * 0.08}s">
      <rect width="${tw}" height="104" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#f472b6" stroke-opacity="0.25"/>
      <g transform="translate(18,18)" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[ic]}"/></g>
      <text x="18" y="84" class="mono" font-size="36" font-weight="800" fill="#fff">${num}</text>
      <text x="${tw - 16}" y="33" text-anchor="end" class="sans" font-size="12" fill="#9ca3af">${esc(label)}</text>
    </g>`;
  }).join('');

  // 最近 30 天：一排柱子 + 右边提交最多的仓库
  const max = Math.max(...days.map((d) => d.contributionCount), 1);
  const gx = 40, gw = 700, gBase = 430, gH = 90, step = gw / days.length;
  let bars = '';
  days.forEach((d, i) => {
    const v = d.contributionCount;
    const h = v ? Math.max(4, (v / max) * gH) : 2;
    bars += `<rect class="bar" x="${f1(gx + i * step + 2)}" y="${f1(gBase - h)}" width="${f1(step - 4)}" height="${f1(h)}" rx="3" fill="${v ? 'url(#hot)' : '#1f2937'}" fill-opacity="${v ? (0.4 + 0.6 * (v / max)).toFixed(2) : 1}" style="animation-delay:${(0.4 + i * 0.02).toFixed(2)}s"/>`;
  });
  const total30 = recent.contributionCalendar.totalContributions;
  const rx = 790;
  // 右栏：最近的公开动态（原来单独一排卡片，现在并进看板）
  const rows = events.length
    ? events.map((ev, i) => {
        const y = 346 + i * 34;
        const name = ev.owner === USER ? ev.repo : `${ev.owner}/${ev.repo}`;
        const verb = EV_VERB[lang][ev.kind];
        const fit = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
        return `<circle cx="${rx + 13}" cy="${y - 5}" r="13" fill="url(#hotX)"/>
      <g transform="translate(${rx + 5.8},${y - 12.2}) scale(0.6)" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${EV_ICONS[ev.kind]}"/></g>
      <text x="${rx + 34}" y="${y}" class="sans" font-size="12" fill="#9ca3af">${esc(verb)} <tspan font-size="14" font-weight="700" fill="#fff">${esc(fit(name, 22))}</tspan></text>
      <text x="${W - 40}" y="${y}" text-anchor="end" class="mono" font-size="11" fill="#fdba74">${ev.date.slice(5)}</text>`;
      }).join('')
    : `<text x="${rx}" y="350" class="sans" font-size="13" fill="#6b7280">${esc(L2.quiet)}</text>`;
  const mainly = repos[0] ? `${L2.mainly} ${repoLabel(repos[0].repo, lang)}` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e0b2e"/><stop offset="0.6" stop-color="#14101c"/><stop offset="1" stop-color="#0b0f14"/></linearGradient>
    <linearGradient id="hot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#be185d"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <linearGradient id="hotX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#be185d"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f97316" stop-opacity="0.35"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="24"/></clipPath>
    <clipPath id="av"><circle cx="96" cy="88" r="52"/></clipPath>
    <style>
      .mono { font-family: 'JetBrains Mono','SF Mono',Menlo,Consolas,monospace; }
      .sans { font-family: 'PingFang SC','Noto Sans SC','Microsoft YaHei','Helvetica Neue',Arial,sans-serif; }
      .fade { animation: fade 0.7s ease-out both; }
      @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
      .bar { transform-box: fill-box; transform-origin: bottom; animation: grow 0.9s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .grow-x { transform-box: fill-box; transform-origin: left; animation: growx 1s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes growx { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .live { animation: live 1.2s ease-in-out infinite; }
      @keyframes live { 50% { opacity: 0.2; } }
      .zx { opacity: 0; animation: zx 8s steps(1) infinite; }
      @keyframes zx { 0% { opacity: 1; } 12.5%, 100% { opacity: 0; } }
      .zn { opacity: 0; animation: zn 8s steps(1) infinite; }
      @keyframes zn { 0%, 37.5% { opacity: 0; } 37.5%, 100% { opacity: 1; } }
    </style>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <circle cx="1020" cy="40" r="300" fill="url(#glow)"/>
    <circle cx="96" cy="88" r="56" fill="none" stroke="url(#hotX)" stroke-width="4"/>
    <image href="${avatar}" x="44" y="36" width="104" height="104" clip-path="url(#av)"/>
    <text x="176" y="78" class="sans" font-size="34" font-weight="800" fill="#fff">StreakingMan</text>
    <text x="176" y="108" class="sans" font-size="15" fill="#d1d5db">${esc(L2.title)}</text>
    <text x="176" y="134" class="sans" font-size="13" fill="#9ca3af">${esc(L2.tagline)}</text>
    <g class="mono" font-size="22" font-weight="700" fill="#fde68a">
      <text x="${W - 40}" y="78" text-anchor="end" class="zx">10x engineer</text>
      <text x="${W - 40}" y="78" text-anchor="end" class="zx" style="animation-delay:1s">100x engineer</text>
      <text x="${W - 40}" y="78" text-anchor="end" class="zx" style="animation-delay:2s">1000x engineer</text>
      <text x="${W - 40}" y="78" text-anchor="end" class="zn">10<tspan font-size="20" dy="-12" fill="#fff">?</tspan><tspan dy="12">x engineer</tspan></text>
    </g>
    <text x="${W - 40}" y="102" text-anchor="end" class="sans zn" font-size="12" fill="#fdba74" fill-opacity="0.85">${esc(L2.q)}</text>
    ${tileSvg}
    <circle class="live" cx="46" cy="314" r="5" fill="#4ade80"/>
    <text x="60" y="319" class="sans" font-size="15" font-weight="700" fill="#e5e7eb">${esc(L2.last30)}</text>
    <text x="${60 + (lang === 'zh' ? 76 : 96)}" y="319" class="mono" font-size="15" font-weight="800" fill="#fdba74">${fmt(total30)}<tspan class="sans" font-size="12.5" font-weight="400" fill="#9ca3af">  ·  ${esc(mainly)}</tspan></text>
    <text x="${gx + gw}" y="319" text-anchor="end" class="mono" font-size="11" fill="#6b7280">${esc(L2.updated)} ${now.toISOString().slice(0, 10)}</text>
    ${bars}
    <text x="${rx}" y="319" class="sans" font-size="13" fill="#9ca3af">${esc(L2.recent)}</text>
    ${rows}
  </g>
</svg>
`;
}

// ---------- 最近公开动态：画进看板右栏 ----------
const EV_ICONS = {
  push: 'M12 19V5M5 12l7-7 7 7',
  create: 'M12 5v14M5 12h14',
  release: 'M4 14l6-10 10 6-6 10zM9 9h.01',
  merge: 'M6 3v12M6 21a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM18 9a9 9 0 01-9 9',
  issue: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 7v6M12 16.5v.5',
  star: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z',
};
const EV_VERB = {
  zh: { push: '推送', create: '新建仓库', release: '发布', merge: '合并 PR', issue: '提了 issue', star: '收藏了' },
  en: { push: 'pushed to', create: 'created', release: 'released', merge: 'merged a PR', issue: 'opened an issue', star: 'starred' },
};
const rawEvents = await rest(`/users/${USER}/events/public?per_page=100`);
const events = [];
{
  const seen = new Set();
  for (const e of rawEvents) {
    const repo = e.repo.name;
    if (repo === `${USER}/${USER}`) continue; // 主页仓库自己的更新不算
    let kind = null, detail = '', url = `https://github.com/${repo}`;
    if (e.type === 'PushEvent') kind = 'push';
    else if (e.type === 'CreateEvent' && e.payload.ref_type === 'repository') kind = 'create';
    else if (e.type === 'ReleaseEvent') { kind = 'release'; detail = e.payload.release.tag_name; url = e.payload.release.html_url; }
    else if (e.type === 'PullRequestEvent' && e.payload.action === 'closed' && e.payload.pull_request.merged) { kind = 'merge'; detail = e.payload.pull_request.title; url = e.payload.pull_request.html_url; }
    else if (e.type === 'IssuesEvent' && e.payload.action === 'opened') { kind = 'issue'; detail = e.payload.issue.title; url = e.payload.issue.html_url; }
    else if (e.type === 'WatchEvent') kind = 'star';
    if (!kind) continue;
    const key = `${kind}:${repo}`;
    if (seen.has(key)) continue; // 同一个仓库同一种动作只留最新一条
    seen.add(key);
    events.push({ kind, repo: repo.replace(`${USER}/`, ''), owner: repo.split('/')[0], date: e.created_at.slice(0, 10), detail, url });
    if (events.length >= 3) break;
  }
}

for (const lang of ['zh', 'en']) {
  writeFileSync(new URL(`../assets/dashboard.${lang}.svg`, import.meta.url), dashboardSvg(lang));
}
console.log('updated', { recent: recent.contributionCalendar.totalContributions, repos: repos.length, events: events.length });
