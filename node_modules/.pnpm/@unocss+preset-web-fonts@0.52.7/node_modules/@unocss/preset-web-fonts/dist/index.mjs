import { toArray } from '@unocss/core';

function createGoogleCompatibleProvider(name, host) {
  return {
    name,
    getImportUrl(fonts) {
      const strings = fonts.map((i) => {
        let name2 = i.name.replace(/\s+/g, "+");
        if (i.weights?.length) {
          name2 += i.italic ? `:ital,wght@${i.weights.flatMap((i2) => [`0,${i2}`, `1,${i2}`]).sort().join(";")}` : `:wght@${i.weights.sort().join(";")}`;
        }
        return `family=${name2}`;
      }).join("&");
      return `${host}/css2?${strings}&display=swap`;
    }
  };
}
const GoogleFontsProvider = createGoogleCompatibleProvider("google", "https://fonts.googleapis.com");

const BunnyFontsProvider = createGoogleCompatibleProvider("bunny", "https://fonts.bunny.net");

const FontshareProvider = createFontshareProvider("fontshare", "https://api.fontshare.com");
function createFontshareProvider(name, host) {
  return {
    name,
    getImportUrl(fonts) {
      const strings = fonts.map((f) => {
        let name2 = f.name.replace(/\s+/g, "-").toLocaleLowerCase();
        if (f.weights?.length)
          name2 += `@${f.weights.flatMap((w) => f.italic ? Number(w) + 1 : w).sort().join()}`;
        else
          name2 += `@${f.italic ? 2 : 1}`;
        return `f[]=${name2}`;
      }).join("&");
      return `${host}/v2/css?${strings}&display=swap`;
    }
  };
}

const NoneProvider = {
  name: "none",
  getPreflight() {
    return "";
  },
  getFontName(font) {
    return font.name;
  }
};

const builtinProviders = {
  google: GoogleFontsProvider,
  bunny: BunnyFontsProvider,
  fontshare: FontshareProvider,
  none: NoneProvider
};
function resolveProvider(provider) {
  if (typeof provider === "string")
    return builtinProviders[provider];
  return provider;
}
function normalizedFontMeta(meta, defaultProvider) {
  if (typeof meta !== "string") {
    meta.provider = resolveProvider(meta.provider || defaultProvider);
    return meta;
  }
  const [name, weights = ""] = meta.split(":");
  return {
    name,
    weights: weights.split(/[,;]\s*/).filter(Boolean),
    provider: resolveProvider(defaultProvider)
  };
}
function preset(options = {}) {
  const {
    provider: defaultProvider = "google",
    extendTheme = true,
    inlineImports = true,
    themeKey = "fontFamily",
    customFetch
  } = options;
  const fontObject = Object.fromEntries(
    Object.entries(options.fonts || {}).map(([name, meta]) => [name, toArray(meta).map((m) => normalizedFontMeta(m, defaultProvider))])
  );
  const fonts = Object.values(fontObject).flatMap((i) => i);
  const importCache = {};
  async function importUrl(url) {
    if (inlineImports) {
      if (!importCache[url]) {
        const userAgentWoff2 = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36";
        const promise = customFetch ? customFetch(url) : (await import('ofetch')).$fetch(url, { headers: { "User-Agent": userAgentWoff2 }, retry: 3 });
        importCache[url] = promise.catch((e) => {
          console.error("Failed to fetch web fonts");
          console.error(e);
          if (typeof process !== "undefined" && process.env.CI)
            throw e;
        });
      }
      return await importCache[url];
    } else {
      return `@import url('${url}')`;
    }
  }
  const enabledProviders = new Set(fonts.map((i) => i.provider));
  const preset2 = {
    name: "@unocss/preset-web-fonts",
    preflights: [
      {
        async getCSS() {
          const preflights = [];
          for (const provider of enabledProviders) {
            const fontsForProvider = fonts.filter((i) => i.provider.name === provider.name);
            if (provider.getImportUrl) {
              const url = provider.getImportUrl(fontsForProvider);
              if (url)
                preflights.push(await importUrl(url));
            }
            preflights.push(provider.getPreflight?.(fontsForProvider));
          }
          return preflights.filter(Boolean).join("\n");
        }
      }
    ]
  };
  if (extendTheme) {
    preset2.extendTheme = (theme) => {
      if (!theme[themeKey])
        theme[themeKey] = {};
      const obj = Object.fromEntries(
        Object.entries(fontObject).map(([name, fonts2]) => [name, fonts2.map((f) => f.provider.getFontName?.(f) ?? `"${f.name}"`)])
      );
      for (const key of Object.keys(obj)) {
        if (typeof theme[themeKey][key] === "string")
          theme[themeKey][key] = obj[key].map((i) => `${i},`).join("") + theme[themeKey][key];
        else
          theme[themeKey][key] = obj[key].join(",");
      }
    };
  }
  return preset2;
}

export { createGoogleCompatibleProvider as createGoogleProvider, preset as default, normalizedFontMeta };
