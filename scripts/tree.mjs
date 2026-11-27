// 画 assets/tree.<lang>.svg：一棵按时间生长的技能树。
//   形：粗壮的主干（带树皮纹理）+ 背后一团树冠剪影；每项技能从主干伸出一根主枝，主枝上的每个节点分出小枝，
//      小枝末端挂一簇叶子（叶形 + 叶脉）；上线的作品是挂着的果子。地下同理：每项技能一条主根，分出须根到各个节点。
//   时间：节点高度按日期（越往上越新，越往下越老）；地面是 2022-11-30（ChatGPT 发布），淡黄点线是 2025-02（Claude Code 发布）。
//   线条虚实结合：枝和根是实心的，空窗期（相邻节点隔一年半以上）的那一段改成虚线；树皮、根里的汁液是点线。
// 数据在 content.mjs 的 TREE.lanes。确定性：同样的数据画出同样的图。
import { TREE, QUOTE, t } from './content.mjs';
import { esc, textW, fill as fillStars, FONTS } from './svgkit.mjs';

const W = 1200, H = 1440;
const TOP = 125;       // 2026-12
const GROUND = 760;    // 2022-11-30
const BOTTOM = 1340;   // 2017-12
const TX = 600;
const TRUNK_TOP = 270; // 主干到这里分散成枝
const f = (n) => n.toFixed(1);
const mIdx = (d) => { const [y, m] = d.split('-').map(Number); return y * 12 + (m - 1); };
const M_TOP = mIdx('2026-12'), M_GROUND = mIdx('2022-12'), M_BOTTOM = mIdx('2017-12');
const yOf = (d) => {
  const m = mIdx(d);
  if (m >= M_GROUND) return GROUND - 14 - ((m - M_GROUND) / (M_TOP - M_GROUND)) * (GROUND - 14 - TOP);
  return GROUND + 40 + ((M_GROUND - 1 - m) / (M_GROUND - 1 - M_BOTTOM)) * (BOTTOM - GROUND - 40);
};
const trunkHalf = (y) => 6 + 56 * Math.min(1, Math.max(0, (y - TRUNK_TOP) / (GROUND - TRUNK_TOP))) ** 1.4;

// 三次贝塞尔：取点、按 y 找最近的点
const bez = (p0, p1, p2, p3, s) => {
  const u = 1 - s;
  return { x: u * u * u * p0.x + 3 * u * u * s * p1.x + 3 * u * s * s * p2.x + s * s * s * p3.x, y: u * u * u * p0.y + 3 * u * u * s * p1.y + 3 * u * s * s * p2.y + s * s * s * p3.y };
};
const samples = (c) => Array.from({ length: 61 }, (_, i) => ({ s: i / 60, ...bez(...c, i / 60) }));
const atY = (smp, y) => smp.reduce((a, b) => (Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a));
// 有粗细的一段（填充多边形），w0 → w1
function limb(c, w0, w1, paint, from = 0, to = 1, extra = '') {
  const N = 22, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const s = from + ((to - from) * i) / N;
    const p = bez(...c, s), q = bez(...c, Math.min(1, s + 0.01)), r = bez(...c, Math.max(0, s - 0.01));
    const dx = q.x - r.x, dy = q.y - r.y, len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * ((s - from) / (to - from || 1))) / 2;
    L.push(`${f(p.x - (dy / len) * w)},${f(p.y + (dx / len) * w)}`);
    R.push(`${f(p.x + (dy / len) * w)},${f(p.y - (dx / len) * w)}`);
  }
  return `<path d="M${L.join(' L')} L${R.reverse().join(' L')} Z" fill="${paint}"${extra}/>`;
}
const cpath = (c) => `M${f(c[0].x)},${f(c[0].y)} C${f(c[1].x)},${f(c[1].y)} ${f(c[2].x)},${f(c[2].y)} ${f(c[3].x)},${f(c[3].y)}`;

// 一片叶子：两头尖的叶形 + 一条叶脉，原点在叶柄
const leaf = (x, y, len, ang, color, op) =>
  `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})"><path d="M0,0 Q${f(len * 0.45)},${f(-len * 0.32)} ${f(len)},0 Q${f(len * 0.45)},${f(len * 0.32)} 0,0Z" fill="${color}" fill-opacity="${op}"/><path d="M1,0 L${f(len * 0.9)},0" stroke="#0b0f14" stroke-opacity="0.35" stroke-width="1"/></g>`;

