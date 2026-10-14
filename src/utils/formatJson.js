export const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function token(v) {
  if (/^"https?:\/\/[^"]+"$/.test(v)) return `<a href="${v.slice(1, -1)}" target="_blank" rel="noopener">${v}</a>`;
  if (/^"[^"\s]+@[^"\s]+"$/.test(v)) return `<a href="mailto:${v.slice(1, -1)}">${v}</a>`;
  if (v[0] === '"') return `<b class="s">${v}</b>`;
  if (/^(true|false|null|-?\d)/.test(v)) return `<b class="n">${v}</b>`;
  return v;
}

function formatLine(line) {
  const m = line.match(/^(\s*)(?:("[^"]+"): )?(.*?)(,?)$/);
  return m[1] + (m[2] ? `<i>${m[2]}</i>: ` : '') + token(m[3]) + m[4];
}

// Turns an object into syntax-highlighted HTML lines (one string per line).
export const jsonToLines = (obj) =>
  escapeHtml(JSON.stringify(obj, null, 2)).split('\n').map(formatLine);