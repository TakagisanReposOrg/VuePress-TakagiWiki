import type { Component } from 'vue'
import type { a as ViteSSGClientOptions, V as ViteSSGContext } from '../types-31f3c156'
import 'vue-router'
import '@vueuse/head'
import 'critters'
export { R as RouterOptions, a as ViteSSGClientOptions, V as ViteSSGContext, b as ViteSSGOptions } from '../types-31f3c156'

declare function ViteSSG(App: Component, fn?: (context: ViteSSGContext<false>) => Promise<void> | void, options?: ViteSSGClientOptions): (client?: boolean) => Promise<ViteSSGContext<false>>

export { ViteSSG }
