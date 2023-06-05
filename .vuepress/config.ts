import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "高木同学 自建资料站",
  description: "动漫《擅长捉弄的高木同学》自建资料站",
  sidebar: "handing",

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
});
