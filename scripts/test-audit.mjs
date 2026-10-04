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
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'D:/Takagi/VuePress-TakagiWiki';
const DIST = join(ROOT, 'dist');
const PROBE_SRC = join(ROOT, 'content/docs/probe-section');
const PROBE_DIST = join(DIST, 'probe-section.html');
const PROBE_HTML = join(DIST, 'probe-target.html');

mkdirSync(PROBE_SRC, { recursive: true });

// 目标页：被探针链接的参照页
const targetHtml = `<!DOCTYPE html><html lang="zh-CN"><head><title>t</title>
<meta name="description" content="d"><link rel="canonical" href="https://wiki.takagi3.cn/probe-target.html">
</head><body><h1>目标页</h1><h2 id="real-anchor">小节</h2></body></html>`;
writeFileSync(PROBE_HTML, targetHtml, 'utf8');

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
</head><body><h1>探针</h1>${body}</body></html>`;

const cases = [
  ['站内死链',           mk('<a href="/guide/NoSuch.html">x</a>'), null],
  ['绝对自域名死链',     mk('<a href="https://wiki.takagi3.cn/guide/Nope.html">x</a>'), null],
  ['死锚点',             mk('<a href="/probe-target.html#no-such-anchor">x</a>'), null],
  ['图片缺 alt',         mk('<img src="/music-album-cover/s1-ed.webp">'), null],
  ['图片地址不存在',     mk('<img src="/music-album-cover/nope.webp" alt="a">'), null],
  ['未转换的 ::: 语法',  mk('<p>::: warning 提示</p>'), null],
  ['未解析的组件标签',   mk('<p>&lt;Callout type="info"&gt;</p>'), null],
  ['缺少 canonical',     mk('<p>ok</p>').replace(/<link rel="canonical"[^>]*>/, ''), null],
  ['缺少 meta description', mk('<p>ok</p>').replace(/<meta name="description"[^>]*>/, ''), null],
  ['标题层级跳跃 h1→h3', mk('<h1>一</h1><h3>三</h3>'), null],
  ['表格缺少表头',       mk('<table><tbody><tr><td>x</td></tr></tbody></table>'), null],
  ['空链接文本',         mk('<a href="/probe-target.html"></a>'), null],
  ['含义不明的链接文本', mk('<a href="/probe-target.html">点击这里</a>'), null],
];

// 让页树能识别该分区，否则先被「未被 meta.json 收录」掩盖
writeFileSync(join(PROBE_SRC, 'meta.json'), JSON.stringify({ title: '探针分区', pages: ['index'] }), 'utf8');
writeFileSync(join(PROBE_SRC, 'index.mdx'), '---\ntitle: "探针"\n---\n', 'utf8');

const results = [];
for (const [name, html] of cases) {
  writeFileSync(PROBE_DIST, html, 'utf8');
  const hits = auditForProbe();
  results.push({ name, caught: hits.length > 0, msg: hits[0] ?? '' });
}

console.log('==== 审计规则元测试结果 ====\n');
let blind = 0;
for (const r of results) {
  console.log(`  ${r.caught ? '✅ 已捕获' : '❌ 盲区  '}  ${r.name.padEnd(20)} ${r.msg.slice(0, 62)}`);
  if (!r.caught) blind++;
}
console.log(`\n  共 ${results.length} 项，盲区 ${blind} 项`);

// 清理
rmSync(PROBE_DIST, { force: true });
rmSync(PROBE_HTML, { force: true });
rmSync(PROBE_SRC, { recursive: true, force: true });
console.log('\n  探针文件已清理');
