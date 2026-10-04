/**
 * VuePress → Astro + Fumadocs 内容迁移脚本
 *
 * 用法：pnpm migrate
 * 读取 docs/**.md，转换为 content/docs/**.mdx：
 *  - 容器 ::: tip/info/details → <Callout> / <details>
 *  - ::: tabs + @tab → <Tabs items> + <Tab value>
 *  - HTML 规范化为合法 JSX（img 自闭合、去 style 字符串、引号属性、<br />）
 *  - 站内链接统一为 .html（与旧站 URL 一致）
 *  - README.md → index.mdx；people/ → role/（修正导航与目录不一致的存量 bug）
 *  - 生成各分区 meta.json 与根 meta.json
 *  - 静态资源复制到 public/
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDocs = path.join(repoRoot, 'docs');
const outDocs = path.join(repoRoot, 'content', 'docs');
const outPublic = path.join(repoRoot, 'public');

// ---------- 安全护栏 ----------
// 这是一次性迁移脚本，且具破坏性：它会先整目录删除 content/docs 再重新生成。
// 护栏必须放在任何 walk()/readdirSync() 之前，否则报错会先于提示抛出。
// 两种情况一律直接退出，避免误跑导致内容不可恢复地丢失：
//   1) 迁移源 docs/ 不存在（VuePress 旧站已在迁移时删除，脚本已不可能成功）
//   2) 目标 content/docs 已有内容（内容此后经人工编辑与补充，覆盖即丢失）
const force = process.argv.includes('--force');

if (!existsSync(srcDocs)) {
  console.error(
    '[中止] 未找到迁移源目录 docs/。\n' +
      '       VuePress 旧站内容已在迁移时删除，本脚本无法再运行。\n' +
      '       如确需重建内容，请从 Git 历史取回旧目录后再执行。',
  );
  process.exit(1);
}

if (existsSync(outDocs) && readdirSync(outDocs).length > 0 && !force) {
  console.error(
    '[中止] 目标目录 content/docs/ 已有内容，本脚本会先清空它再重建。\n' +
      '       现有内容包含迁移后的人工编辑与补充，覆盖后无法恢复。\n' +
      '       确认要覆盖请显式加 --force 参数。',
  );
  process.exit(1);
}

// ---------- 收集文件 ----------
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const SKIP_DIRS = ['.vuepress', 'superpowers'];
const allFiles = walk(srcDocs).filter((f) => {
  const rel = path.relative(srcDocs, f);
  return !SKIP_DIRS.some((d) => rel.split(path.sep)[0] === d);
});

// ---------- 结构转换 ----------
const CALLOUT_TYPE = {
  tip: 'idea',
  info: 'info',
  note: 'info',
  warning: 'warn',
  caution: 'warn',
  important: 'warn',
  danger: 'error',
};

function parseBlocks(lines, marks = { mermaid: false }) {
  const out = [];
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!inFence) {
      // ```mermaid 围栏 → <Mermaid> island
      const mm = line.match(/^```mermaid\s*$/);
      if (mm) {
        const chartLines = [];
        let j = i + 1;
        while (j < lines.length && !/^```\s*$/.test(lines[j])) {
          chartLines.push(lines[j]);
          j++;
        }
        out.push(`<Mermaid client:load chart={${JSON.stringify(chartLines.join('\n'))}} />`);
        marks.mermaid = true;
        i = j + 1;
        continue;
      }
    }
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      i++;
      continue;
    }
    if (!inFence) {
      const open = line.match(/^:::\s*(\w+)\s*(.*)$/);
      if (open) {
        const [, type, rest] = open;
        // 收集到配对的 :::（按深度，支持嵌套容器）
        let depth = 1;
        const inner = [];
        let j = i + 1;
        while (j < lines.length && depth > 0) {
          const l = lines[j];
          if (/^:::\s*\w+/.test(l)) depth++;
          else if (/^:::\s*$/.test(l)) {
            depth--;
            if (depth === 0) break;
          }
          inner.push(l);
          j++;
        }
        const content = parseBlocks(inner);
        if (type === 'tabs') {
          out.push(...renderTabs(content));
        } else {
          out.push(...renderContainer(type, rest.trim(), content));
        }
        i = j + 1;
        continue;
      }
    }
    out.push(line);
    i++;
  }
  return out;
}

function renderTabs(lines) {
  const tabs = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^@tab\s+(.*)$/);
    if (m) {
      current = { name: m[1].trim(), lines: [] };
      tabs.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (tabs.length === 0) return lines;
  const out = [];
  out.push(`<Tabs client:load items={[${tabs.map((t) => JSON.stringify(t.name)).join(', ')}]}>`);
  for (const t of tabs) {
    out.push(`<Tab value=${JSON.stringify(t.name)}>`);
    out.push('');
    out.push(...t.lines);
    out.push('');
    out.push(`</Tab>`);
  }
  out.push('</Tabs>');
  return out;
}

function renderContainer(type, title, lines) {
  // 去掉内容首尾空行，再统一加回
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  if (type === 'details') {
    return [
      '<details>',
      `<summary>${title || '详情'}</summary>`,
      '',
      ...lines,
      '',
      '</details>',
    ];
  }
  const calloutType = CALLOUT_TYPE[type] ?? 'info';
  const titleAttr = title ? ` title=${JSON.stringify(title)}` : '';
  return [`<Callout type="${calloutType}"${titleAttr}>`, '', ...lines, '', '</Callout>'];
}

// ---------- HTML / 链接规范化（跳过代码围栏） ----------
function normalizeHtmlAndLinks(body, relDir) {
  const lines = body.split('\n');
  let inFence = false;
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    // Mermaid 组件的 chart JSON 属性不做任何改写
    if (line.startsWith('<Mermaid')) return line;

    let s = line;
    // HopeIcon 等旧主题组件直接移除
    s = s.replace(/<HopeIcon[^>]*\/>/g, '');
    // <br> 统一为 <br />
    s = s.replace(/<br\s*\/?>/gi, '<br />');
    // <img> 自闭合
    s = s.replace(/<img\b([^>]*?)\s*\/?>/g, '<img$1 />');
    // JSX 不接受字符串 style 属性
    s = s.replace(/\s+style="[^"]*"/g, '');
    // 无引号属性补引号
    s = s.replace(/\s(width|height|border|alt|title|align)=([^\s"'>/]+)/g, ' $1="$2"');
    // 站内链接统一 .html
    s = s.replace(/\]\(([^)\s]+)\)/g, (full, target) => {
      if (/^(https?:|mailto:|#)/.test(target)) return full;
      if (target.startsWith('/')) {
        if (target === '/') return full;
        return `](${ensureHtml(target)})`;
      }
      if (/\.mdx?$/.test(target)) {
        return `](${ensureHtml('/' + path.posix.join(relDir, target))})`;
      }
      return full;
    });
    return s;
  });
  return out.join('\n');
}

/** 把连续出现（允许空行间隔）的 <SiteInfo/>/<VPCard/> 组合包进 <Cards> */
function wrapCardGroups(body) {
  const lines = body.split('\n');
  const out = [];
  let i = 0;
  const isCardStart = (l) => /^[ \t]*<(?:SiteInfo|VPCard)\b/.test(l);
  while (i < lines.length) {
    if (!isCardStart(lines[i])) {
      out.push(lines[i++]);
      continue;
    }
    const group = [];
    let j = i;
    while (j < lines.length) {
      if (isCardStart(lines[j])) {
        // 收集到自闭合结束（/> 单独成行或行尾）
        while (j < lines.length && !/\/>\s*$/.test(lines[j])) group.push(lines[j++]);
        if (j < lines.length) group.push(lines[j++]);
        // 预看：若紧跟着（允许一个空行）仍是卡片标签则继续收集
        let k = j;
        if (lines[k]?.trim() === '') k++;
        if (isCardStart(lines[k] ?? '')) {
          while (j < k) group.push(lines[j++]);
          continue;
        }
        break;
      }
      break;
    }
    out.push('<Cards>', ...group, '</Cards>');
    i = j;
  }
  return out.join('\n');
}

