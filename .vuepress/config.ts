import { defineUserConfig } from "vuepress";
import type { DefaultThemeOptions } from "vuepress";
import recoTheme from "vuepress-theme-reco";

export default defineUserConfig({
  title: "擅长捉弄的高木同学 自建资料站",
  description: "动漫《擅长捉弄的高木同学》的自建资料站点，基于Vue",
  theme: recoTheme({
    style: "@vuepress-reco/style-default",
    logo: "/logo.png",
    author: "一只鬆",
    authorAvatar: "/head.png",
    docsRepo: "https://github.com/yzsong06/TakagiWikiSiteCNVue",
    docsBranch: "main",
    docsDir: "example",
    lastUpdatedText: "",
    // series 为原 sidebar
    series: {
      "/docs/theme-reco/": [
        {
          text: "module one",
          children: ["home", "theme"],
        },
        {
          text: "module two",
          children: ["api", "plugin"],
        },
      ],
    },
    navbar: [
      { text: "首页", link: "/" },
      {
        text: "音乐",
        children: [
          { text: "动画片尾曲", link: "/docs/music/ED.md" },
          { text: "原高木同学", link: "/blogs/other/guide" },
          { text: "明天是星期六", link: "/blogs/other/guide" },
          { text: "与恋爱相恋的友加里", link: "/blogs/other/guide" },
        ],
      },
    ],
    bulletin: {
      body: [
        {
          type: "text",
          content: `🎉🎉🎉 动漫《擅长捉弄的高木同学》自建资料站,Vue新框架测试站点`,
          style: "font-size: 12px;",
        },
        {
          type: "hr",
        },
        {
          type: "title",
          content: "维护者及联系方式",
        },
        {
          type: "text",
          content: `
          <ul>
            <li>一只鬆：2319665062@qq.com</li>
            <li>官方反馈：Feedback@takagi3.cn</li>
          </ul>`,
          style: "font-size: 12px;",
        },
        {
          type: "hr",
        },
        {
          type: "title",
          content: "维护者GitHub",
        },
        {
          type: "text",
          content: `
          <ul>
            <li><a href="https://github.com/yzsong06">一只鬆<a/></li>
            <li><a href="https://github.com/MuFeng086">牧丰<a/></li>
          </ul>`,
          style: "font-size: 12px;",
        },
        {
          type: "hr",
        },
        {
          type: "buttongroup",
          children: [
            {
              text: "赞助",
              link: "https://mufeng086.com/support",
            },
          ],
        },
      ],
    },
    // commentConfig: {
    //   type: 'valie',
    //   // options 与 1.x 的 valineConfig 配置一致
    //   options: {
    //     // appId: 'xxx',
    //     // appKey: 'xxx',
    //     // placeholder: '填写邮箱可以收到回复提醒哦！',
    //     // verify: true, // 验证码服务
    //     // notify: true,
    //     // recordIP: true,
    //     // hideComments: true // 隐藏评论
    //   },
    // },
  }),
  // debug: true,
});
