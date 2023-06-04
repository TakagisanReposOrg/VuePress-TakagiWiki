"use strict";

// src/build/ssr/vuepressLoader.cts
module.exports = function vuepressLoader(source) {
  const { request } = this;
  if (!request.endsWith(".vue"))
    return source;
  return source.replace(
    /import { ssrRender } from (.*)\n/,
    `import { ssrRender as _ssrRender } from $1
import { ssrContextKey } from 'vue'
const ssrRender = (...args) => {
  const ssrContext = args[2].appContext.provides[ssrContextKey]
  ssrContext._registeredComponents.add(${JSON.stringify(request)})
  return _ssrRender(...args)
}
`
  );
};
