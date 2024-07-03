import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import { Sidebar } from "./sidebar.js";



export default hopeTheme({
  hostname: "https://wiki.takagi3.cn",

  author: {
    name: "木语星",
    url: "https://takagi3.top",
  },

  iconAssets: "fontawesome-with-brands",

  logo: "https://pic.imgdb.cn/item/65702291c458853aef1fcc8c.webp",
  //锁定站点深色模式
  darkmode: "enable",

  repo: "TakagisanReposOrg/Vuepress-TakagiWiki",
  // navbar
  navbar,
  
  // sidebar
  sidebar: Sidebar,
  // footer
  
  
  footer: "《擅长捉弄的高木同学》轻Wiki站 | 木创社·木语星No.01",
  copyright: "站点部署 © 木创社｜本站运营 © 木语星",
  displayFooter: true,
  // page meta
  metaLocales: {
    editLink: "在 GitHub 上编辑本页",
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
			  "VidStack",
			],
		  },
    mdEnhance: {
      hint: true,
      //启用自定义容器支持
      align: true,
      //启用mermaid图表支持
      mermaid: true,
      tabs: true,
      //启用自定义对齐支持
    },
    comment: {
      provider: "Waline",
      serverURL: "https://waline-1-j6551192.deta.app/",
      emoji: ['//npm.onmicrosoft.cn/@waline/emojis@1.1.0/bilibili'],
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
     pwa: {
       favicon: "/favicon.ico",
       cacheHTML: true,
       cachePic: true,
       appendBase: true,
       apple: {
         icon: "/assets/icon/152.png",
         statusBarColor: "black",
       },
       msTile: {
         image: "/assets/icon/144.png",
         color: "#ffffff",
       },
       manifest: {
         icons: [
           {
             src: "/assets/icon/512.png",
             sizes: "512x512",
             purpose: "maskable",
             type: "image/png",
           },
           {
             src: "/assets/icon/192.png",
             sizes: "192x192",
             purpose: "maskable",
             type: "image/png",
           },
           {
             src: "/assets/icon/512.png",
             sizes: "512x512",
             type: "image/png",
           },
           {
             src: "/assets/icon/192.png",
             sizes: "192x192",
             type: "image/png",
           },
         ],        
       },
     },
  },
  
});