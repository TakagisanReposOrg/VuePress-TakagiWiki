export declare function useSiteInfo(): {
    siteBrandLogo: import("vue").ComputedRef<string | null | undefined>;
    siteBrandTitle: import("vue").ComputedRef<string>;
    sitePassword: import("vue").ComputedRef<string[]>;
};
export declare function useHandlePassword(sitePassword: any, emit: any): {
    password: import("vue").Ref<string>;
    passwordRef: import("vue").Ref<null>;
    lockIcon: import("vue").Ref<string>;
    lockText: import("vue").Ref<string>;
    focus: () => void;
};
