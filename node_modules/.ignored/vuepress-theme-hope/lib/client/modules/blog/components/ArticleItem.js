import { withBase } from "@vuepress/client";
import { defineComponent, h, toRef, } from "vue";
import { RouterLink } from "vue-router";
import { SlideIcon, StickyIcon, } from "@theme-hope/modules/blog/components/icons/index";
import { useArticleInfo } from "@theme-hope/modules/blog/composables/index";
import { LockIcon } from "@theme-hope/modules/encrypt/components/icons";
import PageInfo from "@theme-hope/modules/info/components/PageInfo";
import "../styles/article-item.scss";
export default defineComponent({
    name: "ArticleItem",
    props: {
        /**
         * Article information
         *
         * 文章信息
         */
        info: {
            type: Object,
            required: true,
        },
        /**
         * Article path
         *
         * 文章路径
         */
        path: { type: String, required: true },
    },
    slots: Object,
    setup(props, { slots }) {
        const articleInfo = toRef(props, "info");
        const { info: pageInfo, items } = useArticleInfo(props);
        return () => {
            const { ["t" /* ArticleInfoType.title */]: title, ["y" /* ArticleInfoType.type */]: type, ["n" /* ArticleInfoType.isEncrypted */]: isEncrypted = false, ["v" /* ArticleInfoType.cover */]: cover, ["e" /* ArticleInfoType.excerpt */]: excerpt, ["u" /* ArticleInfoType.sticky */]: sticky, } = articleInfo.value;
            const info = pageInfo.value;
            return h("div", { class: "vp-article-wrapper" }, h("article", {
                class: "vp-article-item",
                vocab: "https://schema.org/",
                typeof: "Article",
            }, [
                slots.cover?.({ cover }) ||
                    (cover
                        ? [
                            h("img", {
                                class: "vp-article-cover",
                                src: withBase(cover),
                            }),
                            h("meta", {
                                property: "image",
                                content: withBase(cover),
                            }),
                        ]
                        : []),
                sticky ? h(StickyIcon) : null,
                h(RouterLink, { to: props.path }, () => slots.title?.({ title, isEncrypted, type }) ||
                    h("header", { class: "vp-article-title" }, [
                        isEncrypted ? h(LockIcon) : null,
                        type === "s" /* PageType.slide */ ? h(SlideIcon) : null,
                        h("span", { property: "headline" }, title),
                    ])),
                slots.excerpt?.({ excerpt }) ||
                    (excerpt
                        ? h("div", {
                            class: "vp-article-excerpt",
                            innerHTML: excerpt,
                        })
                        : null),
                h("hr", { class: "vp-article-hr" }),
                slots.info?.({ info }) ||
                    h(PageInfo, {
                        info,
                        ...(items.value ? { items: items.value } : {}),
                    }),
            ]));
        };
    },
});
//# sourceMappingURL=ArticleItem.js.map