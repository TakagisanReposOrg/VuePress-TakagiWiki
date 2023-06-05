import { type AutoLinkOptions, type NavGroup, type NavbarItem } from "../../../../shared/index.js";
export type ResolvedThemeNavbarItem = NavbarItem | NavGroup<AutoLinkOptions | NavGroup<AutoLinkOptions>>;
