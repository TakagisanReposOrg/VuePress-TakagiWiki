/**
 * 站点构建产物审计
 *
 * 覆盖 11 大类检查：页树漂移、SEO 元信息与社交分享卡片、sitemap 覆盖度、
 * 站内死链与锚点、组件未解析残留、静态资源缺失、可访问性、混合内容、
 * 站点元文件、孤儿资源。
 *
 * 依赖 `dist/` 为最新构建产物，用法：
 *   pnpm verify     # build + audit
 *   pnpm check      # 仅审计现有 dist
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'content/docs');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://wiki.takagi3.cn';

const walk = async (dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    e.isDirectory() ? await walk(p, out) : out.push(p);
  }
  return out;
};

const rel = (f, base) => '/' + relative(base, f).replace(/\\/g, '/');
const exists = async (p) => {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
};

const issues = [];
const warns = [];
const add = (cat, msg) => issues.push([cat, msg]);
const warn = (cat, msg) => warns.push([cat, msg]);

/* ========== 1. 页树漂移 ========== */
// 根 meta.json 的条目是目录名，分区 meta.json 的条目是页面基名。
const srcPages = (await walk(SRC)).filter((f) => /\.(mdx|md)$/.test(f));
const declared = new Set();

for (const meta of (await walk(SRC)).filter((f) => f.endsWith('meta.json'))) {
  const isRoot = dirname(meta) === SRC;
  const dir = dirname(meta);
  let json;
  try {
    json = JSON.parse(await readFile(meta, 'utf8'));
  } catch (e) {
    add('页树', `${rel(meta, SRC)} 不是合法 JSON: ${e.message}`);
    continue;
  }
  for (const entry of json.pages ?? []) {
    const asFile = join(dir, `${entry}.mdx`);
    const asFolder = join(dir, entry);
    // 根目录条目指向分区（要求该目录有自己的 meta.json），分区条目指向页面
    const ok = isRoot
      ? (await exists(join(asFolder, 'meta.json'))) || (await exists(asFile))
      : (await exists(asFile)) || (await exists(join(asFolder, 'index.mdx')));
    if (!ok) {
      add('页树', `${rel(meta, SRC)} 声明的条目无法解析: "${entry}"`);
    } else {
      declared.add(await exists(asFile) ? asFile : join(asFolder, 'index.mdx'));
    }
  }
}

for (const p of srcPages) {
  if (!declared.has(p)) add('页树', `${rel(p, SRC)} 未被任何 meta.json 收录（侧边栏不可见）`);
}

/* ========== 2~6. 产物检查 ========== */
const distFiles = await walk(DIST);
const htmls = distFiles.filter((f) => f.endsWith('.html'));
const distSet = new Set(distFiles.map((f) => rel(f, DIST)));

