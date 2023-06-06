import { type FunctionalComponent, type VNode } from "vue";
import { type ThemeProjectHomeFeatureOptions, type ThemeProjectHomeHighlightItem } from "../../shared/index.js";
import "../styles/feature-panel.scss";
declare const FeaturePanel: FunctionalComponent<ThemeProjectHomeFeatureOptions, Record<never, never>, {
    image?: (props: ThemeProjectHomeFeatureOptions) => VNode[] | VNode | null;
    info?: (props: ThemeProjectHomeFeatureOptions) => VNode[] | VNode | null;
    highlights?: (props: ThemeProjectHomeHighlightItem[]) => VNode[] | VNode | null;
}>;
export default FeaturePanel;
