import { type VNode } from "vue";
import { type ResolvedSidebarHeaderItem, type ResolvedSidebarItem } from "../utils/index.js";
export declare const renderItem: (config: ResolvedSidebarItem, props: VNode["props"]) => VNode;
export declare const renderChildren: (children: ResolvedSidebarHeaderItem[]) => VNode | null;