// 锚点校验需要知道每页有哪些 id
const idsByPage = new Map();
// 标题去重。同一标题若出现在两个规范地址不同的页面上，属于真正的内容重复；
// 规范地址相同的则是旧站 URL 兼容（同一页的两个入口），刻意合并，不算问题。
const titleSeen = new Map();
for (const f of htmls) {
  const c = await readFile(f, 'utf8');
  const ids = new Set();
  for (const m of c.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  for (const m of c.matchAll(/<a[^>]+name="([^"]+)"/g)) ids.add(m[1]);
  idsByPage.set(rel(f, DIST), ids);
}

const isStub = (html) => /http-equiv="refresh"/.test(html);

for (const f of htmls) {
  const url = rel(f, DIST);
  const html = await readFile(f, 'utf8');
  const stub = isStub(html);

  /* --- SEO --- */
  // 跳转桩由 postbuild 生成，只有 charset/canonical/refresh，刻意不带社交卡片
  // 与 viewport 之外的任何元信息，因此整类 SEO 检查都要排除它。
  const isContentPage = url !== '/404.html' && !stub;
  if (isContentPage) {
    const head = html.slice(0, html.indexOf('</head>') + 7);
    const title = head.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    const desc = head.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
    if (!title) add('SEO', `${url} 缺少 <title>`);
    else if (/undefined|\[object|NaN/.test(title)) add('SEO', `${url} title 异常: ${title}`);
    if (!desc) add('SEO', `${url} 缺少 meta description`);
    if (!/<html[^>]+lang="/.test(html)) add('SEO', `${url} 缺少 <html lang>`);
    if (!/rel="canonical"/.test(html)) add('SEO', `${url} 缺少 canonical`);
    if (!/name="viewport"/.test(head)) add('SEO', `${url} 缺少 viewport（移动端会按 980px 缩放渲染）`);

    // 社交分享卡片。必须落在 <head> 内：写在 <body> 起始处时，
    // Twitter / Facebook / Slack 等只解析 <head>，等于完全没写。
    for (const p of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image']) {
      if (!new RegExp(`property="${p}"`).test(head))
        add('SEO', `${url} 缺少 ${p}（分享到社交平台时没有标题/描述/预览图）`);
    }
    const ogImage = head.match(/property="og:image" content="([^"]*)"/)?.[1] ?? '';
    if (ogImage && !/^https?:\/\//.test(ogImage))
      add('SEO', `${url} og:image 是相对地址，部分抓取端会解析失败: ${ogImage}`);
    if (!/name="twitter:card"/.test(head)) add('SEO', `${url} 缺少 twitter:card`);

    // 社交元信息重复登记
    if (title) {
      const canonical = head.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? '';
      const seen = titleSeen.get(title);
      if (!seen) titleSeen.set(title, { canonical, url });
      // 标题相同但 canonical 不同 = 两页各被当成独立内容，是真正的重复；
      // canonical 相同的则是旧站 URL 兼容（同一页的两个入口），刻意合并，不算问题。
      else if (seen.canonical !== canonical)
        add('SEO', `${url} 标题「${title}」与 ${seen.url} 相同但规范地址不同，属于内容重复`);
    }
  }

  /* --- 可访问性：一级标题唯一 --- */
  // 页面标题由布局输出一个 h1，正文若还用 `#` 写小节就会变成多 h1，
  // 读屏用户会听到多个「标题一级」，且这些小节进不了右侧目录。
  if (isContentPage) {
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]{0,60}?)<\/h1>/g)];
    if (h1s.length > 1) {
      const texts = h1s.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      add('可访问性', `${url} 有 ${h1s.length} 个 <h1>（应恰为 1 个）：${texts.slice(0, 3).join(' / ')}`);
    }
  }

  /* --- 可访问性：图片替代文本 --- */
  // 装饰性图片也应有 alt=""（空值表示纯装饰），完全没有 alt 属性则会被
  // 读屏软件读出文件名，属于可访问性缺陷。
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const bare = imgs.filter((t) => !/\balt\s*=/.test(t));
  if (bare.length)
    add('可访问性', `${url} 有 ${bare.length} 个 <img> 缺少 alt 属性${bare.length === 1 ? '：' + (bare[0].match(/src="([^"]*)"/)?.[1] ?? '') : ''}`);

  /* --- 404 必须 noindex --- */
  // 托管平台会把 404.html 用于任何未命中路由；它没有 canonical，
  // 若不显式 noindex，薄内容页会被当作正常页面索引，稀释站点质量。
  if (url === '/404.html' && !/name="robots"[^>]*noindex/.test(html))
    add('SEO', `${url} 缺少 <meta name="robots" content="noindex">`);

  /* --- 组件未解析 --- */
  for (const tag of ['SiteInfo', 'VPCard', 'Callout', 'Mermaid', 'Tabs']) {
    if (new RegExp(`<${tag}[\\s/>]`).test(html)) add('组件', `${url} 残留未解析的 <${tag}>`);
  }
  // 行内代码 / 代码块里的组件标签是文档刻意展示的字面量，不算解析失败，
  // 因此先剔除这些区域再判断是否出现了真正未转换的标签。
  const withoutCode = html
    .replace(/<code[\s\S]*?<\/code>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '');
  if (/&lt;\/?(Callout|SiteInfo|Mermaid|VPCard|Tabs)\b/.test(withoutCode))
    add('组件', `${url} 正文出现被转义的组件标签（可能未在 components 映射中注册）`);
  // VuePress 时代的 ::: 容器语法在 Fumadocs 下不生效，会原样显示为正文
  if (/<p>:::\s*\w+/.test(withoutCode))
    add('组件', `${url} 出现未转换的 ::: 容器语法（应改用 <Callout type="..."> 组件）`);

  /* --- 站内死链与锚点 --- */
  const selfDir = dirname(url);
  // 同时覆盖站内相对链接与指向自身域名的绝对链接（后者此前是盲区）
  for (const m of html.matchAll(
    new RegExp(`href="(?:${ORIGIN})?(/[^"#?]*)(#[^"]*)?"`, 'g'),
  )) {
    const t = decodeURIComponent(m[1]);
    const hash = m[2] ? decodeURIComponent(m[2].slice(1)) : null;
    if (t === '/') {
      if (hash) add('锚点', `${url} -> /#${hash}  根页面无此 id`);
      continue;
    }
    const resolved = [t, t + '.html', t + '/index.html', t.replace(/\/$/, '') + '/index.html']
      .map((c) => (c.endsWith('/') ? c + 'index.html' : c))
      .find((c) => distSet.has(c));
    if (!resolved) {
      add('死链', `${url} -> ${t}`);
      continue;
    }
    if (hash) {
      const ids = idsByPage.get(resolved);
      if (ids && !ids.has(hash)) add('锚点', `${url} -> ${t}#${hash}  目标页无此 id`);
    }
  }

  /* --- 可访问性：链接文本 --- */
  // 无文本、或「点击这里」这类对读屏用户毫无信息的链接文本
  const VAGUE = /^(点击(这里|此处|跳转|进入)?|这里|此处|跳转|链接|更多|查看|read more|click here|here|more|link)$/i;
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const [, attrs, inner] = m;
    if (/\bdownload\b/i.test(attrs)) continue; // 下载类链接以资源名作文本
    const href = attrs.match(/href="([^"]*)"/)?.[1] ?? '';
    if (/^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    // 图标式链接（如导航栏的 GitHub）文本在 aria-label / title 上
    const aria = attrs.match(/\baria-label="([^"]+)"/)?.[1]
      ?? attrs.match(/\btitle="([^"]+)"/)?.[1] ?? '';
    const text = (aria || inner)
      .replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;|&#\d+;/gi, '')
      .trim();
    if (!text) add('可访问性', `${url} 存在无文本链接：${href.slice(0, 46)}`);
    else if (VAGUE.test(text))
      add('可访问性', `${url} 链接文本「${text}」含义不明：${href.slice(0, 46)}`);
  }

  /* --- 混合内容（http:// 资源） --- */
  // 本站为 https 站点。src 上的 http:// 会被浏览器直接拦截，图片根本不显示；
  // href 上的 http:// 只是导航，浏览器允许跳转，仅作提示。
  for (const m of html.matchAll(/<[a-z]+\b[^>]*\ssrc="(http:\/\/[^"]+)"/gi))
    add('混合内容', `${url} 的 <${m[0].match(/^<([a-z]+)/i)[1]}> 使用 http:// 资源，线上会被浏览器拦截：${m[1].slice(0, 56)}`);
  for (const m of html.matchAll(/<a\b[^>]*\shref="(http:\/\/[^"]+)"/gi))
    warn('混合内容', `${url} 存在 http:// 跳转链接（不拦截，但会提示不安全）：${m[1].slice(0, 56)}`);

  /* --- 页内锚点 --- */
  const ownIds = idsByPage.get(url) ?? new Set();
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    const t = decodeURIComponent(m[1]);
    if (!ownIds.has(t)) add('锚点', `${url} -> #${t}  本页无此 id`);
  }

  /* --- 可访问性：表格表头 --- */
  for (const m of html.matchAll(/<table\b[\s\S]*?<\/table>/gi)) {
    if (!/<th\b/i.test(m[0]))
      add('可访问性', `${url} 存在没有表头单元格（<th>）的表格，读屏无法说明各列含义`);
  }

  /* --- 可访问性：标题层级 --- */
  let prevLevel = 0;
  for (const m of html.matchAll(/<h([1-6])\b/gi)) {
    const lv = Number(m[1]);
    if (prevLevel && lv > prevLevel + 1) {
      add('可访问性', `${url} 标题层级由 h${prevLevel} 跳至 h${lv}（应逐级递进）`);
      break; // 一页只报一次，避免级联噪声
    }
    prevLevel = lv;
  }

  /* --- 图片资源 --- */
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    // 属性里的 & 会被转义成 &amp;，需先还原实体再解码
    const src = decodeURIComponent(m[1].replace(/&amp;/g, '&'));
    if (/^(https?:|data:)/.test(src)) continue;
    const p = src.startsWith('/') ? src : selfDir + '/' + src;
    if (!distSet.has(p)) add('资源', `${url} -> ${src}`);
  }
}

