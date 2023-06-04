import type { ComputedRef, InjectionKey } from 'vue';
import type { PageHeader } from '@vuepress/client';
import type { ResolvedSeriesItem } from '../../types';
export interface ResolvedPageCatalog {
    [prop: string]: any;
}
export declare type CatalogRef = ComputedRef<ResolvedPageCatalog[]>;
export declare const catalogSymbol: InjectionKey<CatalogRef>;
export declare const usePageCatalog: () => CatalogRef;
export declare function resolveCatalog(): any;
export declare const headersToCatalog: (headers: PageHeader[]) => ResolvedSeriesItem[];
