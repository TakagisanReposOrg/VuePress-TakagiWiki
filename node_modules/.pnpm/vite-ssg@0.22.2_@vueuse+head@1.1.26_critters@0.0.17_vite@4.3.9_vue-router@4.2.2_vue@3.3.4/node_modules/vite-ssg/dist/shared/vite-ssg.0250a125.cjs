'use strict';

const vue = require('vue');

function documentReady(_passThrough) {
  if (document.readyState === "loading") {
    return new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", () => resolve(_passThrough));
    });
  }
  return Promise.resolve(_passThrough);
}

const ClientOnly = vue.defineComponent({
  setup(props, { slots }) {
    const mounted = vue.ref(false);
    vue.onMounted(() => mounted.value = true);
    return () => {
      if (!mounted.value)
        return slots.placeholder && slots.placeholder({});
      return slots.default && slots.default({});
    };
  }
});

exports.ClientOnly = ClientOnly;
exports.documentReady = documentReady;
