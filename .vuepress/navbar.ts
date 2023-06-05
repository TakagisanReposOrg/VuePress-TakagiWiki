import { navbar } from "vuepress-theme-hope";

export default navbar([

  {
    text: "音乐",
    prefix: "/docs/music/",
    children: [
      {
        text: "动画片尾曲",
        link: "ED.md",
      },
      {
        text: "动画主题曲",
        link: "OP.md",
      },
      {
        text: "原声带OST",
        link: "OST.md",
      },
      {
        text: "手游 “心动记录”",
        link: "ED.md",
      },
        ],
  },
  {
    text: "漫画",
    prefix: "/docs/manga/",
    children: [
      {
        text: "高木同学正篇",
        link: "Takagi-OG.md",
      },
      {
        text: "原高木同学",
        link: "Spinoff-Moto.md",
      },
      {
        text: "明天是星期六",
        link: "Spinoff-Tis.md",
      },
      {
        text: "与恋爱相恋的友加里",
        link: "Spinoff-Yukari.md",
      },
        ],
  },
  {
    text: "动画",
    prefix: "/docs/anime/",
    children: [
      {
        text: "第一季",
        link: "S1.md",
      },
      {
        text: "第二季",
        link: "S2.md",
      },
      {
        text: "第三季",
        link: "S3.md",
      },
      {
        text: "剧场版",
        link: "Movie.md",
      },
        ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
