/**
 * description 派生逻辑单元测试
 *
 * `resolveDescription` 的挑段落规则被真实内容坑过两次：
 *   - markdown 允许标题后紧跟正文（`## 简介` 下一行就是段落），
 *     早期实现把「标题 + 段落」当成整块跳过，导致木创社等页面派生不出描述
 *   - `<SiteInfo />` 这类组件常跨多行，只识别首行的话，
 *     后面的 name= / desc= / url= 属性会被当成正文，描述里直接漏出源码
 *
 * 注意：正文夹具必须够长（≥24 字），否则会被派生阈值判为「不成句」而跳过 ——
 * 这与真实情况一致，描述本来就不该取一句话的碎片。
 *
 * 用法：pnpm test:description
 */
import { resolveDescription, SITE_DESCRIPTION } from '../src/lib/description.ts';

const results = [];
const check = (name, actual, expect) => {
  const ok = typeof expect === 'function' ? expect(actual) : actual === expect;
  results.push({
    name,
    ok,
    msg: ok ? String(actual).slice(0, 46) : `得到: ${String(actual).slice(0, 46)}｜期望: ${expect}`,
  });
};

const FM = '---\ntitle: "t"\n---\n\n';
/** 一段足够长、能独立成句的正文 */
const PROSE = '这里是真正可以当作页面简介使用的正文段落，字数足够长，应当被选为描述。';

/* ---------- 优先级 ---------- */
check('显式 description 优先', resolveDescription('手写描述', PROSE), '手写描述');
check('显式为空串时回落到派生', resolveDescription('', PROSE), PROSE);
check('显式为纯空白时回落到派生', resolveDescription('   ', PROSE), PROSE);

/* ---------- 挑段落 ---------- */
check(
  '标题后紧跟正文（无空行）',
  resolveDescription(undefined, FM + '## 简介\n木创社是一个致力于高木同学相关民间网站建设的网络社团，长期维护社区站点。'),
  '木创社是一个致力于高木同学相关民间网站建设的网络社团，长期维护社区站点。',
);
check('跳过表格取后续正文', resolveDescription(undefined, FM + '| 列一 | 列二 |\n| --- | --- |\n| 甲 | 乙 |\n\n' + PROSE), PROSE);
check('跳过围栏代码块', resolveDescription(undefined, FM + '```js\nconst a = 1;\n```\n\n' + PROSE), PROSE);
check('跳过无序列表', resolveDescription(undefined, FM + '- 甲\n- 乙\n- 丙\n\n' + PROSE), PROSE);
check('跳过纯导航行', resolveDescription(undefined, FM + '[第一季](#第一季) · [第二季](#第二季) · [第三季](#第三季)\n\n' + PROSE), PROSE);
check(
  '短句无句末标点不足以成描述',
  resolveDescription(undefined, FM + '（演唱：高桥李依）\n\n' + PROSE),
  PROSE,
);
check(
  '成对组件保留内部正文',
  resolveDescription(undefined, FM + '<Callout type="info">\n\n这段提示本身就是一段足够长的简介内容，可以直接采用。\n\n</Callout>'),
  '这段提示本身就是一段足够长的简介内容，可以直接采用。',
);
check(
  '跨多行的自闭合组件整段忽略',
  resolveDescription(undefined, FM + '<Cards>\n<SiteInfo\n  name="第一季"\n  desc="《擅长捉弄的高木同学》第一季"\n  url="https://example.com/a.html"\n/>\n\n' + PROSE),
  PROSE,
);
check('无可用正文时回落兜底', resolveDescription(undefined, FM + '<SiteInfo name="仅组件" desc="d" url="u" />'), SITE_DESCRIPTION);
check('空正文时回落兜底', resolveDescription(undefined, ''), SITE_DESCRIPTION);

/* ---------- 文本清洗 ---------- */
check(
  '剥掉内联 Markdown',
  resolveDescription(undefined, FM + '这是**粗体**与*斜体*和`代码`还有[链接文字](https://a.example/x)混排的一段简介。'),
  '这是粗体与斜体和代码还有链接文字混排的一段简介。',
);
check(
  '整条去掉图片',
  resolveDescription(undefined, FM + '![替代文字不应出现](https://a.example/x.png) 这才是该页面简介正文的全部内容，应当被完整收录下来。'),
  '这才是该页面简介正文的全部内容，应当被完整收录下来。',
);

/* ---------- 截断 ---------- */
const sentence = '一'.repeat(50) + '。';
check(
  '超长时断在句末',
  resolveDescription(undefined, FM + sentence + '二'.repeat(300)),
  (v) => v.length <= 160 && v.endsWith('。'),
);
check(
  '区间内无句末标点时省略号收尾',
  resolveDescription(undefined, FM + '二'.repeat(300)),
  (v) => v.length <= 160 && v.endsWith('…'),
);
check(
  '显式 description 过长也会被截断',
  resolveDescription('三'.repeat(300), undefined),
  (v) => v.length <= 160,
);
check('不得残留 Markdown 标记', resolveDescription(undefined, FM + PROSE), (v) => !/[*\[\]`<>|]/.test(v));

/* ---------- 报告 ---------- */
console.log('==== description 派生测试结果 ====\n');
let bad = 0;
for (const r of results) {
  if (!r.ok) bad++;
  console.log(`  ${r.ok ? '✅ 通过' : '❌ 失败'}  ${r.name.padEnd(28)} ${r.msg}`);
}
console.log(`\n  共 ${results.length} 项 —— 失败 ${bad} 项`);
if (bad) process.exitCode = 1;
