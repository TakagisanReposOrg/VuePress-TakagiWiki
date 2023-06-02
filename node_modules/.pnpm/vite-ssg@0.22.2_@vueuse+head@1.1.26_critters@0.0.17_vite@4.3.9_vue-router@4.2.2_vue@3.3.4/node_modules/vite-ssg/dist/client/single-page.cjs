'use strict';

const vue = require('vue');
const head = require('@vueuse/head');
const state = require('../shared/vite-ssg.e6991406.cjs');
const ClientOnly = require('../shared/vite-ssg.0250a125.cjs');

function ViteSSG(App, fn, options = {}) {
  const {
    transformState,
    registerComponents = true,
    useHead = true,
    rootContainer = "#app"
  } = options;
  const isClient = typeof window !== "undefined";
  async function createApp(client = false) {
    const app = client ? vue.createApp(App) : vue.createSSRApp(App);
    let head$1;
    if (useHead) {
      head$1 = head.createHead();
      app.use(head$1);
    }
    const appRenderCallbacks = [];
    const onSSRAppRendered = client ? () => {
    } : (cb) => appRenderCallbacks.push(cb);
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map((cb) => cb()));
    };
    const context = { app, head: head$1, isClient, router: void 0, routes: void 0, initialState: {}, onSSRAppRendered, triggerOnSSRAppRendered, transformState };
    if (registerComponents)
      app.component("ClientOnly", ClientOnly.ClientOnly);
    if (client) {
      await ClientOnly.documentReady();
      context.initialState = transformState?.(window.__INITIAL_STATE__ || {}) || state.deserializeState(window.__INITIAL_STATE__);
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
      const { app } = await createApp(true);
      app.mount(rootContainer, true);
    })();
  }
  return createApp;
}

exports.ViteSSG = ViteSSG;
