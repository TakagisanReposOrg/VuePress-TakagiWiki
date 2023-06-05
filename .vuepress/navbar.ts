import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "音乐",
    prefix: "/music/",
    children: [
      {
        text: "动画片尾曲",
        link: "docs/music/ED.md",
      },
      {
        text: "动画主题曲",
        link: "docs/music/OP.md",
      },
      {
        text: "原声带OST",
        link: "docs/music/OST.md",
      },
      {
        text: "手游 “心动记录”",
        link: "docs/music/ED.md",
      },
        ],
  },
  {
    text: "漫画",
    prefix: "docs/manga/",
    children: [
      {
        text: "高木同学正篇",
        link: "docs/manga/Takagi-OG.md",
      },
      {
        text: "原高木同学",
        link: "docs/manga/Spinoff-Moto.md",
      },
      {
        text: "第三季",
        link: "docs/anime/S3.md",
      },
      {
        text: "剧场版",
        link: "docs/anime/Movie.md",
      },
        ],
  },
  {
    text: "动画",
    prefix: "docs/anime/",
    children: [
      {
        text: "第一季",
        link: "docs/anime/S1.md",
      },
      {
        text: "第二季",
        link: "docs/anime/S2.md",
      },
      {
        text: "第三季",
        link: "docs/anime/S3.md",
      },
      {
        text: "剧场版",
        link: "docs/anime/Movie.md",
      },
        ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