export function treeSvg(lang, stars) {
  let seed = 20221130;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const lanes = TREE.lanes;
  const canopyX = [150, 330, 480, 720, 880, 1060];
  const rootX = [170, 360, 520, 680, 840, 1040];

  let grid = '', canopy = '', bark = '', limbs = '', dashed = '', twigs = '', roots = '', sap = '', leaves = '', fruits = '', nodes = '', labels = '', sparks = '';
  const boxes = [
    { x: 60, y: yOf('2025-02') - 22, w: textW(t(TREE.burst, lang), 12) + 10, h: 18 },
    { x: W - 60 - textW(t(TREE.ground, lang), 12.5), y: GROUND - 16, w: textW(t(TREE.ground, lang), 12.5) + 40, h: 32 },
    { x: 60, y: GROUND - 28, w: 110, h: 60 },
  ];
  const place = (p, prefer, color, after) => {
    const label = p.label, txtW = textW(p.d, 11) + textW(label, 13.5) + 30, h = 24;
    const tryAt = (side, dy, dx = 0) => ({ x: Math.min(W - 14 - txtW, Math.max(52, side > 0 ? p.x + 16 + dx : p.x - 16 - dx - txtW)), y: p.y - h / 2 + dy, w: txtW, h });
    const over = (b, o) => Math.max(0, Math.min(b.x + b.w + 4, o.x + o.w) - Math.max(b.x, o.x - 4)) * Math.max(0, Math.min(b.y + b.h + 3, o.y + o.h) - Math.max(b.y, o.y - 3));
    // 撞了多少：出界、跨地面线、盖住自己的节点算死路；跟别的名字牌重叠按面积算
    const cost = (b) => ((b.y < GROUND + 3 && b.y + b.h > GROUND - 3) || b.y < 64 ||
      (p.x > b.x - 8 && p.x < b.x + b.w + 8 && p.y > b.y - 8 && p.y < b.y + b.h + 8) ? 1e9 : 0) + boxes.reduce((a, o) => a + over(b, o), 0);
    const hit = (b) => cost(b) > 0;
    let box = null;
    // 候选位置：上下错开、再往外推，按挪动的距离从近到远试
    const cands = [];
    for (let dy = -160; dy <= 160; dy += 14) for (const dx of [0, 40, 90, 150, 220, 300]) for (const side of [prefer, -prefer])
      cands.push([Math.abs(dy) + dx * 0.7 + (side === prefer ? 0 : 10), side, dy, dx]);
    cands.sort((x, y) => x[0] - y[0]);
    for (const [, side, dy, dx] of cands) { const b = tryAt(side, dy, dx); if (!hit(b)) { box = b; break; } }
    if (!box) box = cands.map(([, side, dy, dx]) => tryAt(side, dy, dx)).reduce((m, b) => (cost(b) < cost(m) ? b : m));
    boxes.push(box);
    const cy = box.y + h / 2;
    let s = '';
    if (Math.abs(cy - p.y) > 2) s += `<path d="M${f(p.x)},${f(p.y)} L${f(box.x < p.x ? box.x + box.w : box.x)},${f(cy)}" stroke="${color}" stroke-width="1" stroke-dasharray="1 3" stroke-opacity="0.8"/>`;
    s += `<g transform="translate(${f(box.x)},${f(box.y)})">
      <rect width="${f(box.w)}" height="${h}" rx="12" fill="${after ? '#0b0f14' : '#14110e'}" fill-opacity="0.9" stroke="${color}" stroke-opacity="${after ? 0.6 : 0.4}"/>
      <text x="10" y="16" class="mono" font-size="11" fill="${after ? '#fdba74' : '#a08868'}">${p.d}</text>
      <text x="${f(16 + textW(p.d, 11))}" y="17" class="sans" font-size="13.5" font-weight="700" fill="${after ? '#fff' : '#e8dcc8'}">${esc(label)}</text>
    </g>`;
    return s;
  };

  for (let y = 2018; y <= 2026; y++) {
    const gy = yOf(`${y}-01`);
    grid += `<line x1="52" y1="${f(gy)}" x2="${W - 24}" y2="${f(gy)}" stroke="#fff" stroke-opacity="0.045"/>
      <text x="18" y="${f(gy + 4)}" class="mono" font-size="12" fill="${gy > GROUND ? '#8b7355' : '#c084a8'}">${y}</text>`;
  }

  // 树冠剪影：一大团叠在一起的圆
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    const x = TX + Math.cos(a) * d * 520, y = 420 + Math.sin(a) * d * 250;
    canopy += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(50 + rnd() * 70)}" fill="${['#3b0764', '#4a044e', '#500724', '#1e1b4b'][Math.floor(rnd() * 4)]}" fill-opacity="${(0.16 + rnd() * 0.16).toFixed(2)}"/>`;
  }

  // 主干：地面到 TRUNK_TOP，底部外撇成根盘
  const tPts = [];
  for (let k = 0; k <= 30; k++) {
    const y = GROUND + 24 - (k / 30) * (GROUND + 24 - TRUNK_TOP);
    const flare = y > GROUND - 60 ? (y - (GROUND - 60)) ** 1.6 * 0.12 : 0;
    const wob = Math.sin(k * 0.7) * 3;
    tPts.push([TX - trunkHalf(y) - flare + wob, y]);
  }
  const trunkD = `M${tPts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')} L${tPts.slice().reverse().map(([x, y]) => `${f(2 * TX - x)},${f(y)}`).join(' L')} Z`;
  for (let k = 0; k < 7; k++) {
    const x = TX - 30 + k * 10;
    bark += `<path d="M${x},${GROUND + 10} C${x + 6},${GROUND - 150} ${x - 6},${GROUND - 300} ${TX + (x - TX) * 0.4},${TRUNK_TOP + 20}" fill="none" stroke="#1a1410" stroke-opacity="0.55" stroke-width="1.4" stroke-dasharray="${k % 2 ? '14 6' : '3 5'}"/>`;
  }

  lanes.forEach((lane, li) => {
    const all = lane.stops.map(([d, label, opt]) => ({ d, y: yOf(d), label: fillStars(t(label, lang), stars), fruit: opt?.fruit }));
    const up = all.filter((p) => p.y < GROUND);
    const down = all.filter((p) => p.y >= GROUND);

    // ---- 树冠：主枝 ----
    if (up.length) {
      const end = up[up.length - 1];
      const ex = canopyX[li];
      const side = ex < TX ? -1 : 1;
      const attachY = Math.min(GROUND - 120, Math.max(TRUNK_TOP + 20, up[0].y + 70));
      const A = { x: TX + side * (trunkHalf(attachY) - 6), y: attachY };
      const E = { x: ex, y: end.y };
      const c = [A, { x: A.x + side * 90, y: A.y - 50 }, { x: E.x - side * 40, y: E.y + 110 }, E];
      const smp = samples(c);
      // 空窗期改虚线：按节点切段
      const sOf = (p) => atY(smp, p.y + 24).s;
      let lastS = 0, lastD = up[0].d;
      limbs += limb(c, 26, 5, 'url(#limbG)', 0, sOf(up[0]));
      up.forEach((p, j) => {
        const sNow = j === up.length - 1 ? 1 : sOf(p);
        if (j > 0) {
          const gap = mIdx(p.d) - mIdx(lastD);
          const w0 = 26 - 21 * lastS, w1 = 26 - 21 * sNow;
          if (gap > 18) {
            const sub = samples(c).filter((q) => q.s >= lastS && q.s <= sNow);
            dashed += `<path d="M${sub.map((q) => `${f(q.x)},${f(q.y)}`).join(' L')}" fill="none" stroke="${lane.color}" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round" stroke-opacity="0.85"/>`;
            limbs += limb(c, w0 * 0.35, w1 * 0.35, 'url(#limbG)', lastS, sNow, ' fill-opacity="0.45"');
          } else limbs += limb(c, w0, w1, 'url(#limbG)', lastS, sNow);
        }
        lastS = sNow; lastD = p.d;
      });
      // 节点：最新那个在枝梢；其余的从主枝上分出小枝
      up.forEach((p, j) => {
        let base;
        if (j === up.length - 1) { p.x = E.x; base = bez(...c, 0.93); }
        else {
          base = atY(smp, p.y + 24);
          const alt = (j % 2 ? 1 : -1) * side;
          p.x = base.x + alt * (46 + (j % 3) * 10);
          const tc = [base, { x: base.x + (p.x - base.x) * 0.3, y: base.y - 4 }, { x: p.x - (p.x - base.x) * 0.2, y: p.y + 14 }, { x: p.x, y: p.y }];
          twigs += limb(tc, 7, 2, 'url(#limbG)');
        }
        // 叶子：一簇
        let g = '';
        // 叶子朝上斜着长：沿一小段弧错开叶柄的位置，角度在 -165° ~ -15° 之间
        const n = p.fruit ? 5 : 7;
        for (let k = 0; k < n; k++) {
          const ang = -165 + (k / (n - 1)) * 150 + (rnd() - 0.5) * 24, len = 12 + rnd() * 13;
          const ox = (rnd() - 0.5) * 16, oy = rnd() * 8 - 2;
          g += leaf(p.x + ox, p.y + oy, len, ang, lane.color, (0.55 + rnd() * 0.35).toFixed(2));
        }
        leaves += `<g class="sway" style="transform-origin:${f(p.x)}px ${f(p.y)}px;animation-delay:${(-(li * 3 + j) * 0.45).toFixed(2)}s">${g}</g>`;
        if (p.fruit) {
          fruits += `<g class="swing" style="transform-origin:${f(p.x)}px ${f(p.y)}px"><path d="M${f(p.x)},${f(p.y)} L${f(p.x)},${f(p.y + 14)}" stroke="#4a3a2c" stroke-width="2"/>
            <circle class="glow" cx="${f(p.x)}" cy="${f(p.y + 24)}" r="18" fill="#fde68a" fill-opacity="0.3" style="transform-origin:${f(p.x)}px ${f(p.y + 24)}px"/>
            <circle cx="${f(p.x)}" cy="${f(p.y + 24)}" r="10" fill="url(#fruitG)"/><circle cx="${f(p.x - 3)}" cy="${f(p.y + 20)}" r="2.5" fill="#fff" fill-opacity="0.7"/></g>`;
        }
        nodes += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="4.5" fill="#0b0f14" stroke="${lane.color}" stroke-width="2.5"/>`;
        labels += place(p, p.x < base.x || (j === up.length - 1 && side < 0) ? -1 : 1, lane.color, true);
      });
      // 枝上零散的几片叶子
      for (let k = 0; k < 6; k++) {
        const q = bez(...c, 0.35 + rnd() * 0.55);
        leaves += `<g class="sway" style="transform-origin:${f(q.x)}px ${f(q.y)}px">${leaf(q.x, q.y, 10 + rnd() * 8, -160 + rnd() * 140, lane.color, 0.45)}</g>`;
      }
    }

    // ---- 地下：主根 ----
    if (down.length) {
      const deep = down[0]; // 最老的扎得最深
      const rx = rootX[li];
      const side = rx < TX ? -1 : 1;
      const S = { x: TX + side * 18, y: GROUND + 16 };
      const E = { x: rx, y: deep.y };
      const c = [S, { x: S.x + side * 80, y: S.y + 40 }, { x: E.x - side * 20, y: E.y - 160 }, E];
      roots += limb(c, 22, 4, 'url(#rootG)');
      sap += `<path class="sap" d="${cpath([E, c[2], c[1], S])}" stroke="${lane.color}" style="animation-delay:${(li * 0.35).toFixed(2)}s"/>`;
      const smp = samples(c);
      down.forEach((p, j) => {
        let base;
        if (j === 0) { p.x = E.x; base = E; }
        else {
          base = atY(smp, p.y - 24);
          const alt = (j % 2 ? 1 : -1) * side;
          p.x = base.x + alt * (44 + (j % 3) * 12);
          const tc = [base, { x: base.x + (p.x - base.x) * 0.3, y: base.y + 6 }, { x: p.x, y: p.y - 16 }, { x: p.x, y: p.y }];
          roots += limb(tc, 7, 2, 'url(#rootG)');
        }
        // 须根
        for (let k = 0; k < 3; k++) {
          const a = (side * (20 + rnd() * 60) + 90) * (Math.PI / 180);
          roots += `<path d="M${f(p.x)},${f(p.y)} q${f(Math.cos(a) * 10)},${f(8 + rnd() * 6)} ${f(Math.cos(a) * (18 + rnd() * 14))},${f(16 + rnd() * 16)}" stroke="#5a4636" stroke-width="1.4" fill="none" stroke-dasharray="${k ? '2 3' : 'none'}"/>`;
        }
        nodes += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="4.5" fill="#14110e" stroke="${lane.color}" stroke-width="2.5"/>`;
        labels += place(p, p.x < base.x || (j === 0 && side < 0) ? -1 : 1, lane.color, false);
      });
    }
  });

  for (let i = 0; i < 14; i++) {
    sparks += `<circle class="rise" cx="${f(120 + rnd() * (W - 240))}" cy="${f(GROUND - 20 - rnd() * 140)}" r="${f(1.5 + rnd() * 2)}" fill="#fde68a" style="animation-delay:${(rnd() * 6).toFixed(2)}s;animation-duration:${(5 + rnd() * 4).toFixed(1)}s"/>`;
  }

  let legend = '', lx = 48;
  lanes.forEach((lane) => {
    const name = t(lane.name, lang);
    legend += `<g transform="translate(${lx},40)">${leaf(0, 0, 16, -20, lane.color, 0.95)}</g><text x="${lx + 20}" y="45" class="sans" font-size="14" font-weight="700" fill="#e5e7eb">${esc(name)}</text>`;
    lx += 36 + textW(name, 14);
  });
  const ground = t(TREE.ground, lang), burst = t(TREE.burst, lang);
  const burstY = yOf('2025-02');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160a22"/><stop offset="1" stop-color="#241018"/></linearGradient>
    <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1510"/><stop offset="1" stop-color="#0e0c0a"/></linearGradient>
    <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2e231b"/><stop offset="0.45" stop-color="#5a4334"/><stop offset="1" stop-color="#2a1f18"/></linearGradient>
    <linearGradient id="limbG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5a4334"/><stop offset="1" stop-color="#6b3a4a"/></linearGradient>
    <linearGradient id="rootG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4334"/><stop offset="1" stop-color="#3b3027"/></linearGradient>
    <radialGradient id="fruitG" cx="0.35" cy="0.35"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>
    <radialGradient id="glowG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f97316" stop-opacity="0.22"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="24"/></clipPath>
    <style>${FONTS}
      .sway { animation: sway 5s ease-in-out infinite; }
      @keyframes sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
      .swing { animation: swing 3s ease-in-out infinite; }
      @keyframes swing { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
      .glow { animation: glow 1.8s ease-in-out infinite; }
      @keyframes glow { 50% { transform: scale(1.5); opacity: 0.25; } }
      .sap { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 2 14; animation: sap 2s linear infinite; }
      @keyframes sap { to { stroke-dashoffset: -32; } }
      .rise { animation: rise 6s linear infinite; }
      @keyframes rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-560px); opacity: 0; } }
    </style>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${GROUND}" fill="url(#skyG)"/>
    <circle cx="${TX}" cy="420" r="600" fill="url(#glowG)"/>
    <rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="url(#soilG)"/>
    ${grid}
    ${canopy}
    <line x1="0" y1="${f(burstY)}" x2="${W}" y2="${f(burstY)}" stroke="#fde68a" stroke-opacity="0.4" stroke-dasharray="2 6"/>
    <text x="64" y="${f(burstY - 8)}" class="mono" font-size="12" fill="#fde68a">${esc(burst)}</text>
    ${roots}${sap}
    <path d="${trunkD}" fill="url(#trunkG)"/>${bark}
    ${limbs}${dashed}${twigs}
    <line x1="0" y1="${GROUND}" x2="${W}" y2="${GROUND}" stroke="#f472b6" stroke-width="2" stroke-dasharray="8 8"/>
    ${leaves}${fruits}${sparks}${nodes}${labels}
    <rect x="${W - 54 - textW(ground, 12.5)}" y="${GROUND - 14}" width="${f(textW(ground, 12.5) + 30)}" height="28" rx="14" fill="#0b0f14" stroke="#f472b6"/>
    <text x="${W - 39 - textW(ground, 12.5)}" y="${GROUND + 5}" class="mono" font-size="12.5" fill="#f472b6">${esc(ground)}</text>
    <text x="64" y="${GROUND - 12}" class="sans" font-size="13" font-weight="700" fill="#f9a8d4">↑ ${esc(t(TREE.after, lang))}</text>
    <text x="64" y="${GROUND + 24}" class="sans" font-size="13" font-weight="700" fill="#c4a57a">↓ ${esc(t(TREE.before, lang))}</text>
    ${legend}
    <text x="48" y="${H - 34}" class="sans" font-size="15" fill="#b8a48a">${esc(t(QUOTE, lang))}</text>
  </g>
</svg>
`;
}
