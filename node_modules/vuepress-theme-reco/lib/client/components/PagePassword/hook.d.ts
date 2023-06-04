export declare function usePageInfo(): {
    pagePassword: import("vue").ComputedRef<any[]>;
};
export declare function useHandlePassword(pagePassword: any, emit: any): {
    password: import("vue").Ref<string>;
    passwordRef: import("vue").Ref<null>;
    lockIcon: import("vue").Ref<string>;
    lockText: import("vue").Ref<string>;
    focus: () => void;
};
