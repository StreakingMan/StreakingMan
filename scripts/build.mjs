// 由 content.mjs 生成静态的部分：「我的项目」卡片、按时间生长的技能树，以及 README.md / README.en.md。
// 会变的部分（顶部看板：数字、最近 30 天、最近动态）在 update.mjs。星数在这里实时读。
// 用法：node scripts/build.mjs（有 GH_TOKEN 就带上，没有也能跑，只是匿名接口有频率限制）
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { LANGS, t, UI, FEATURED } from './content.mjs';
import { treeSvg } from './tree.mjs';
import { esc, textW, wrap, FONTS } from './svgkit.mjs';

const root = new URL('../', import.meta.url);
const out = (p, s) => writeFileSync(new URL(p, root), s);
rmSync(new URL('assets/cards/', root), { recursive: true, force: true });
mkdirSync(new URL('assets/cards/', root), { recursive: true });

// ---------- 星数 ----------
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const res = await fetch('https://api.github.com/users/StreakingMan/repos?per_page=100&type=owner', {
  headers: TOKEN ? { authorization: `bearer ${TOKEN}` } : {},
});
const stars = {};
const archived = new Set();
if (res.ok) {
  for (const r of await res.json()) {
    if (!r.private) stars[r.name] = r.stargazers_count;
    if (r.archived) archived.add(r.name);
  }
} else console.warn('拿不到星数，卡片上不显示', res.status);

// ---------- 主题 ----------
const THEME = {
  after: { bg: '#0b0f14', stroke: '#f472b6', so: 0.45, name: '#ffffff', desc: '#d1d5db', accent: '#fdba74', tagBg: '#1f2937', tag: '#e5e7eb', chip: '#be185d' },
  before: { bg: '#14110e', stroke: '#5a4636', so: 0.9, name: '#e8dcc8', desc: '#a89880', accent: '#c4a57a', tagBg: '#221c17', tag: '#b8a48a', chip: '#5a4636' },
};
const img64 = (name) => `data:image/jpeg;base64,${readFileSync(new URL(`assets/shots/${name}.jpg`, root)).toString('base64')}`;

function tagsRow(tags, x, y, th, maxX, lang) {
  let s = '', cx = x;
  for (const raw of tags) {
    const tg = t(raw, lang);
    const w = textW(tg, 12) + 18;
    if (cx + w > maxX) break;
    s += `<rect x="${cx.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="22" rx="11" fill="${th.tagBg}"/><text x="${(cx + w / 2).toFixed(1)}" y="${y + 15}" text-anchor="middle" class="sans" font-size="12" fill="${th.tag}">${esc(tg)}</text>`;
    cx += w + 6;
  }
  return s;
}
function chip(label, xRight, y, th) {
  const w = textW(label, 12) + 22;
  return `<rect x="${(xRight - w).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="22" rx="11" fill="${th.chip}"/><text x="${(xRight - w / 2).toFixed(1)}" y="${y + 15}" text-anchor="middle" class="sans" font-size="12" font-weight="700" fill="#fff">${esc(label)}</text>`;
}
const starOf = (c) => (c.repo && stars[c.repo] ? `★ ${stars[c.repo]}` : '');
// 归档的仓库在名字后面挂一个灰色小牌（按 GitHub 上的 archived 状态，不用手写）
function badge(label, x, y, color) {
  const w = textW(label, 10) + 14;
  return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="18" rx="9" fill="none" stroke="${color}"/><text x="${(x + w / 2).toFixed(1)}" y="${y + 13}" text-anchor="middle" class="sans" font-size="10" fill="${color}">${esc(label)}</text>`;
}

// home-jarvis 的封面：没有现成的图，用 SVG 画一个——房子线稿、往外扩的声波、绕着转的几个设备光点
function coverJarvis(W, IH) {
  const cx = W / 2, cy = IH / 2 + 6;
  const rings = [0, 1, 2].map((i) => `<circle class="ring" cx="${cx}" cy="${cy}" r="30" fill="none" stroke="#34d399" stroke-width="2" style="animation-delay:${i * 1}s"/>`).join('');
  const dots = [['#fbbf24', 62, 0], ['#60a5fa', 74, 2.1], ['#f472b6', 56, 4.2]].map(([c, r, d]) =>
    `<g class="orbit" style="animation-delay:-${d}s;transform-origin:${cx}px ${cy}px"><circle cx="${cx + r}" cy="${cy}" r="5" fill="${c}"/><circle cx="${cx + r}" cy="${cy}" r="10" fill="${c}" fill-opacity="0.25"/></g>`).join('');
  const bars = Array.from({ length: 9 }, (_, i) => {
    const h = [8, 16, 26, 18, 30, 20, 12, 22, 10][i];
    return `<rect class="eq" x="${cx - 40 + i * 9}" y="${cy + 48 - h / 2}" width="5" height="${h}" rx="2.5" fill="#34d399" style="animation-delay:${(i * 0.11).toFixed(2)}s;transform-origin:${cx - 37.5 + i * 9}px ${cy + 48}px"/>`;
  }).join('');
  return `<rect width="${W}" height="${IH}" fill="url(#jg)"/>
    <g stroke="#ffffff" stroke-opacity="0.05">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 28}" y1="0" x2="${i * 28}" y2="${IH}"/>`).join('')}</g>
    ${rings}
    <path d="M${cx - 22} ${cy + 4} L${cx} ${cy - 18} L${cx + 22} ${cy + 4} M${cx - 16} ${cy - 1} V${cy + 22} H${cx + 16} V${cy - 1}" fill="none" stroke="#ecfdf5" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy + 9}" r="4" fill="#34d399"/>
    ${dots}
    ${bars}`;
}
const COVER_DEFS = `<linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#052e2b"/><stop offset="1" stop-color="#0b0f14"/></linearGradient>`;
const COVER_CSS = `
      .ring { transform-box: fill-box; transform-origin: center; animation: ring 3s ease-out infinite; opacity: 0; }
      @keyframes ring { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(3.2); opacity: 0; } }
      .orbit { animation: orbit 8s linear infinite; }
      @keyframes orbit { to { transform: rotate(360deg); } }
      .eq { animation: eq 1s ease-in-out infinite alternate; }
      @keyframes eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }`;

