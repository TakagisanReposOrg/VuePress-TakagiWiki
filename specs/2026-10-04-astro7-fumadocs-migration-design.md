# 迁移设计：VuePress 2 (rc) → Astro 7 + Fumadocs 16

日期：2026-10-04　|　分支：`astro7-fumadocs`

> ## ⚠ 本文已被后续修正部分取代
>
> 本文是**迁移当时的设计记录**，保留原貌以备追溯。经上线前的一轮核查，其中若干
> 决策在实现阶段被推翻或细化。**不要直接照本文实现**，具体见文末「后续修正」。

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

---

## 后续修正（2026-10-05 上线前核查）

本文若干决策在实现后被修正，以下一律以实际代码为准。

### 会导致功能失效的修正

| 本文原描述 | 实际情况 |
|---|---|
| 搜索索引 `api/search.ts` | 实际为 `api/search.json.ts` |
| 检索「Web component」方式挂载 Waline | **错**。`@waline/client` 不注册 `<waline-comment>` 自定义元素（`./component` 导出的是 Vue 组件，`./comment` 只导出计数工具），按本文实现会得到一个不渲染任何内容的未知元素。已改为 `init({ el })` |
| `<SiteInfo>` → `<Card>`、`<VPCard>` → `<Card>` | 调整为保留两个包装组件（`site-info.tsx` / `vp-card.tsx`），内部用自建的 `card-h2.tsx`。Fumadocs 的 Card 标题渲染为 `<h3>`，与页面 `<h1>` 之间会缺 `<h2>` |
| 部署用 `withastro/action` | 改为自行 `pnpm install` + `pnpm verify` + `actions/upload-pages-artifact`。`withastro/action` 在未显式初始化 pnpm 的 runner 上会报 `No pnpm version is specified` |

### 构建与依赖

- pnpm 11 不再读取 `package.json` 的 `pnpm` 字段，也不再满足于 `onlyBuiltDependencies`；
  安装脚本须在 `pnpm-workspace.yaml` 的 `allowBuilds` 中显式声明为 `true`，
  否则 `pnpm install` 以退出码 1 失败。
- `http-cache-semantics` 经 astro 传递引入，存在 high 级漏洞 GHSA-ch52-4w7c-c8xp，
  已用 `overrides` 固定到 `^4.3.0`。

### 新增的工程设施（本文撰写时尚不存在）

- `scripts/audit.mjs`（`pnpm check`）：11 大类、40 处规则，进 CI 门禁
- `scripts/test-audit.mjs`（`pnpm test:audit`）：审计规则元测试，28 项
- `scripts/check-external.mjs`（`pnpm check:ext`）：站外引用可达性
- 工作流增加 `pull_request` 触发，审计不再只覆盖 `push: main`

### 后补的 SEO 与文档结构修正

以下四项不在原设计中，是上线前逐页核查产物时补上的：

- **社交分享卡片原本无效**。`og:image` 写在页面组件的 `<slot>` 里，会被渲染到
  `<body>` 起始处，而 Twitter / Facebook / Slack 只解析 `<head>`。已统一移入
  `layout.astro` 的 `<head>`，并补齐 `og:title` / `og:description` / `og:url` /
  `og:image`（绝对地址）与 Twitter Card。首页、404 页同步处理。
- **404 页缺 `noindex`**。托管平台会把 `404.html` 用于任何未命中路由，薄内容页
  若被索引会稀释站点质量。
- **「漫画」三个条目用 `#` 写小节**，导致每页 4～7 个 `<h1>`，小节也进不了目录。
  已降为 `##`（参考资料为 `###`）。
- **旧链接跳转页**原本缺 viewport，且六个跳转桩共用「Redirecting…」标题。
  已补 viewport 并沿用目标页真实标题。

### 尚未落地

本文「部署」一节假设 GitHub Pages 已启用，实际上**至今未启用**（`has_pages: false`），
因此流水线虽在 CI 上通过，deploy 作业始终失败。

