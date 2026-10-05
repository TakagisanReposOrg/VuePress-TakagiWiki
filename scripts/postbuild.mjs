/**
 * 构建后处理：兼容旧站（VuePress）的目录式 URL，并生成 llms.txt。
 *
 * - 有 index 页面的分区（music/anime）：把 /music.html 复制为 /music/index.html，
 *   这样旧链接 /music/ 直接返回真实页面。
 * - 其余分区与指南：生成 meta-refresh 跳转页，把 /guide/ 等旧目录 URL
 *   指向对应的 .html 页面。
 * - llms.txt：按页树自动生成 AI 代理用的页面索引。
 */
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content/docs');
const SITE = 'https://wiki.takagi3.cn';

const COPIES = ['music', 'anime'];
const REDIRECTS = {
  guide: '/guide/Home.html',
  manga: '/manga/Takagi-OG.html',
  role: '/role/Takagi-OG.html',
  derivative: '/derivative/McsClub.html',
  goods: '/goods/Offical.html',
  other: '/other/Info.html',
};

function redirectPage(url, title) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta http-equiv="refresh" content="0; url=${url}"><link rel="canonical" href="${url}"></head><body>Redirecting to <a href="${url}">${url}</a></body></html>\n`;
}

// 沿用目标页的 <title>，避免所有跳转桩共用「Redirecting…」造成全站标题重复
function titleOf(target) {
  try {
    return (
      readFileSync(path.join(dist, target), 'utf8').match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ||
      'Redirecting…'
    );
  } catch {
    return 'Redirecting…';
  }
}

for (const sec of COPIES) {
  const src = path.join(dist, `${sec}.html`);
  if (!existsSync(src)) continue;
  mkdirSync(path.join(dist, sec), { recursive: true });
  copyFileSync(src, path.join(dist, sec, 'index.html'));
  console.log(`[ok] /${sec}/ <- ${sec}.html (copy)`);
}

for (const [sec, url] of Object.entries(REDIRECTS)) {
  mkdirSync(path.join(dist, sec), { recursive: true });
  writeFileSync(path.join(dist, sec, 'index.html'), redirectPage(url, titleOf(url)));
  console.log(`[ok] /${sec}/ -> ${url} (redirect)`);
}

/* ========== llms.txt ========== */
// 直接读页树生成，不手写清单：手写的索引迟早会与实际内容脱节，而 llms.txt 的
// 全部价值就在于「让 AI 代理知道该读哪一页」。顺序与标题都取自各分区的
// meta.json，因此和侧边栏天然一致。
// 只给 .html 真实地址 —— 旧目录 URL（/guide/ 等）是跳转中转页。
function generateLlmsTxt() {
  const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const root = readJson(path.join(CONTENT, 'meta.json'));
  const out = [
    '# 高木同学轻 Wiki（Takagi-san Light Wiki）',
    '',
    '《擅长捉弄的高木同学》（からかい上手の高木さん）主题轻量 Wiki，由木创社（Takagi Project）维护。',
    '',
    `- 主域名：${SITE}`,
    `- 站点地图：${SITE}/sitemap-index.xml`,
    '',
    '## 页面索引',
    '',
    '页面为 `.html` 结尾的静态页。以下清单按页树顺序自动生成，与站内侧边栏一致。',
    '',
  ];
  const missing = [];
  let count = 0;

  for (const sec of root.pages ?? []) {
    const meta = readJson(path.join(CONTENT, sec, 'meta.json'));
    out.push(`## ${meta.title ?? sec}`, '');
    for (const base of meta.pages ?? []) {
      // 分区的 index 页由 Fumadocs 路由成 /<sec>.html，而不是 /<sec>/index.html
      const url = base === 'index' ? `/${sec}.html` : `/${sec}/${base}.html`;
      const file = path.join(dist, url.replace(/^\//, ''));
      if (!existsSync(file)) {
        missing.push(url);
        continue;
      }
      const html = readFileSync(file, 'utf8');
      // HTML 里的 & 会被转义成 &amp;，直接搬进 markdown 会露出实体
      const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? base);
      // 描述里若含方括号会截断 markdown 链接，先转义
      const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
        .replace(/([\[\]])/g, '\\$1')
        .trim();
      out.push(`- [${title}](${SITE}${url})${desc ? `：${desc}` : ''}`);
      count++;
    }
    out.push('');
  }

  if (missing.length) {
    // 页树声明了却没构建出来，说明 getStaticPaths 与 meta.json 已经脱节
    console.error(`[fail] llms.txt 页树声明了但产物中不存在: ${missing.join(', ')}`);
    process.exitCode = 1;
  }
  writeFileSync(path.join(dist, 'llms.txt'), out.join('\n').trimEnd() + '\n', 'utf8');
  console.log(`[ok] llms.txt <- 页树自动生成（${count} 个页面）`);
}

generateLlmsTxt();