// 小牌子：图上左上角的「已归档」「构建中」
function tagOnImage(label, x, y) {
  const w = textW(label, 10.5) + 16;
  return `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="20" rx="10" fill="#0b0f14" fill-opacity="0.78"/><text x="${(x + w / 2).toFixed(1)}" y="${y + 14}" text-anchor="middle" class="sans" font-size="10.5" fill="#e5e7eb">${esc(label)}</text>`;
}

// 我的项目：16:9 大图（多张时轮流淡入；home-jarvis 是画出来的封面），底下名字、一句话、标签；一行四张
function featuredSvg(c, lang) {
  const th = c.year >= '2023' ? THEME.after : THEME.before;
  const W = 300, IH = 169, H = 262;
  const name = t(c.name, lang), star = starOf(c);
  const desc = wrap(t(c.desc, lang), 11.5, c.qr ? W - 100 : W - 28, 1)[0];
  let media;
  if (c.cover === 'jarvis') media = coverJarvis(W, IH);
  else {
    media = c.imgs.map((im, i) =>
      `<image href="${img64(im)}" width="${W}" height="${IH}" preserveAspectRatio="xMidYMid slice"${i ? ` class="fade" style="animation-delay:${i * 3}s"` : ''}/>`).join('');
  }
  const n = c.imgs?.length || 1, cycle = n * 3;
  const flags = [c.repo && archived.has(c.repo) ? t(UI.archived, lang) : null, c.wip ? `◔ ${t(UI.wip, lang)}` : null].filter(Boolean);
  let fx = 10;
  const flagSvg = flags.map((f) => { const s = tagOnImage(f, fx, 10); fx += textW(f, 10.5) + 22; return s; }).join('');
  const corner = c.qr
    ? `<rect x="${W - 80}" y="${IH - 38}" width="68" height="68" rx="8" fill="#fff" stroke="${th.stroke}" stroke-opacity="0.6"/>
       <image href="${img64(c.qr)}" x="${W - 76}" y="${IH - 34}" width="60" height="60"/>`
    : !c.wip && c.href.startsWith('http') && !c.href.includes('github.com') ? chip(`▶ ${t(UI.live, lang)}`, W - 12, H - 32, th) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="ic"><rect width="${W}" height="${IH}" rx="14"/><rect y="20" width="${W}" height="${IH - 20}"/></clipPath>
    ${COVER_DEFS}
    <style>${FONTS}
      .fade { opacity: 0; animation: fade ${cycle}s infinite; }
      @keyframes fade { 0% { opacity: 0; } ${(100 / cycle / 2).toFixed(1)}% { opacity: 1; } ${(100 / n).toFixed(1)}% { opacity: 1; } ${(100 / n + 100 / cycle / 2).toFixed(1)}% { opacity: 0; } 100% { opacity: 0; } }${COVER_CSS}
    </style>
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${th.bg}" stroke="${th.stroke}" stroke-opacity="${th.so}"/>
  <g clip-path="url(#ic)">${media}</g>
  ${flagSvg}
  <text x="14" y="${IH + 27}" class="sans" font-size="16" font-weight="800" fill="${th.name}">${esc(name)}</text>
  <text x="${c.qr ? W - 90 : W - 14}" y="${IH + 26}" text-anchor="end" class="mono" font-size="11" fill="${th.accent}">${c.year}${star ? ` ${star}` : ''}</text>
  <text x="14" y="${IH + 48}" class="sans" font-size="11.5" fill="${th.desc}">${esc(desc)}</text>
  ${tagsRow(c.tags, 14, H - 32, th, c.qr ? W - 14 : W - 74, lang)}
  ${corner}
</svg>
`;
}

// ---------- 写图 ----------
const cardId = (c) => (c.repo || c.imgs?.[0] || t(c.name, 'en')).replace(/[^\w-]+/g, '-').toLowerCase();
for (const lang of LANGS) {
  out(`assets/tree.${lang}.svg`, treeSvg(lang, stars));
  for (const c of FEATURED) out(`assets/cards/${cardId(c)}.${lang}.svg`, featuredSvg(c, lang));
}

// ---------- README ----------
function grid(cards, lang) {
  const rows = [];
  for (let i = 0; i < cards.length; i += 4) {
    const cell = (c) => `<a href="${c.href}"><img src="./assets/cards/${cardId(c)}.${lang}.svg" width="24%" alt="${esc(t(c.name, lang))}"/></a>`;
    rows.push(`<p>\n  ${cards.slice(i, i + 4).map(cell).join('\n  ')}\n</p>`);
  }
  return rows.join('\n');
}

for (const lang of LANGS) {
  const file = lang === 'zh' ? 'README.md' : 'README.en.md';
  const md = `<p align="right"><sub>${UI.switch[lang]}</sub></p>

<p align="center"><img src="./assets/dashboard.${lang}.svg" width="100%" alt="StreakingMan"/></p>

### ${t(UI.featured, lang)}

${grid(FEATURED, lang)}

### ${t(UI.growth, lang)}

<p align="center"><img src="./assets/tree.${lang}.svg" width="100%" alt="${esc(t(UI.mapAlt, lang))}"/></p>
`;
  out(file, md);
}
console.log('built', { stars: Object.keys(stars).length });
