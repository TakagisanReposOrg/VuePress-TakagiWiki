import taskLists from 'markdown-it-task-lists';
export const markdownTaskPlugin = () => {
    return (app) => {
        return {
            name: '@vuepress-reco/vuepress-plugin-markdown-task',
            extendsMarkdown: (md) => {
                md.use(taskLists);
            },
        };
    };
};