function ensureHtml(target) {
  let p = target;
  let hash = '';
  const hi = p.indexOf('#');
  if (hi >= 0) {
    hash = p.slice(hi);
    p = p.slice(0, hi);
  }
  p = p.replace(/\.mdx?$/, '');
  const last = p.split('/').pop() ?? '';
  if (!last.includes('.')) p += '.html';
  return p + hash;
}

// ---------- 指定文件的内容修订 ----------
const CONTENT_EDITS = new Map([
  [
    'guide/Home.md',
    [
      [
        '站点已开启PWA（渐进式应用）支持！如果你的浏览器支持此特性，将会在本地缓存部分站点资源加快你的访问速度。',
        '站点已启用全站搜索与深色模式，欢迎体验！',
      ],
    ],
  ],
  [
    'other/Info.md',
    [
      [
        `[VuePress](https://vuepress.js.org)和[VitePress](https://vitepress.dev/)为我们的两个项目  
[高木同学资料站（VuePress)](https://wiki.takagi3.cn)  
[高木站点导航（VitePress）](https://takagi3.cn)  
提供了核心框架驱动支持`,
        `[Astro](https://astro.build)与[Fumadocs](https://fumadocs.dev)为本站提供了核心框架驱动支持：  
[高木同学资料站（Astro + Fumadocs）](https://wiki.takagi3.cn)  
[高木站点导航（VitePress）](https://takagi3.cn)`,
      ],
      [
        `使用相关主题为[VuePress Hope](https://theme-hope.vuejs.press)，
同时使用[Docsearch](https://docsearch.algolia.com/)为本站提供文档搜索支持，DocSearch作为外部搜索可以加速访客在本站点的查找需求内容的速度，
使用到的其他插件或依赖：
1. [Vuepress-Plugin-Mdenhance](https://plugin-md-enhance.vuejs.press/zh/)：为站点启用更多Markdown语法与新功能
2. [Waline](https://waline.js.org)：为站点启用评论功能
3. [Vuepress-Plugin-Components](https://plugin-components.vuejs.press/)：为站点激活了嵌入组件的功能  
4. [Deta Space](https://deta.space)：站点部分插件与依赖资源部署于Deta Space`,
        `使用 [Fumadocs UI](https://fumadocs.dev) 作为文档界面主题，并使用静态全文搜索为本站提供文档搜索支持。
使用到的其他插件或依赖：
1. [Waline](https://waline.js.org)：为站点启用评论功能
2. [Mermaid](https://mermaid.js.org)：为站点提供图表渲染支持
3. [Deta Space](https://deta.space)：站点部分插件与依赖资源部署于Deta Space`,
      ],
    ],
  ],
]);

