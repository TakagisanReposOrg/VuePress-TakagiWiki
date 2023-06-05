import { type ComputedRef } from "vue";
import { type NavbarGroup, type NavbarItem } from "../../../../shared/index.js";
import { type ResolvedThemeNavbarItem } from "../utils/index.js";
export declare const resolveNavbarItem: (item: NavbarItem | NavbarGroup | string, prefix?: string) => ResolvedThemeNavbarItem;
export declare const useNavbarConfig: () => ComputedRef<ResolvedThemeNavbarItem[]>;
