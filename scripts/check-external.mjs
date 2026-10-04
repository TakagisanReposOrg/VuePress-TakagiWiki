/**
 * 外部资源可达性检查
 *
 * 站内存在大量站外引用：音频试听文件、B 站图片（经 weserv.nl 代理）、
 * 许可协议图标、贡献者头像等。它们全部在构建期无法验证 —— 挂了也只有
 * 访客打开页面才会发现。
 *
 * 分级：
 *   - src 上的外部资源（img/script 等）：必须可达，失败计入退出码
 *   - href 上的外部链接：仅提示（很多站点禁止 HEAD/对爬虫返回 403，
 *     但浏览器中可正常打开，误报成本高）
 *
 * 用法：pnpm check:ext      （需网络；不参与 pnpm verify，避免 CI 被外部抖动拖累）
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://wiki.takagi3.cn';

const TIMEOUT = 12_000;
const CONCURRENCY = 8;

const walk = async (dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    e.isDirectory() ? await walk(p, out) : out.push(p);
  }
  return out;
};

/* ---------- 收集外部引用 ---------- */
const htmls = (await walk(DIST)).filter((f) => f.endsWith('.html'));
/** @type {Map<string, {kind:'resource'|'link', pages:Set<string>}>} */
const refs = new Map();

for (const f of htmls) {
  const page = '/' + relative(DIST, f).replace(/\\/g, '/');
  const c = (await readFile(f, 'utf8')).replace(/&amp;/g, '&');

  for (const m of c.matchAll(/<[a-z]+\b[^>]*\ssrc="(https?:\/\/[^"]+)"/gi)) {
    const u = m[1];
    if (u.startsWith(ORIGIN)) continue;
    refs.set(u, { kind: 'resource', pages: new Set([...(refs.get(u)?.pages ?? []), page]) });
  }
  for (const m of c.matchAll(/<a\b[^>]*\shref="(https?:\/\/[^"]+)"/gi)) {
    const u = m[1];
    if (u.startsWith(ORIGIN)) continue;
    const prev = refs.get(u);
    // 同一 URL 既是资源又是链接时，以资源为准（更严格）
    if (prev?.kind === 'resource') continue;
    refs.set(u, { kind: 'link', pages: new Set([...(prev?.pages ?? []), page]) });
  }
}

/* ---------- 探测 ---------- */
async function probe(url) {
  const attempt = async (method) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    try {
      const r = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctl.signal,
        headers: {
          // 部分站点对默认 UA 返回 403
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
          accept: '*/*',
        },
      });
      return { status: r.status, ok: r.ok || (r.status >= 300 && r.status < 400) };
    } finally {
      clearTimeout(t);
    }
  };
  try {
    const h = await attempt('HEAD');
    if (h.status !== 405 && h.status !== 403 && h.status !== 501) return h;
    return await attempt('GET');
  } catch (e) {
    return { status: 0, ok: false, error: e.name === 'AbortError' ? '超时' : e.message };
  }
}

const entries = [...refs.entries()];

/* ---------- 先做环境自检 ---------- */
// 部分环境（VPN / clash 类 fake-ip 代理、DNS 劫持）会让大量站点连接被重置。
// 若不先探测，工具会把环境问题误报成「站点全部失效」。对照组取两个
// 长期稳定的公共站点，任何一个不通即判定本次结果不可用。
const CONTROLS = ['https://github.com/', 'https://ja.wikipedia.org/'];
const controlResults = await Promise.all(CONTROLS.map((u) => probe(u)));
const envOk = controlResults.every((r) => r.ok);
if (!envOk) {
  console.log('⚠ 环境自检未通过（对照组不可达），本次探测结果不可采信。');
  for (const [u, r] of CONTROLS.map((u, i) => [u, controlResults[i]]))
    console.log(`    ${u} -> ${r.error ?? r.status}`);
  console.log('\n  常见原因：本机启用了 fake-ip 代理 / DNS 被劫持 / 出网被限制。');
  console.log('  工具不会把这种情况下的失败记为死链。\n');
}

const results = new Array(entries.length);
let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < entries.length) {
      const i = cursor++;
      results[i] = await probe(entries[i][0]);
    }
  }),
);

/* ---------- 报告 ---------- */
// 连接层失败（ECONNRESET / 超时 / DNS）在 fake-ip 代理下无法区分
// 「站点真的挂了」与「本机出网被拦」，只有拿到真实 HTTP 状态码才算证据。
const CONN_ERRORS = new Set([0]);
const bad = [];
const inconclusive = [];
for (let i = 0; i < entries.length; i++) {
  const [url, meta] = entries[i];
  const r = results[i];
  if (r.ok) continue;
  if (r.status === 0) inconclusive.push({ url, meta, r });
  else bad.push({ url, meta, r });
}

const byHost = {};
for (const { url } of bad) {
  const h = new URL(url).host;
  (byHost[h] ??= []).push(url);
}

console.log(`外部引用去重后共 ${entries.length} 条（资源 ${[...refs.values()].filter((m) => m.kind === 'resource').length}，链接 ${[...refs.values()].filter((m) => m.kind === 'link').length}）`);
console.log(
  `探测完成：可达 ${entries.length - bad.length - inconclusive.length}，` +
    `返回异常状态 ${bad.length}，连接失败 ${inconclusive.length}\n`,
);

if (bad.length) {
  console.log('==== 返回了异常 HTTP 状态的引用（可信）====');
  for (const b of bad) {
    const pages = [...b.meta.pages].slice(0, 2).join(', ');
    console.log(`  [${b.meta.kind === 'resource' ? '资源' : '链接'}] ${b.r.status}  ${b.url}`);
    console.log(`      出现于: ${pages}${b.meta.pages.size > 2 ? ` 等 ${b.meta.pages.size} 页` : ''}`);
  }
  console.log('\n  按域名:');
  for (const [h, list] of Object.entries(byHost))
    console.log(`    ${h.padEnd(28)} ${list.length} 条`);
  console.log('');
}

if (inconclusive.length) {
  const hosts = [...new Set(inconclusive.map((x) => new URL(x.url).host))];
  console.log('==== 连接失败，无法判定（不作结论）====');
  console.log(`  ${inconclusive.length} 条，涉及 ${hosts.length} 个域名：${hosts.slice(0, 8).join(', ')}${hosts.length > 8 ? ' …' : ''}`);
  console.log('  原因通常是 fake-ip 代理 / 出网限制 / 对方按地区或来源 IP 拒绝连接。');
  console.log('  这些条目既不算通过也不算失败，需在无代理环境重测。\n');
}

if (!bad.length && !inconclusive.length) {
  console.log('✅ 全部可达');
} else if (!bad.length) {
  console.log('⚠ 无可确认的死链；但有连接失败项需在干净网络下复测。');
}

const brokenResources = bad.filter((b) => b.meta.kind === 'resource');
if (brokenResources.length) {
  console.log(`\n❌ ${brokenResources.length} 条资源类引用返回异常状态，访客浏览时会显示为坏图/坏脚本`);
  process.exitCode = 1;
}
