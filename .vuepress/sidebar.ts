import { sidebar } from "vuepress-theme-hope";

export const Sidebar = sidebar({
  "/": [
    {
      text: "博客",
      link: "/blog/",
      icon: "blog",
    },
    {
      text: "指南",
      icon: "compass",
      prefix: "guide/",
      link: "guide/",
      children: "structure",
    },
    {
      text: "音乐",
      icon: "music",
      prefix: "music/",
      link: "music/",
      children: "structure",
    },
    {
      text: "漫画",
      icon: "book",
      prefix: "manga/",
      children: [
        "Takagi-OG",
        "Spinoff-Moto",
        "Spinoff-Tis",
        "Spinoff-Yukari",
      ],
    },
    {
      text: "动画",
      icon: "video",
      prefix: "anime/",
      children: [
        "S1/",
        "S2",
        "S3",
        "Movie",
      ],
    },
    {
      text: "角色",
      icon: "user",
      prefix: "role/",
      children: [
        "Takagi-OG",
        "Takagi-OH"
      ],
    },
    {
      text: "衍生/社群",
      icon: "users",
      prefix: "derivative/",
      children: [
        "Related-Book",
        "Related-Software",
        "FanGroup",
        "Related-Creation",
      ],
    },
    {
      text: "商品/周边",
      icon: "shopping-cart",
      prefix: "goods/",
      children: "structure",
    },
    {
      text: "其他",
      icon: "ellipsis",
      prefix: "other/",
      children: "structure",
    },
  ],
});
