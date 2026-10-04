/**
 * 构建后处理：兼容旧站（VuePress）的目录式 URL。
 *
 * - 有 index 页面的分区（music/anime）：把 /music.html 复制为 /music/index.html，
 *   这样旧链接 /music/ 直接返回真实页面。
 * - 其余分区与指南：生成 meta-refresh 跳转页，把 /guide/ 等旧目录 URL
 *   指向对应的 .html 页面。
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const COPIES = ['music', 'anime'];
const REDIRECTS = {
  guide: '/guide/Home.html',
  manga: '/manga/Takagi-OG.html',
  role: '/role/Takagi-OG.html',
  derivative: '/derivative/McsClub.html',
  goods: '/goods/Offical.html',
  other: '/other/Info.html',
};

function redirectPage(url) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>Redirecting…</title><meta http-equiv="refresh" content="0; url=${url}"><link rel="canonical" href="${url}"></head><body>Redirecting to <a href="${url}">${url}</a></body></html>\n`;
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
  writeFileSync(path.join(dist, sec, 'index.html'), redirectPage(url));
  console.log(`[ok] /${sec}/ -> ${url} (redirect)`);
}
