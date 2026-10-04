/**
 * 站点构建产物审计
 *
 * 覆盖六类检查：页树漂移、SEO 元信息、sitemap 覆盖度、站内死链、
 * 组件未解析残留、静态资源缺失。
 *
 * 依赖 `dist/` 为最新构建产物，用法：
 *   pnpm verify     # build + audit
 *   pnpm audit      # 仅审计现有 dist
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

const isStub = (html) => /http-equiv="refresh"/.test(html);

for (const f of htmls) {
  const url = rel(f, DIST);
  const html = await readFile(f, 'utf8');
  const stub = isStub(html);

  /* --- SEO --- */
  if (url !== '/404.html' && !stub) {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
    if (!title) add('SEO', `${url} 缺少 <title>`);
    else if (/undefined|\[object|NaN/.test(title)) add('SEO', `${url} title 异常: ${title}`);
    if (!desc) add('SEO', `${url} 缺少 meta description`);
    if (!/<html[^>]+lang="/.test(html)) add('SEO', `${url} 缺少 <html lang>`);
    if (!/rel="canonical"/.test(html)) add('SEO', `${url} 缺少 canonical`);
  }

  /* --- 可访问性：图片替代文本 --- */
  // 装饰性图片也应有 alt=""（空值表示纯装饰），完全没有 alt 属性则会被
  // 读屏软件读出文件名，属于可访问性缺陷。
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const bare = imgs.filter((t) => !/\balt\s*=/.test(t));
  if (bare.length)
    add('可访问性', `${url} 有 ${bare.length} 个 <img> 缺少 alt 属性${bare.length === 1 ? '：' + (bare[0].match(/src="([^"]*)"/)?.[1] ?? '') : ''}`);

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

  /* --- 站内死链 --- */
  const selfDir = dirname(url);
  // 同时覆盖站内相对链接与指向自身域名的绝对链接（后者此前是盲区）
  for (const m of html.matchAll(
    new RegExp(`href="(?:${ORIGIN})?(/[^"#?]*)"`, 'g'),
  )) {
    const t = decodeURIComponent(m[1]);
    if (t === '/') continue;
    if (
      distSet.has(t) || distSet.has(t + '.html') || distSet.has(t + '/index.html') ||
      distSet.has(t.replace(/\/$/, '') + '/index.html')
    ) continue;
    add('死链', `${url} -> ${t}`);
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
