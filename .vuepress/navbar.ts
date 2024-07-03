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
    text: "角色",
    icon: "user",
    prefix: "/role/",
    children: [
      {
        text: "高木正篇角色",
        link: "Takagi-OG.md",
      },
      {
        text: "高木番外角色",
        link: "Takagi-OH.md",
      },
        ],
  },
  {
    text: "其他",
    icon: "ellipsis",
    prefix: "/other/",
    children: [
      {
        text: "关于",
        link: "Info.md",
      },
      {
        text: "站点建设日志",
        link: "Action.md",
      },
      {
        text: "赞助/贡献者",
        link: "Pay.md",
      },
			{
				text: "站点贡献者",
				link: "List.md",
			},
			{
				text: "内容版权相关",
				link: "License.md",
			},
        ],
      },
    ],
);
