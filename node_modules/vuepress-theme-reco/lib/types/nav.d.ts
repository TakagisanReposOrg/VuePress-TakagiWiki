/**
 * Base nav item, displayed as text
 */
export interface NavItem {
    text: string;
    ariaLabel?: string;
}
/**
 * Base nav group, has nav items children
 */
export interface NavGroup<T> extends NavItem {
    children: T[];
}
/**
 * Props for `<NavLink>`
 */
export interface NavLink extends NavItem {
    link: string;
    icon?: string;
    rel?: string;
    target?: string;
}
/**
 * Navbar types
 */
export declare type NavbarItem = NavLink;
export declare type NavbarGroup = NavGroup<NavbarGroup | NavbarItem | string>;
export declare type NavbarConfig = (NavbarItem | NavbarGroup | string)[];
export declare type ResolvedNavbarItem = NavbarItem | NavGroup<ResolvedNavbarItem>;
/**
 * Series types
 */
export interface SeriesItem extends NavLink, NavGroup<NavLink | SeriesItem | string> {
}
export interface SeriesGroup extends NavGroup<SeriesGroup | NavLink | SeriesItem | string> {
}
export declare type SeriesConfigArray = (SeriesGroup | SeriesItem | string)[];
export declare type SeriesConfigObject = Record<string, SeriesConfigArray>;
export declare type SeriesConfig = SeriesConfigObject;
export interface ResolvedSeriesItem extends Partial<NavLink> {
    level?: number;
    children?: ResolvedSeriesItem[];
}
