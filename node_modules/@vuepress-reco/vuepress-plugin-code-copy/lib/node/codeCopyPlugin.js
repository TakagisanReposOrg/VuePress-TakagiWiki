import { path, getDirname } from '@vuepress/utils';
const __dirname = getDirname(import.meta.url);
export const codeCopyPlugin = () => {
    return (app) => {
        return {
            name: '@vuepress-reco/vuepress-plugin-code-copy',
            clientConfigFile: path.resolve(__dirname, '../client/config.js'),
        };
    };
};
