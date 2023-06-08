import { defineUserConfig } from "vuepress";
import { docsearchPlugin } from "@vuepress/plugin-docsearch";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",
  lang: "zh-CN",
  title: "高木资料站",
  description: "动漫《擅长捉弄的高木同学》自建资料站",

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

  // Enable it with pwa
  // shouldPrefetch: false,
});
