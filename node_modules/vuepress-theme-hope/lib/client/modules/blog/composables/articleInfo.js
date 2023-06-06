import { computed, toRef } from "vue";
import { getReadingTimeLocale, useReadingTimeLocaleConfig, } from "vuepress-plugin-reading-time2/client";
import { getAuthor, getCategory, getDate, getTag, } from "vuepress-shared/client";
import { useThemeLocaleData } from "@theme-hope/composables/index";
import { useCategoryMap } from "./categoryMap.js";
import { useBlogOptions } from "./options.js";
import { useTagMap } from "./tagMap.js";
export const useArticleAuthor = (info) => {
    const themeLocale = useThemeLocaleData();
    return computed(() => {
        const { ["a" /* ArticleInfoType.author */]: author } = info.value;
        if (author)
            return getAuthor(author);
        if (author === false)
            return [];
        return getAuthor(themeLocale.value.author, false);
    });
};
export const useArticleCategory = (info) => {
    const categoryMap = useCategoryMap();
    return computed(() => getCategory(info.value["c" /* ArticleInfoType.category */]).map((name) => ({
        name,
        path: categoryMap.value.map[name].path,
    })));
};
export const useArticleTag = (info) => {
    const tagMap = useTagMap();
    return computed(() => getTag(info.value["g" /* ArticleInfoType.tag */]).map((name) => ({
        name,
        path: tagMap.value.map[name].path,
    })));
};
export const useArticleDate = (info) => computed(() => {
    const { ["d" /* ArticleInfoType.date */]: timestamp } = info.value;
    return getDate(timestamp);
});
export const useArticleInfo = (props) => {
    const articleInfo = toRef(props, "info");
    const blogOptions = useBlogOptions();
    const author = useArticleAuthor(articleInfo);
    const category = useArticleCategory(articleInfo);
    const tag = useArticleTag(articleInfo);
    const date = useArticleDate(articleInfo);
    const readingTimeLocaleConfig = useReadingTimeLocaleConfig();
    const info = computed(() => ({
        author: author.value,
        category: category.value,
        date: date.value,
        localizedDate: articleInfo.value["l" /* ArticleInfoType.localizedDate */] || "",
        tag: tag.value,
        isOriginal: articleInfo.value["o" /* ArticleInfoType.isOriginal */] || false,
        readingTime: articleInfo.value["r" /* ArticleInfoType.readingTime */] || null,
        readingTimeLocale: articleInfo.value["r" /* ArticleInfoType.readingTime */] &&
            readingTimeLocaleConfig.value
            ? getReadingTimeLocale(articleInfo.value["r" /* ArticleInfoType.readingTime */], readingTimeLocaleConfig.value)
            : null,
        pageview: props.path,
    }));
    const items = computed(() => blogOptions.value.articleInfo);
    return { info, items };
};
//# sourceMappingURL=articleInfo.js.map