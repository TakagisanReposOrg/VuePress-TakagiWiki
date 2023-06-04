export declare const tailwindcssConfig: {
    darkMode: string;
    content: string[];
    theme: {
        extend: {
            backgroundOpacity: {
                98: string;
            };
            borderRadius: {
                '1/2': string;
            };
            borderWidth: {
                6: string;
            };
            boxShadow: {
                light: string;
                'light-heavier': string;
                dark: string;
                'dark-heavier': string;
            };
            colors: {
                reco: {
                    primary: string;
                    bg: {
                        lightmode: {
                            DEFAULT: string;
                            code: string;
                            active: string;
                        };
                        darkmode: {
                            DEFAULT: string;
                            code: string;
                            active: string;
                        };
                    };
                    text: {
                        lightmode: {
                            DEFAULT: string;
                            lighter: string;
                        };
                        darkmode: {
                            DEFAULT: string;
                            lighter: string;
                        };
                    };
                    border: {
                        lightmode: string;
                        darkmode: string;
                    };
                    container: {
                        warning: string;
                        danger: string;
                    };
                };
            };
            height: () => Record<string, any>;
            zIndex: {
                'negative-10': number;
            };
            rotate: {
                '225': string;
                '315': string;
            };
        };
    };
};