/* ========== 3. sitemap 覆盖度 ========== */
const smFiles = distFiles.filter((f) => /sitemap-\d+\.xml$/.test(f));
if (!smFiles.length) {
  add('sitemap', '未找到 sitemap-N.xml');
} else {
  const locs = [];
  for (const f of smFiles) {
    for (const m of (await readFile(f, 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      locs.push(m[1].replace(ORIGIN, ''));
    }
  }
  const inSm = new Set(locs);
  for (const f of htmls) {
    const url = rel(f, DIST);
    if (url === '/404.html' || url === '/index.html' || url.endsWith('/index.html')) continue;
    if (!inSm.has(url)) add('sitemap', `未收录: ${url}`);
  }
  for (const u of inSm) {
    // 根路径 / 在产物中对应 index.html
    const target = u === '/' ? '/index.html' : u;
    if (!htmls.some((f) => rel(f, DIST) === target)) add('sitemap', `指向不存在的页面: ${u}`);
  }
}

/* ========== 6. 站点元文件 ========== */
for (const [name, min] of [['llms.txt', 100], ['robots.txt', 20]]) {
  let text;
  try {
    text = await readFile(join(DIST, name), 'utf8');
  } catch {
    add('元文件', `${name} 不存在`);
    continue;
  }
  if (text.trim().length < min) add('元文件', `${name} 内容过短 (${text.trim().length} 字符)`);
  if (name === 'robots.txt' && !/User-agent:/i.test(text)) add('元文件', 'robots.txt 缺少 User-agent');

  // 元文件里给出的绝对地址必须真的存在，否则等于给 AI 代理指了一条死路
  for (const m of text.matchAll(new RegExp(`${ORIGIN}(/[^\\s)"'>]*)`, 'g'))) {
    const p = m[1];
    const target = p.endsWith('/') ? p + 'index.html' : p;
    if (distSet.has(target) || distSet.has(target + '.html') || distSet.has(target + '/index.html')) {
      // 命中了 postbuild 生成的 meta-refresh 跳转桩：可用但会让抓取方多跳一次
      try {
        if (/http-equiv="refresh"/.test(await readFile(join(DIST, target), 'utf8')))
          add('元文件', `${name} 引用了跳转中转页，建议改用真实内容页: ${p}`);
      } catch { /* 上面已判定存在 */ }
      continue;
    }
    add('元文件', `${name} 引用了不存在的地址: ${p}`);
  }
}

/* ========== 7. 孤儿静态资源（提示级，不阻断） ========== */
// 残留的模板演示图、废弃素材只会白白占用部署体积。
// CNAME / robots.txt / llms.txt 由托管平台与爬虫消费，不由 HTML 引用，属正常。
const PLATFORM_FILES = new Set(['CNAME', 'robots.txt', 'llms.txt']);
try {
  const htmlText = (
    await Promise.all(htmls.map(async (f) => (await readFile(f, 'utf8')).replace(/&amp;/g, '&')))
  ).join('\n');
  for (const f of await walk(join(ROOT, 'public'))) {
    const rel = relative(join(ROOT, 'public'), f).replace(/\\/g, '/');
    if (PLATFORM_FILES.has(rel)) continue;
    if (!htmlText.includes('/' + rel))
      warn('孤儿资源', `public/${rel}  未被任何页面引用（${Math.round((await readFile(f)).length / 1024)} KB）`);
  }
} catch {
  warn('孤儿资源', '未找到 public/ 目录，跳过检查');
}

/* ========== 报告 ========== */
console.log(`审计范围: ${htmls.length} 个 HTML / ${srcPages.length} 个源页面\n`);

if (warns.length) {
  const byCat = {};
  for (const [c, m] of warns) (byCat[c] ??= new Set()).add(m);
  for (const [cat, set] of Object.entries(byCat)) {
    console.log(`⚠ ${cat} (${set.size})  — 提示级，不影响构建结果`);
    [...set].forEach((x) => console.log('   ' + x));
  }
  console.log('');
}

if (!issues.length) {
  console.log('✅ 全部通过，无问题');
} else {
  const byCat = {};
  for (const [c, m] of issues) (byCat[c] ??= new Set()).add(m);
  for (const [cat, set] of Object.entries(byCat)) {
    console.log(`❌ ${cat} (${set.size})`);
    [...set].forEach((x) => console.log('   ' + x));
    console.log('');
  }
  console.log(`合计 ${new Set(issues.map((i) => i[1])).size} 个问题`);
  process.exitCode = 1;
}
