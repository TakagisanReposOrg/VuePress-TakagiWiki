// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import {
  rehypeCode,
  remarkCodeTab,
  remarkHeading,
  remarkNpm,
  remarkStructure,
} from 'fumadocs-core/mdx-plugins';

const remarkPlugins = [
  remarkHeading,
  remarkCodeTab,
  remarkNpm,
  [remarkStructure, { exportAs: 'structuredData' }],
];
const rehypePlugins = [rehypeCode];

export default defineConfig({
  site: 'https://wiki.takagi3.cn',
  output: 'static',
  // 与旧 VuePress 站保持一致的 .html URL（外部链接不失效）
  build: { format: 'file' },
  markdown: {
    processor: unified({
      syntaxHighlight: false,
      remarkPlugins,
      rehypePlugins,
    }),
  },
  integrations: [
    react(),
    mdx({
      extendMarkdownConfig: true,
      syntaxHighlight: false,
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
