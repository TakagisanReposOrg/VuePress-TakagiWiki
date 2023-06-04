import type { Plugin, App } from '@vuepress/core';
import type { PagePluginOptions } from '../types';
export declare const pagePlugin: (options: PagePluginOptions, themeConfig: Record<string, unknown>) => (app: App) => Plugin;
