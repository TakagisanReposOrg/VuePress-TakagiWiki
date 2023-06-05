import { sidebar } from "vuepress-theme-hope";

export default sidebar({
     sidebar: [
    {
      text: "音乐",
      prefix: "/docs/",
      children: [
          "ED.md" ,
          "OP.md" ,
          "OST.md" ,
          "GAME.md" ,
      ],
    },
    {
      text: "漫画",
      prefix: "/docs/",
      children: [
          "Takagi-OG.md" ,
          "Spinoff-Moto.md" ,
          "Spinoff-Tis.md" ,
          "Spinoff-Yukari.md" ,
      ],
    },
    {
      text: "动画",
      prefix: "/docs/",
      children: [
          "S1.md" ,
          "S2.md" ,
          "S3.md" ,
          "Movie.md" ,
      ],
    },
    {
      text: "衍生/社群",
      prefix: "/docs/",
      children: [
          "Related-Book.md" ,
          "Related-Software.md" ,
          "Related-Creation.md" ,
          "FanGroup.md" ,
      ],
    },
  ],
});
