// 画 SVG 的小工具：转义、估字宽、折行、把 ★{仓库名} 换成实时星数。
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 估算文字宽度（没有字体度量，按中文 1em、拉丁 0.56em 估）
export function textW(s, size) {
  let w = 0;
  for (const ch of String(s)) w += /[⺀-￿]/.test(ch) && !/[★·→↑↓—]/.test(ch) ? 1 : 0.56;
  return w * size;
}

// 按宽度折行：中文逐字断，英文按词断
export function wrap(s, size, maxW, maxLines = 3) {
  const tokens = String(s).match(/[⺀-￿]|[^\s⺀-￿]+|\s+/g) || [];
  const lines = [];
  let cur = '';
  for (const tok of tokens) {
    const next = cur + tok;
    if (textW(next, size) > maxW && cur.trim()) {
      lines.push(cur.trim());
      cur = tok.trim() ? tok : '';
    } else cur = next;
  }
  if (cur.trim()) lines.push(cur.trim());
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
  }
  return lines;
}

// ★{repo} → ★ 409；拿不到星数就整段去掉
export const fill = (s, stars) =>
  String(s).replace(/\s*★\{([\w.-]+)\}/g, (_, r) => (stars && stars[r] != null ? ` ★ ${stars[r]}` : ''));

export const FONTS = `
      .mono { font-family: 'JetBrains Mono','SF Mono',Menlo,Consolas,monospace; }
      .sans { font-family: 'PingFang SC','Noto Sans SC','Microsoft YaHei','Helvetica Neue',Arial,sans-serif; }`;
