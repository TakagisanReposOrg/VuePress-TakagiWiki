import type { ViteBundlerOptions } from '@vuepress/bundler-vite';
export declare const mergeViteBundlerConfig: (options: ViteBundlerOptions, config: ViteBundlerOptions) => ViteBundlerOptions;
export declare const defaultViteBundlerConfig: () => ViteBundlerOptions;
export declare const resolveUserConfig: (config: Record<string, unknown>) => ViteBundlerOptions;
