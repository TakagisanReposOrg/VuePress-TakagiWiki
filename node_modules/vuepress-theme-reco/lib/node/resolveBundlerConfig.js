import { tailwindcssConfig } from '@vuepress-reco/tailwindcss-config';
import postcssImport from 'postcss-import';
import tailwindcssNesting from 'tailwindcss/nesting/index.js';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssEach from 'postcss-each';
export const mergeViteBundlerConfig = (options, config) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // Handling postcss alone
    // For inline PostCSS config, it expects the same format as postcss.config.js.
    // But for plugins property, only array format can be used.
    const userViteConfig = (config === null || config === void 0 ? void 0 : config.viteOptions) || {};
    if (typeof ((_a = userViteConfig === null || userViteConfig === void 0 ? void 0 : userViteConfig.css) === null || _a === void 0 ? void 0 : _a.postcss) === 'string') {
        throw new Error('String type postcss is not supported yet');
    }
    const userPostcssPlugins = ((_c = (_b = userViteConfig === null || userViteConfig === void 0 ? void 0 : userViteConfig.css) === null || _b === void 0 ? void 0 : _b.postcss) === null || _c === void 0 ? void 0 : _c.plugins) || [];
    if (!Array.isArray(userPostcssPlugins)) {
        throw new Error('plugins for postcss must be an array');
    }
    const viteOptions = {
        ...userViteConfig || {},
        ...{
            css: {
                ...(userViteConfig === null || userViteConfig === void 0 ? void 0 : userViteConfig.css) || {},
                ...{
                    postcss: {
                        ...((_d = userViteConfig === null || userViteConfig === void 0 ? void 0 : userViteConfig.css) === null || _d === void 0 ? void 0 : _d.postcss) || {},
                        ...{
                            plugins: [
                                ...userPostcssPlugins,
                                ...(_g = (_f = (_e = options === null || options === void 0 ? void 0 : options.viteOptions) === null || _e === void 0 ? void 0 : _e.css) === null || _f === void 0 ? void 0 : _f.postcss) === null || _g === void 0 ? void 0 : _g.plugins
                            ],
                        }
                    },
                }
            },
        }
    };
    return {
        viteOptions: { ...viteOptions },
        vuePluginOptions: { ...((options === null || options === void 0 ? void 0 : options.vuePluginOptions) || {}), ...((config === null || config === void 0 ? void 0 : config.vuePluginOptions) || {}) }
    };
};
export const defaultViteBundlerConfig = () => ({
    viteOptions: {
        css: {
            postcss: {
                plugins: [
                    postcssImport,
                    tailwindcssNesting,
                    tailwindcss(tailwindcssConfig),
                    autoprefixer({}),
                    postcssEach
                ]
            }
        },
    }
});
export const resolveUserConfig = (config) => {
    return (config === null || config === void 0 ? void 0 : config.viteBundler) || {};
};
