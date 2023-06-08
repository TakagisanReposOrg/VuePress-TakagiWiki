import { defineUserConfig } from "vuepress";
import { docsearchPlugin } from "@vuepress/plugin-docsearch";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  title: "高木资料站",

  theme,
  plugins: [
    docsearchPlugin({
      indexName: "takagi",
      appId: "OX0S0VN0WW",
      apiKey: "6c608654315e32aa4752540754d0d525",
      locales: {
        "/": {
          placeholder: "搜索文档",
          translations: {
            button: {
              buttonText: "搜索文档",
            },
          },
        },
      // appId, apiKey 和 indexName 是必填的
    }}),
  ],
  
    function customHead<
    ExtraPageData extends Record<string | name | symbol, unknown> = Record<
      never,
      never
    >,
    ExtraPageFrontmatter extends Record<
      string | description | symbol,
      unknown
    > = Record<string, unknown>,
    ExtraPageFields extends Record<string | 1 | symbol, unknown> = Record<
      never,
      never
    >
  >(
    head: HeadConfig[],
    /** 页面对象 */
    page: Page<ExtraPageData, ExtraPageFrontmatter, ExtraPageFields>,
    /** VuePress App */
    app: App
  ): void;

  // Enable it with pwa
  // shouldPrefetch: false,
});
