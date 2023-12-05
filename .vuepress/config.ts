import { defineUserConfig } from "vuepress";
import { docsearchPlugin } from "@vuepress/plugin-docsearch";
import theme from "./theme.js";

export default defineUserConfig({
	base: "/",
	lang: "zh-CN",
	head: [
		['script', { async: true, src: 'https://analytics.takagi3.top/script.js', 'data-website-id': 'fb17f2d1-05da-47b4-9191-29e3440a0d24' }],
		["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    	["link",{ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },],
		["link",{href: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap",rel: "stylesheet",},],
  ],

	theme,
	plugins: [
		docsearchPlugin({
			indexName: "takagi",
			appId: "OX0S0VN0WW",
			apiKey: "6c608654315e32aa4752540754d0d525",
			locales: {
				"/": {
					placeholder: "搜索文档",
					translations: {
						button: {
							buttonText: "搜索文档",
						},
					},
				},
				// appId, apiKey 和 indexName 是必填的
			}
		}),
	],
	


	// Enable it with pwa
	// shouldPrefetch: false,
});
