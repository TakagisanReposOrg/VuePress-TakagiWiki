import { GiscusProps } from '@giscus/vue';
import { PropType } from 'vue';
import type { VNode } from 'vue';
import '../styles/giscus.css';
import '../styles/giscus-theme.css';
import '../styles/giscus-theme-dark.css';
declare const _default: import("vue").DefineComponent<{
    options: {
        type: PropType<GiscusProps>;
        default(): {};
    };
}, () => VNode, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<GiscusProps>;
        default(): {};
    };
}>>, {
    options: GiscusProps;
}, {}>;
export default _default;
