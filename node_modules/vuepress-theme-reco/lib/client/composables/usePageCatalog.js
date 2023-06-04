import { inject } from 'vue';
import { usePageData } from '@vuepress/client';
export const catalogSymbol = Symbol('catalog');
export const usePageCatalog = () => {
    const catalog = inject(catalogSymbol);
    if (!catalog) {
        throw new Error('usePageCatalog() is called without provider.');
    }
    return catalog;
};
export function resolveCatalog() {
    const page = usePageData();
    // if the series item is current page and children is not set
    // use headers of current page as children
    return headersToCatalog(page.value.headers);
}
const headerToCatalogItem = (header) => ({
    text: header.title,
    link: `#${header.slug}`,
    level: header.level,
    children: headersToCatalog(header.children),
});
export const headersToCatalog = (headers) => headers.map((header) => headerToCatalogItem(header));
