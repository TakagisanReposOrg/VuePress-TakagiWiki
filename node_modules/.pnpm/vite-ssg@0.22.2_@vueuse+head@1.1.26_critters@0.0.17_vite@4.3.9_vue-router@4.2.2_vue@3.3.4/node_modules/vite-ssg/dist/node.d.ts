import { InlineConfig } from 'vite';
import { b as ViteSSGOptions } from './types-51f3af0f.js';
import 'vue';
import 'vue-router';
import '@vueuse/head';
import 'critters';

declare function build(ssgOptions?: Partial<ViteSSGOptions>, viteConfig?: InlineConfig): Promise<void>;

export { build };
