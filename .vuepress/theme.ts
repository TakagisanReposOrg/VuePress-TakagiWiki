import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import { Sidebar } from "./sidebar.js";

export default hopeTheme({
  hostname: "https://wiki.takagi.icu",

  author: {
    name: "一只鬆",
    url: "https://www.takagi.icu",
  },

  iconAssets: "fontawesome-with-brands",

  logo: "/TakagiLogo.png",

  repo: "TakagiWikiSitesCN/Vuepress-TakagiWiki",

  // navbar
  navbar,

  // sidebar
  sidebar: Sidebar,

  footer: "《擅长捉弄的高木同学》自建资料站",
  copyright: "站点部署及框架运维 © 一只鬆",
  displayFooter: true,

  encrypt: {
    config: {
      "/demo/encrypt.html": ["1234"],
    },
  },

  // page meta
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },
  plugins: {
    
    // You should generate and use your own comment service
    //comment: {
      //provider: "Giscus",
      //repo: "yzsong06/TakagiWikiSiteCNVue",
      //repoId: "R_kgDOJrF6hQ",
      //category: "Announcements",
      //categoryId: "DIC_kwDOJrF6hc4CW-t-",
    },

    // uncomment these if you want a pwa
    // pwa: {
    //   favicon: "/favicon.ico",
    //   cacheHTML: true,
    //   cachePic: true,
    //   appendBase: true,
    //   apple: {
    //     icon: "/assets/icon/apple-icon-152.png",
    //     statusBarColor: "black",
    //   },
    //   msTile: {
    //     image: "/assets/icon/ms-icon-144.png",
    //     color: "#ffffff",
    //   },
    //   manifest: {
    //     icons: [
    //       {
    //         src: "/assets/icon/chrome-mask-512.png",
    //         sizes: "512x512",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-mask-192.png",
    //         sizes: "192x192",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //     shortcuts: [
    //       {
    //         name: "Demo",
    //         short_name: "Demo",
    //         url: "/demo/",
    //         icons: [
    //           {
    //             src: "/assets/icon/guide-maskable.png",
    //             sizes: "192x192",
    //             purpose: "maskable",
    //             type: "image/png",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // },
  },
);
