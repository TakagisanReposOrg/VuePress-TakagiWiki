/**
 * 审计规则元测试（回归用）
 *
 * 向 dist/ 注入一批已知的、内容层可复现的缺陷，检查 scripts/audit.mjs
 * 能否捕获。用途是防止审计规则出现盲区 —— 历史上先后出现过三类：
 *   - 只匹配 / 开头的站内相对链接，漏掉指向自身域名的绝对链接
 *   - 未解码 &amp; 实体，把正常引用的图片误判为孤儿资源
 *   - 未排除 <code> 区域，把正文里刻意展示的组件用法误判为解析失败
 *
 * 用法：pnpm test:audit   （需先 pnpm build）
 * 脚本会自行注入并清理探针文件。
 */
import { readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// 必须从脚本自身位置推导，不能硬编码绝对路径 —— 否则只在作者本机可用，
// 换到 CI / 其他克隆就会找不到 dist/
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PROBE_DIST = join(DIST, 'probe-section.html');
const PROBE_HTML = join(DIST, 'probe-target.html');
// 标题去重规则需要两个页面同时在场才能触发，单独用它跑两组用例
const PROBE_DUP = join(DIST, 'probe-dup.html');

if (!existsSync(DIST)) {
  console.error('未找到 dist/，请先执行 pnpm build');
  process.exit(2);
}

const cleanup = () => {
  for (const p of [PROBE_DIST, PROBE_HTML, PROBE_DUP]) rmSync(p, { force: true });
};

// 社交分享卡片基线。新规则（viewport / og:* / twitter:card）会检查这些，
// 探针页若不先补齐，18 个旧用例都会被新规则命中，测试就失去判别力。
const socialMeta = `<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="高木轻Wiki站">
<meta property="og:title" content="探针">
<meta property="og:description" content="探针描述">
<meta property="og:url" content="https://wiki.takagi3.cn/probe-section.html">
<meta property="og:image" content="https://wiki.takagi3.cn/assets/logo.webp">
<meta name="twitter:card" content="summary">`;

// 目标页：被探针链接的参照页
const targetHtml = `<!DOCTYPE html><html lang="zh-CN"><head><title>目标页</title>
<meta name="description" content="d"><link rel="canonical" href="https://wiki.takagi3.cn/probe-target.html">
${socialMeta}</head><body><h1>目标页</h1><h2 id="real-anchor">小节</h2></body></html>`;

const runAudit = () => {
  try {
    return execFileSync('node', [join(ROOT, 'scripts/audit.mjs')], { encoding: 'utf8' });
  } catch (e) {
    return (e.stdout ?? '') + (e.stderr ?? '');
  }
};

/**
 * 只看「属于探针页、且是针对该页内容的具体告警」。
 * 探针分区未登记进根 meta.json、也不在 sitemap 里，必然会各报一条
 * 「未被收录 / 未收录:」，这两条与用例无关，若不排除则任何用例都会被
 * 判为「已捕获」，测试就失去意义。
 */
const auditForProbe = () => {
  const out = runAudit();
  const lines = out.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/probe|探针/.test(l)) continue;
    if (/未被任何 meta\.json 收录/.test(l)) continue;
    if (/^ sitemap|^ 未收录:/.test(l.trim()) === false && /未收录:/.test(l)) continue;
    if (/^====|^审计范围|^✅|^合计|^⚠/.test(l)) continue;
    hits.push(l.trim());
  }
  return hits;
};

/** 每个用例：name -> [content, distHtml]，返回产物页 */
const mk = (body, metaTitle) => `<!DOCTYPE html><html lang="zh-CN"><head><title>${metaTitle ?? '探针'}</title>
<meta name="description" content="探针描述"><link rel="canonical" href="https://wiki.takagi3.cn/probe-section.html">
${socialMeta}</head><body><h1>探针</h1>${body}</body></html>`;

