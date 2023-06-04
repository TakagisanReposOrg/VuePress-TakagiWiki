export declare function useVisible(): {
    visible: import("vue").Ref<boolean>;
    bulletin: import("vue").ComputedRef<any>;
    closeBulletinPopover: () => void;
};
export declare function useHandleNodes(): {
    bodyNodes: import("vue").ComputedRef<any>;
    handleNode: (nodes: any) => any;
};
