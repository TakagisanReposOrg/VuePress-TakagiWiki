# create-valaxy

Example: [valaxy.site](https://valaxy.site)

## Usage

```bash
# install
pnpm i
# or pnpm i

# start（启动请使用pnpm指令！＠一只鬆）
pnpm run dev
# or pnpm dev
```

See `http://localhost:4859/`, have fun!

### Config

Modify `valaxy.config.ts` to custom your blog.

English & Chinese Docs is coming!

> Wait a minute.

### Docker

```bash
docker build . -t your-valaxy-blog-name:latest
```

## Structure

In most cases, you only need to work in the `pages` folder.

### Main folders

- `pages`: your all pages
  - `posts`: write your posts here, will be counted as posts
- `styles`: override theme styles, `index.scss`/`vars.csss`/`index.css` will be loaded automatically
- `components`: custom your vue components (will be loaded automatically)
- `layouts`: custom layouts (use it by `layout: xxx` in md)
- `locales`: custom i18n

### Other

- `.vscode`: recommend some useful plugins & settings, you can preview icon/i18n/class...
- `.github`: GitHub Actions to auto build & deploy to GitHub Pages
- `netlify.toml`: for [netlify](https://www.netlify.com/)
- `vercel.json`: for [vercel](https://vercel.com/)  
＠一只鬆
新文档分支测试
pnpm run dev是预览指令，目前暂时先测试music页面
＠2023.06.02 12:00