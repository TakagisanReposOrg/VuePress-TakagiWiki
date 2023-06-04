import { Ref } from 'vue';
export declare function useInitCopyBtn(): {
    codeNodes: Ref<NodeListOf<HTMLPreElement>>;
    initCopyBtn: () => void;
};
