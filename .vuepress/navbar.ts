import { navbar } from "vuepress-theme-hope";

export default navbar([

  {
    text: "音乐",
    icon: "music",
    prefix: "/music/",
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
        link: "GAME.md",
      },
        ],
  },
  {
    text: "漫画",
    icon: "book",
    prefix: "/manga/",
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
    icon: "video",
    prefix: "/anime/",
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
    text: "衍生/社群",
    icon: "users",
    prefix: "/derivative/",
    children: [
      {
        text: "官方衍生书籍",
        link: "Related-Book.md",
      },
      {
        text: "相关软件&游戏",
        link: "Related-Software.md",
      },
      {
        text: "高木同人作品",
        link: "Related-Createion.md",
      },
      {
        text: "高木粉丝圈",
        link: "FanGroup.md",
      },
        ],
  },
  {
    text: "衍生/周边",
    icon: "shopping-cart",
    prefix: "/goods/",
    children: [
      {
        text: "官方商品&特典",
        link: "Offical.md",
      },
      {
        text: "IP授权周边产品",
        link: "Officalip.md",
      },
        ],
  },
]);
