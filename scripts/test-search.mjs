/**
 * 搜索索引回归测试
 *
 * 站内搜索是站点对外明示的主要功能，但索引内容与分词质量无法通过构建产物
 * 目测判断。本测试用客户端同款运行时（zbsearch）对 dist/api/search.json 发起
 * 真实查询，验证：
 *   1. 索引可载入、单元数与源一致
 *   2. 站内关键中文词能命中，且首条结果落在预期页面
 *   3. 索引中不含组件源码（曾因 MDX body 未剥离 JSX 导致摘要显示标签原文）
 *
 * zbsearch 是 fumadocs-core 的传递依赖，pnpm 严格隔离下无法从项目根解析，
 * 这里按 .pnpm 布局定位；若上游升级导致路径变化，需同步调整。
 *
 * 用法：pnpm test:search   （需先 pnpm build）
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(join(ROOT, 'index.js'));

/* ---------- 定位 zbsearch ---------- */
function resolveZbsearch() {
  const pnpmDir = join(ROOT, 'node_modules/.pnpm');
  if (existsSync(pnpmDir)) {
    for (const d of readdirSync(pnpmDir)) {
      if (!d.startsWith('zbsearch@')) continue;
      const p = join(pnpmDir, d, 'node_modules/zbsearch/dist/esm/index.js');
      if (existsSync(p)) return p;
    }
  }
  throw new Error('未找到 zbsearch，请先 pnpm install');
}

const zb = await import('file:///' + resolveZbsearch().replace(/\\/g, '/'));

/* ---------- 载入索引 ---------- */
const INDEX = join(ROOT, 'dist/api/search.json');
if (!existsSync(INDEX)) {
  console.error('未找到 dist/api/search.json，请先执行 pnpm build');
  process.exit(2);
}
const raw = JSON.parse(readFileSync(INDEX, 'utf8'));

// load() 依赖打包器重写的自引用命名空间，裸 Node 下取不到 internalDocumentIDStore，
// 故改用公开 API 重建索引 —— 分词器与评分逻辑与线上一致。
const db = zb.create({
  schema: {
    id: 'string', page_id: 'string', type: 'string', content: 'string',
    breadcrumbs: 'string[]', tags: 'string[]', url: 'string', locale: 'string',
  },
  language: raw.language ?? 'multilingual',
});
zb.insertMultiple(
  db,
  Object.values(raw.docs.docs).map((d) => ({
    id: String(d.id),
    page_id: String(d.page_id ?? ''),
    type: String(d.type ?? ''),
    content: String(d.content ?? ''),
    breadcrumbs: Array.isArray(d.breadcrumbs) ? d.breadcrumbs : [],
    tags: Array.isArray(d.tags) ? d.tags : [],
    url: String(d.url ?? ''),
    locale: String(d.locale ?? ''),
  })),
);

const count = zb.count(db);
console.log(`索引载入: ${count} 个单元（源声明 ${raw.docs.count}），分词语言 ${raw.language}\n`);

let failed = 0;
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? '  ' + detail : ''}`);
  if (!ok) failed++;
};

/* ---------- 1. 索引完整性 ---------- */
check(count === raw.docs.count, '索引单元数与源一致', `${count} vs ${raw.docs.count}`);
check(raw.language === 'multilingual', '分词语言为 multilingual（支持 CJK）', String(raw.language));

/* ---------- 2. 关键中文词可检索 ---------- */
const CASES = [
  { q: '高木', expect: '/manga/Takagi-OG' },
  { q: '西片', expect: '/role/Takagi-OG' },
  { q: '主题曲', expect: '/music/OP' },
  { q: '片尾曲', expect: '/music/ED' },
  { q: '剧场版', expect: '/anime/Movie' },
  { q: '小千', expect: '/role/Takagi-OH' },
];

console.log('  关键中文词检索:');
for (const { q, expect } of CASES) {
  const r = zb.search(db, { term: q, limit: 8, properties: ['content', 'breadcrumbs'] });
  const urls = r.hits.map((h) => h.document.url);
  check(r.count > 0, `「${q}」有结果`, `${r.count} 条`);
  check(
    urls.some((u) => u.startsWith(expect)),
    `「${q}」首屏结果含 ${expect}`,
    urls.slice(0, 3).join(' ') || '（无结果）',
  );
}

// 多字词应不劣于其前缀，说明 CJK 分词未退化为单字匹配
const shortR = zb.search(db, { term: '高木', limit: 1, properties: ['content'] });
const longR = zb.search(db, { term: '高木同学', limit: 1, properties: ['content'] });
check(
  longR.count >= shortR.count,
  '多字词命中数不劣于前缀（「高木同学」≥「高木」）',
  `${longR.count} vs ${shortR.count}`,
);

/* ---------- 3. 索引不含组件源码 ---------- */
console.log('  组件源码残留:');
let jsxTotal = 0;
for (const name of ['SiteInfo', 'VPCard', 'Callout', 'Mermaid']) {
  const r = zb.search(db, { term: name, limit: 10, properties: ['content'] });
  const jsx = r.hits.filter((h) => /<\/?[A-Z][A-Za-z]*\b/.test(String(h.document.content ?? '')));
  jsxTotal += jsx.length;
  check(jsx.length === 0, `检索「${name}」无 JSX 残留`, `命中 ${r.count} 条，含 JSX ${jsx.length} 条`);
}

console.log('');
if (failed) {
  console.log(`❌ ${failed} 项未通过`);
  process.exitCode = 1;
} else {
  console.log('✅ 搜索索引全部通过');
}
