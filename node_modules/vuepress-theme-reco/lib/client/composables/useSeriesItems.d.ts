import type { ComputedRef, InjectionKey } from 'vue';
import type { RecoThemeData, RecoThemeNormalPageFrontmatter, SeriesConfigArray, SeriesConfigObject } from '../../types';
export interface NavItem {
    text: string;
    ariaLabel?: string;
}
export interface NavGroup<T> extends NavItem {
    children: T[];
}
export interface NavLink extends NavItem {
    link: string;
    rel?: string;
    target?: string;
}
export interface ResolvedSeriesItem extends Partial<NavLink> {
    text?: string;
    children?: ResolvedSeriesItem[];
    collapsible?: boolean;
}
export declare type SeriesItemsRef = ComputedRef<ResolvedSeriesItem[]>;
export declare const seriesItemsSymbol: InjectionKey<SeriesItemsRef>;
export declare const useSeriesItems: () => SeriesItemsRef;
export declare const resolveSeriesItems: (frontmatter: RecoThemeNormalPageFrontmatter, themeLocal: RecoThemeData, series: SeriesConfigObject) => ResolvedSeriesItem[];
/**
 * Resolve series items if the config is an array
 */
export declare const resolveArraySeriesItems: (seriesConfig: SeriesConfigArray) => ResolvedSeriesItem[];
/**
 * Resolve series items if the config is a key -> value (path-prefix -> array) object
 */
export declare const resolveMultiSeriesItems: (seriesConfig: SeriesConfigObject) => ResolvedSeriesItem[];
