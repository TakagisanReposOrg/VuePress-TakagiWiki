import { mdPluginVueVuePreview } from './md-plugin-vue-preview/index.js';
export const vuePreviewPlugin = () => ({
    name: '@vuepress-reco/vuepress-plugin-vue-preview',
    extendsMarkdown(md) {
        md.use(mdPluginVueVuePreview);
    }
});
