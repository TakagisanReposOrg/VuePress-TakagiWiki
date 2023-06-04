import { path, getDirname } from '@vuepress/utils';
const __dirname = getDirname(import.meta.url);
export const bulletinPopoverPlugin = () => {
    return {
        name: '@vuepress-reco/vuepress-plugin-bulletin-popover',
        clientConfigFile: path.resolve(__dirname, '../client/config.js'),
    };
};
