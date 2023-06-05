import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "音乐",
    prefix: "/music/",
    children: [
      {
        text: "动画片尾曲",
        link: "music/ED.md",
      },
      {
        text: "动画主题曲",
        link: "music/OP.md",
      },
      {
        text: "原声带OST",
        link: "music/OST.md",
      },
      {
        text: "手游 “心动记录”",
        link: "music/ED.md",
      },
        ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