// ---------- 主流程 ----------
rmSync(outDocs, { recursive: true, force: true });
mkdirSync(outDocs, { recursive: true });

const pages = [];
for (const file of allFiles) {
  if (!/\.(md|markdown)$/.test(file)) continue;
  const rel = path.relative(srcDocs, file).replaceAll('\\', '/');
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // frontmatter
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let fm = {};
  let body = raw;
  if (fmMatch) {
    body = raw.slice(fmMatch[0].length);
    for (const line of fmMatch[1].split('\n')) {
      const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
      if (m) fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  if (!fm.title) fm.title = path.basename(rel, path.extname(rel));

  // 内容修订
  const edits = CONTENT_EDITS.get(rel);
  if (edits) {
    for (const [from, to] of edits) {
      if (!body.includes(from)) {
        console.warn(`[warn] 未命中内容修订锚点：${rel}`);
      }
      body = body.replace(from, to);
    }
  }

  // 结构与语法转换
  const marks = { mermaid: false };
  body = parseBlocks(body.split(/\r?\n/), marks).join('\n');
  const relDir = path.posix.dirname(rel === 'index.md' ? '' : rel);
  body = normalizeHtmlAndLinks(body, relDir === '.' ? '' : relDir);

  // 连续的 SiteInfo/VPCard 包进 <Cards> 网格（还原原站多列卡片布局）
  body = wrapCardGroups(body);

  // 去掉与 title 重复的起始 H1
  const h1 = `# ${fm.title}`;
  const stripped = body.replace(new RegExp(`^\\s*${h1}\\s*\\r?\\n`), '');
  body = stripped;

  // 输出路径：README → index；people → role；.md → .mdx
  let outRel = rel.replace(/\.md$/, '.mdx').replace(/(^|\/)README\.mdx$/, '$1index.mdx');
  outRel = outRel.replace(/^people\//, 'role/');
  if (rel === 'index.md') continue; // 首页由 src/pages/index.astro 提供

  const outPath = path.join(outDocs, outRel);
  mkdirSync(path.dirname(outPath), { recursive: true });

  const front = ['---', `title: ${JSON.stringify(fm.title)}`];
  if (fm.author && fm.author !== 'false') {
    front.push(`authors: [${JSON.stringify(fm.author)}]`);
  }
  front.push('---', '');

  // client:load 指令要求在 MDX 内直接导入组件
  const imports = [];
  if (body.includes('<Tabs ')) imports.push("import { Tabs, Tab } from '@/components/tabs';");
  if (marks.mermaid) imports.push("import Mermaid from '@/components/mermaid';");
  if (imports.length > 0) front.push(...imports, '');

  writeFileSync(outPath, front.join('\n') + '\n' + body.replace(/^\n+/, '') + '\n');
  pages.push(outRel);
  console.log(`[ok] ${rel} -> ${outRel}`);
}

// ---------- meta.json ----------
const META = {
  'meta.json': {
    title: '高木轻Wiki站',
    pages: ['guide', 'music', 'manga', 'anime', 'role', 'derivative', 'goods', 'other'],
  },
  'guide/meta.json': {
    title: '指南',
    defaultOpen: true,
    pages: ['Home', 'PullStart'],
  },
  'music/meta.json': { title: '音乐', pages: ['index', 'OP', 'ED', 'OST', 'GAME'] },
  'manga/meta.json': {
    title: '漫画',
    pages: ['Takagi-OG', 'Spinoff-Moto', 'Spinoff-Tis', 'Spinoff-Yukari'],
  },
  'anime/meta.json': { title: '动画', pages: ['index', 'S1', 'S2', 'S3', 'Movie'] },
  'role/meta.json': { title: '角色', pages: ['Takagi-OG', 'Takagi-OH'] },
  'derivative/meta.json': {
    title: '衍生/社群',
    pages: ['McsClub', 'Related-Book', 'Related-Software'],
  },
  'goods/meta.json': { title: '商品/周边', pages: ['Offical', 'Officalip'] },
  'other/meta.json': {
    title: '其他',
    pages: ['Info', 'Action', 'Pay', 'List', 'License'],
  },
};
for (const [rel, data] of Object.entries(META)) {
  const p = path.join(outDocs, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

// ---------- 静态资源 ----------
if (existsSync(path.join(srcDocs, '.vuepress', 'public'))) {
  execSync(
    `robocopy "${path.join(srcDocs, '.vuepress', 'public')}" "${outPublic}" /E /NFL /NDL /NJH /NJS /NP || exit 0`,
    { stdio: 'inherit', shell: 'cmd.exe' },
  );
}
writeFileSync(path.join(outPublic, 'CNAME'), 'wiki.takagi3.cn\n');

// ---------- Hero Logo ----------
const logoPath = path.join(outPublic, 'assets', 'logo.webp');
if (!existsSync(logoPath)) {
  try {
    execSync(
      'curl -fsSL --max-time 30 https://pic.imgdb.cn/item/65702291c458853aef1fcc8c.webp -o ' +
        JSON.stringify(logoPath),
    );
    console.log('[ok] 已下载站点 logo');
  } catch {
    console.warn('[warn] logo 下载失败，可稍后手动放置 public/assets/logo.webp');
  }
}

console.log(`\n完成：${pages.length} 个页面已迁移到 content/docs/`);
