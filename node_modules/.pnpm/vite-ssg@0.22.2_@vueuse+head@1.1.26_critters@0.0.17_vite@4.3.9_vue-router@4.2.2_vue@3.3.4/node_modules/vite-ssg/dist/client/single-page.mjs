import { createApp, createSSRApp } from 'vue';
import { createHead } from '@vueuse/head';
import { d as deserializeState } from '../shared/vite-ssg.a009fbf1.mjs';
import { C as ClientOnly, d as documentReady } from '../shared/vite-ssg.5912142e.mjs';

function ViteSSG(App, fn, options = {}) {
  const {
    transformState,
    registerComponents = true,
    useHead = true,
    rootContainer = "#app"
  } = options;
  const isClient = typeof window !== "undefined";
  async function createApp$1(client = false) {
    const app = client ? createApp(App) : createSSRApp(App);
    let head;
    if (useHead) {
      head = createHead();
      app.use(head);
    }
    const appRenderCallbacks = [];
    const onSSRAppRendered = client ? () => {
    } : (cb) => appRenderCallbacks.push(cb);
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map((cb) => cb()));
    };
    const context = { app, head, isClient, router: void 0, routes: void 0, initialState: {}, onSSRAppRendered, triggerOnSSRAppRendered, transformState };
    if (registerComponents)
      app.component("ClientOnly", ClientOnly);
    if (client) {
      await documentReady();
      context.initialState = transformState?.(window.__INITIAL_STATE__ || {}) || deserializeState(window.__INITIAL_STATE__);
    }
    await fn?.(context);
    const initialState = context.initialState;
    return {
      ...context,
      initialState
    };
  }
  if (isClient) {
    (async () => {
      const { app } = await createApp$1(true);
      app.mount(rootContainer, true);
    })();
  }
  return createApp$1;
}

export { ViteSSG };
