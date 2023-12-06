import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import { Sidebar } from "./sidebar.js";

export default hopeTheme({
  hostname: "https://wiki.takagi3.cn",

  author: {
    name: "一只鬆",
    url: "https://blog.sotkg.cn",
  },

  iconAssets: "fontawesome-with-brands",

  logo: "https://pic.imgdb.cn/item/65702291c458853aef1fcc8c.webp",

  fullscreen: true,

  repo: "TakagiWikiSitesCN/Vuepress-TakagiWiki",
  blog:{
    name: "TkgRepoOrg",
    roundAvatar: true,
    description: "聚合一切与《高木同学》有关的开源项目",
    medias: {
      GitHub: "https://github.com/TakagisanReposOrg",
    },
  },
  // navbar
  navbar,
  
  // sidebar
  sidebar: Sidebar,
  // footer
  
  
  footer: "《擅长捉弄的高木同学》综合Wiki | 木创社站点编号No.01 ",
  copyright: "站点部署 © 木创社｜本站站长 © 一只鬆",
  displayFooter: true,
  // page meta
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },
  plugins: {
    components: {
			// 你想使用的组件
			components: [
			  "BiliBili",
			  "PDF",
			  "Share",
			  "SiteInfo",
			  "VPCard",
			],
		  },
    blog: true,
    //激活博客功能支持
    mdEnhance: {
      hint: true,
      //启用自定义容器支持
      align: true,
      //启用自定义对齐支持
    },
    comment: {
      provider: "Waline",
      serverURL: "https://waline-1-j6551192.deta.app/",
      emoji: ['//unpkg.com/@waline/emojis@1.1.0/bilibili'],
      dark: 'auto',
      commentSorting: 'hottest',
      meta: ['nick', 'mail'],
      requiredMeta: ['nick'],
      login: "enable",
      wordLimit: 0,
      pageSize: 5,
      copyright: true,
    },
    
    feed:{
      rss: true,
      atom: true,
      
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
});