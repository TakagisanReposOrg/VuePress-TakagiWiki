# 高木轻Wiki站（Takagi Wiki）

《擅长捉弄的高木同学》轻Wiki资料站，由木创社维护运营。

技术栈：**Astro 7 + Fumadocs 16**（React islands）+ Tailwind CSS 4。
原 VuePress 2 (RC) 架构已于 2026-10 迁移，页面 URL 与旧站保持一致（`*.html`）。

## 开发

```bash
pnpm install
pnpm dev       # 本地开发 http://localhost:4321
pnpm build     # 构建到 dist/（含 postbuild 旧链接兼容处理）
pnpm preview   # 预览构建产物
pnpm check     # 审计 dist/：页树漂移 / SEO 元信息 / sitemap 覆盖度 /
               # 站内死链 / 组件残留 / 静态资源缺失，有问题则退出码 1
pnpm verify    # = build + check，CI 使用的组合
```

## 内容编辑

- 文档位于 `content/docs/`，使用 MDX（`.mdx`）；各分区的顺序与命名由同名 `meta.json` 控制。
- 每个文件需在 frontmatter 提供 `title`，可选 `authors`、`description`。
- 可用组件（已全局注册，`Tabs`/`Mermaid` 会由迁移脚本自动注入 import）：
  - `<Callout type="info|idea|success|warn|warning|error" title="…">` 提示容器
  - `<Tabs items={['A','B']}>` + `<Tab value="A">` 内容标签页
  - `<Card>` / `<Cards>` 卡片
  - `<SiteInfo name desc url preview />`、`<VPCard title desc logo link background />`（兼容旧站组件）
  - `<Mermaid chart={"…"} />` 图表（等价于原来的 ` ```mermaid ` 代码块）
- 站内链接请使用 `/music/ED.html` 形式（与旧站 URL 一致）。

## 功能

- 全站静态搜索（Orama，索引由 `src/pages/api/search.json.ts` 构建输出）
- Waline 评论（`src/pages/[...slug].astro`，沿用原 serverURL）
- 深浅色模式、GitHub 编辑入口、旧链接自动兼容（`scripts/postbuild.mjs`）

## 部署

GitHub Actions（`.github/workflows/deploy.yml`）：

- **拉取请求**（目标 `main`）：执行 `pnpm verify` 做构建与审计，**不发布**
- **推送 `main`**：执行 `pnpm verify` 后上传产物并发布到 GitHub Pages

发布目标为自定义域名 `wiki.takagi3.cn`（见 `public/CNAME`）。

> ⚠️ 仓库的 GitHub Pages 目前**尚未启用**，因此流水线虽已在 CI 上通过（build 作业），
> 但 deploy 作业会一直失败。启用方式：仓库 Settings → Pages → Source 选
> *GitHub Actions*。启用后无需改动任何代码即可发布。

迁移设计文档：[specs/2026-10-04-astro7-fumadocs-migration-design.md](specs/2026-10-04-astro7-fumadocs-migration-design.md)
