import { provide } from 'vue';
import { categoryPaginationPostsSymbol, categorySummarySymbol, postsSymbol, seriesSymbol, } from './composable';
export async function applyClientSetup() {
    const posts = __POSTS__;
    const series = __SERIES__;
    const categorySummary = __CATEGORY_SUMMARY__;
    const categoryPosts = __CATEGORY_PAGINATION_POSTS__;
    provide(postsSymbol, posts);
    provide(seriesSymbol, series);
    provide(categorySummarySymbol, categorySummary);
    provide(categoryPaginationPostsSymbol, categoryPosts);
}
