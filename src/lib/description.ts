/**
 * 从正文首段派生 meta description
 *
 * 内容页的 frontmatter 大多只写了 `title`，`description` 缺省时会落到
 * `layout.astro` 的兜底值，结果全站三十个页面共用同一句模板话 ——
 * 重复的 meta description 对搜索引擎等于没有描述，也白白浪费了搜索
 * 结果里的摘要位。
 *
 * 这里按「优先取 frontmatter，其次取首段正文」的顺序补齐。挑段落的规则：
 *   - 跳过标题、列表、表格、引用、分隔线、代码块、组件与图片
 *   - 剥掉内联 Markdown 标记，避免描述里出现 `**` `[文字](链接)` 这类源码
 *   - 拒绝纯导航行（如 `[第一季](#第一季) · [第二季](#第二季)`）：那是锚点
 *     导航不是简介，写进描述只会让搜索结果更难看
 *   - 截到 160 字符以内，并尽量断在句号处
 */

/** 与 `layout.astro` 的兜底值保持一致，用于判断是否真的派生失败 */
export const SITE_DESCRIPTION = '《擅长捉弄的高木同学》轻Wiki站';

const MAX_LEN = 160;
/** 低于此长度即使有句末标点也不算一段能独立成句的简介 */
const MIN_LEN = 24;
/** 无句末标点时，必须达到这个长度才肯采用 */
const PLAIN_MIN_LEN = 40;

const SENTENCE_END = /[。！？!?]/;

/** 剥掉内联 Markdown 标记，只留可读文本 */
function plain(s: string): string {
  return s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // MDX 注释
    .replace(/<\/?[A-Z][A-Za-z0-9]*\b[^>]*\/?>/g, '') // 自定义组件
    .replace(/^import\s.+?;?$/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片：整条去掉，替代文本对描述无意义
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接：保留链接文字
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1') // 引用式链接
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 截到上限（含省略号不超过 MAX_LEN），尽量断在句末 */
function clamp(s: string): string {
  if (s.length <= MAX_LEN) return s;
  const head = s.slice(0, MAX_LEN);
  const m = head.match(/^[\s\S]*[。！？!?]/); // 贪婪匹配 = 最后一个句末标点
  if (m && m[0].length >= MIN_LEN) return m[0];
  return head.slice(0, MAX_LEN - 1).replace(/[\s,，、；;：:]+$/, '') + '…';
}

/** 该行本身不是正文（标题、表格、列表、组件、图片、分隔线等） */
function isFurniture(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  return (
    /^#{1,6}\s/.test(t) || // 标题
    /^(?:[-*_]\s*){3,}$/.test(t) || // 分隔线 --- *** ___
    /^[-*+]\s/.test(t) || // 无序列表
    /^\d+[.)]\s/.test(t) || // 有序列表
    /^\|/.test(t) || // 表格
    /^>/.test(t) || // 引用
    /^:::/.test(t) || // VuePress 容器
    /^<[A-Za-z!/]/.test(t) || // 组件、图片、HTML 标签
    /^\{\/\*/.test(t) || // MDX 注释
    /^import\s/.test(t)
  );
}

/** 剥掉完整的 MDX 组件元素（可能跨多行），成对组件保留其中的正文 */
function stripComponents(src: string): string {
  return src
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, '') // 自闭合：整段移除
    .replace(/<\/?([A-Z][A-Za-z0-9]*)\b[^>]*>/g, ''); // 成对：只去标签，保留内容
}

/** 取出正文里第一段能独立成句的散文 */
function firstProse(body: string): string {
  const src = stripComponents(body)
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') // frontmatter
    .replace(/```[\s\S]*?```/g, '\n') // 围栏代码块
    .replace(/~~~[\s\S]*?~~~/g, '\n');

  // 按空行分段，但**不能整段丢弃**：markdown 允许标题后紧跟正文
  // （`## 简介` 下一行就是段落），整段跳会把这类页面的简介一并丢掉。
  for (const block of src.split(/\r?\n[ \t]*\r?\n/)) {
    const kept = block
      .split(/\r?\n/)
      .filter((l) => !isFurniture(l))
      .join(' ')
      .trim();
    if (!kept) continue;
    const text = plain(kept);
    if (text.length < MIN_LEN) continue;
    // 纯导航行之类：有长度但读不成一句话，不采用
    if (text.length < PLAIN_MIN_LEN && !SENTENCE_END.test(text)) continue;
    return text;
  }
  return '';
}

/**
 * @param explicit frontmatter 里显式写的 description，优先采用
 * @param body    原始 markdown 正文，用于派生
 * @param fallback 派生不出时的兜底文案
 */
export function resolveDescription(
  explicit: string | undefined,
  body: string | undefined,
  fallback: string = SITE_DESCRIPTION,
): string {
  if (explicit?.trim()) return clamp(explicit.trim());
  const derived = body ? firstProse(body) : '';
  return derived ? clamp(derived) : fallback;
}