const cases = [
  ['站内死链',           mk('<a href="/guide/NoSuch.html">x</a>'), null],
  ['绝对自域名死链',     mk('<a href="https://wiki.takagi3.cn/guide/Nope.html">x</a>'), null],
  ['死锚点（跨页）',      mk('<a href="/probe-target.html#no-such-anchor">x</a>'), null],
  ['死锚点（页内）',      mk('<a href="#no-such-anchor">x</a>'), null],
  ['混合内容：图片',     mk('<img src="http://example.com/a.png" alt="a">'), null],
  ['混合内容：链接',     mk('<a href="http://example.com/page">外链</a>'), null],
  ['图片缺 alt',         mk('<img src="/music-album-cover/s1-ed.webp">'), null],
  ['图片地址不存在',     mk('<img src="/music-album-cover/nope.webp" alt="a">'), null],
  ['未转换的 ::: 语法',  mk('<p>::: warning 提示</p>'), null],
  ['未解析的组件标签',   mk('<p>&lt;Callout type="info"&gt;</p>'), null],
  ['缺少 canonical',     mk('<p>ok</p>').replace(/<link rel="canonical"[^>]*>/, ''), null],
  ['缺少 meta description', mk('<p>ok</p>').replace(/<meta name="description"[^>]*>/, ''), null],
  // 用 h2→h4 制造跳级：若写成 h1→h3，会先被上面新增的「多个 h1」规则命中，
  // 掩盖掉层级跳跃检测本身，测试就再也证明不了那条规则还有效
  ['标题层级跳跃 h2→h4', mk('<h2>二</h2><h4>四</h4>'), null],
  ['表格缺少表头',       mk('<table><tbody><tr><td>x</td></tr></tbody></table>'), null],
  ['空链接文本',         mk('<a href="/probe-target.html"></a>'), null],
  ['含义不明的链接文本', mk('<a href="/probe-target.html">点击这里</a>'), null],
  ['图标链接（负例，不应报出）', mk('<a href="/probe-target.html" aria-label="图标链接"><svg></svg></a>'), false],
  ['装饰图 alt=""（负例，不应报出）', mk('<img src="/music-album-cover/s1-ed.webp" alt="">'), false],
  ['元信息齐全（负例，不应报出）', mk('<p>正文</p>'), false],

  // --- 社交分享卡片与标题结构 ---
  ['多个 h1',             mk('<h1>甲</h1><h1>乙</h1>'), null],
  ['缺少 viewport',       mk('<p>ok</p>').replace(/<meta name="viewport"[^>]*>\n?/, ''), null],
  ['缺少 og:title',       mk('<p>ok</p>').replace(/<meta property="og:title"[^>]*>\n?/, ''), null],
  ['缺少 og:image',       mk('<p>ok</p>').replace(/<meta property="og:image"[^>]*>\n?/, ''), null],
  ['og:image 相对地址',    mk('<p>ok</p>').replace('https://wiki.takagi3.cn/assets/logo.webp"', 'assets/logo.webp"'), null],
  // 复现本站真实缺陷：og 标签被渲染到 <head> 之外（当初 og:image 就落在 <body> 起始处）
  ['og 元信息落在 head 外', mk('<p>ok</p>')
      .replace(/<meta property="og:title"[^>]*>\n?/, '')
      .replace('</head>', '</head><meta property="og:title" content="探针">'), null],
  ['缺少 twitter:card',   mk('<p>ok</p>').replace(/<meta name="twitter:card"[^>]*>\n?/, ''), null],
  ['description 为全站兜底值', mk('<p>ok</p>').replace('content="探针描述"', 'content="《擅长捉弄的高木同学》轻Wiki站"'), null],
];

// 探针只写入 dist/（构建产物），不触碰 content/ 源目录。
// 「未被 meta.json 收录」与「未收录进 sitemap」这两条与用例无关，
// auditForProbe() 会将其排除，因此无需在源目录里造一个分区。

const results = [];
try {
  writeFileSync(PROBE_HTML, targetHtml, 'utf8');
  for (const [name, html, expectCatch] of cases) {
    writeFileSync(PROBE_DIST, html, 'utf8');
    const hits = auditForProbe();
    // expectCatch 为 false 表示这是「不应被报出」的负例
    const shouldCatch = expectCatch !== false;
    const ok = shouldCatch ? hits.length > 0 : hits.length === 0;
    results.push({
      name,
      ok,
      msg: ok ? (hits[0] ?? '').slice(0, 56) : shouldCatch ? '' : `误报: ${hits[0] ?? ''}`.slice(0, 56),
    });
  }
} finally {
  // 无论是否抛错都必须清理，否则 dist/ 会残留探针文件
  cleanup();
}

/* ---- 标题 / 描述去重：需要两个页面同时在场，单独跑 ---- */
// PROBE_DUP 只在这些用例期间存在。否则它的标题与描述会与每个用例的探针页冲突，
// 把所有用例都变成「已捕获」，测试就失去判别力。
const dupPage = (canonical) => `<!DOCTYPE html><html lang="zh-CN"><head><title>探针</title>
<meta name="description" content="探针描述"><link rel="canonical" href="${canonical}">
${socialMeta}</head><body><h1>探针</h1><p>正文</p></body></html>`;

for (const [name, keyword, canonical, expectCatch] of [
  ['标题重复', '标题', 'https://wiki.takagi3.cn/probe-dup.html', null],
  ['标题重复但 canonical 相同（负例）', '标题', 'https://wiki.takagi3.cn/probe-section.html', false],
  ['description 重复', 'description', 'https://wiki.takagi3.cn/probe-dup.html', null],
  ['description 重复但 canonical 相同（负例）', 'description', 'https://wiki.takagi3.cn/probe-section.html', false],
]) {
  try {
    writeFileSync(PROBE_HTML, targetHtml, 'utf8');
    writeFileSync(PROBE_DUP, dupPage(canonical), 'utf8');
    writeFileSync(PROBE_DIST, mk('<p>正文</p>'), 'utf8');
    const hits = auditForProbe();
    const dup = hits.filter((h) => h.includes(keyword) && h.includes('重复'));
    const shouldCatch = expectCatch !== false;
    const ok = shouldCatch ? dup.length > 0 : dup.length === 0;
    results.push({
      name,
      ok,
      msg: ok
        ? (dup[0] ?? '').slice(0, 56)
        : shouldCatch
          ? ''
          : `误报: ${dup[0] ?? ''}`.slice(0, 56),
    });
  } finally {
    cleanup();
  }
}

console.log('==== 审计规则元测试结果 ====\n');
let blind = 0, falsePositive = 0;
for (const r of results) {
  const isBlind = !r.ok && r.msg === '';
  const isFp = r.msg.startsWith('误报');
  if (isBlind) blind++;
  if (isFp) falsePositive++;
  const tag = r.ok ? '✅ 通过' : isBlind ? '❌ 盲区' : '⚠ 误报';
  console.log(`  ${tag}  ${r.name.padEnd(20)} ${r.msg}`);
}
console.log(`\n  共 ${results.length} 项 —— 盲区 ${blind} 项，误报 ${falsePositive} 项`);

cleanup();
console.log('\n  探针文件已清理');
