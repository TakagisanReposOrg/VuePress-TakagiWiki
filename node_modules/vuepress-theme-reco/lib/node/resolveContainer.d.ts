import type { ContainerPluginOptions } from '@vuepress/plugin-container';
export declare const resolveOptionsForCodeGroup: () => {
    before: () => string;
    after: () => string;
};
export declare const resolveOptionsForCodeGroupItem: () => {
    before: (info: any) => string;
    after: () => string;
};
export declare const resolveContainerOptions: (type: string) => ContainerPluginOptions;
