# 迁移设计：VuePress 2 (rc) → Astro 7 + Fumadocs 16

日期：2026-10-04　|　分支：`astro7-fumadocs`

## 背景与目标

现有站点为《擅长捉弄的高木同学》轻 Wiki（中文，部署于 `wiki.takagi3.cn`），基于
VuePress 2.0.0-rc.0 + vuepress-theme-hope 2.0.0-rc.2（2023 年的 RC 版本，已严重过时）。
目标：整体迁移到 **Astro 7 + Fumadocs 16（官方 Astro 支持，React islands 模式）**，
保留全部内容与核心体验，URL 尽量兼容旧链接。

## 方案对比

| 方案 | 说明 | 结论 |
|---|---|---|
| A. Astro 7 + Fumadocs（官方 Astro 手册路线） | 静态输出 + React islands，fumadocs-ui 提供 docs UI | **采用** |
| B. create-fumadocs-app astro 模板 | 官方脚手架，但模板结构固定，仍需内容迁移 | 参考 A 的文档骨架即可 |
| C. Starlight | Astro 原生 docs 主题 | 用户指定 Fumadocs，排除 |

## 架构

```
content/docs/          全部内容（统一 .mdx + 各分区 meta.json）
src/
  content.config.ts    docs / meta 两个 content collection
  lib/source.ts        fumadocs loader 桥接 Astro collections
  components/          layout.astro / docs.tsx (island) / search.tsx / mermaid.tsx
  pages/
    index.astro        首页 hero（纯静态，零 JS）
    [...slug].astro    文档路由（getStaticPaths 来自 source）
    api/search.ts      静态搜索索引 endpoint（orama）
    404.astro
public/                原静态资源原样迁移
```

- 构建：`build.format: 'file'` → 生成 `*.html`，**与 VuePress 旧 URL 完全一致**
  （`/music/ED.html`），外部链接不失效；8 个分区根目录 `/music/` 等加 redirects 到 `.html`。
- 内容集合内的 `README.md` 统一改名 `index.mdx`（分区根页面）。

## 内容转换（脚本 scripts/migrate-content.mjs）

| 旧（VuePress/md-enhance） | 新（MDX） |
|---|---|
| `::: tip / info [标题]` | `<Callout type="info" title?>` |
| `::: details X` | `<details><summary>` |
| `::: tabs` + `@tab X` | `<Tabs items>` + `<Tab value>` |
| `<SiteInfo>` | `<Card title description href>`（包 `<Cards>`） |
| `<VPCard>` | `<Card>` + 头像 img 子元素 |
| ```` ```mermaid ```` (1 处) | `<Mermaid chart>` island |
| 未闭合 `<img>`/`<br>`、`style="…"` 字符串属性、无引号属性 | 脚本规范化为合法 JSX |
| frontmatter `title` 保留；`article/author/icon` 剥离（author→authors 留档） | |
| 站内链接 `/x/y`、`/x/y.md` | 统一 `/x/y.html` |

存量 bug 顺带修正：导航「角色」分区旧路径 `/role/` 与实际目录 `people/` 不一致 →
新站目录与 URL 统一为 `role/`；navbar 拼写错误 `Related-Createion` → `Related-Creation`。

## 功能映射

| 旧 | 新 |
|---|---|
| DocSearch (Algolia) | fumadocs 静态 orama 搜索（零外部依赖；Algolia 凭据留档可切回） |
| Waline 评论 | `@waline/client` web component，嵌入 DocsPage 页脚（原 serverURL 保留） |
| PWA | 本期移除（guide/Home.md 提示文字同步修改），后续可用 @vite-pwa/astro 加回 |
| 博客 + RSS | 移除（仅 2 篇测试文章，YAGNI） |
| hope theme 深浅切换 | fumadocs theme provider（可切换） |
| Noto Serif SC / 主题色 #db7093 | global.css 引入字体 + 覆盖 `--color-fd-primary` |
| GitHub 编辑链接 | DocsPage `editUrl` |
| 导航栏 8 个分区 | DocsLayout nav links；侧边栏 = 各分区 meta.json |

## 部署

GitHub Actions（withastro/action）→ GitHub Pages（自定义域名 `wiki.takagi3.cn`，
`public/CNAME`）。本地以 `astro build && astro preview` 验证为准。

## 验收标准

1. `pnpm build` 零错误，产出与旧站一一对应的 `.html` 页面（34 个内容页全部存在）。
2. `astro preview` + curl 抽查旧式 `.html` URL、分区根 redirects、搜索 API。
3. 渲染页面视觉检查（visual judge）：首页、文档页、深色模式、卡片页无布局破损。
4. 仓库中不再残留 vuepress 依赖与 `docs/.vuepress`。
