// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    modules: ['@nuxt/eslint', '@nuxtjs/color-mode', '@nuxtjs/device'],
    colorMode: {
        preference: 'system',
        fallback: 'light',
        classSuffix: '',
    },
    plugins: [
        '@/plugins/pinia.ts',
    ],
    typescript: {
        strict: true,
    },
    css: [
        '@/scss/global.scss',
    ],
    devServer: {
        port: 8080,
    },
    runtimeConfig: {
        public: {
            port: 8080,
            googleMapsApiKey: 'AIzaSyD3d1_tLpcZZYu7IqKbXAQo2sxPEk3INT4',
        },
    },
    app: {
        baseURL: '/',
        head: {
            meta: [
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1, viewport-fit=cover',
                },
                {
                    name: 'theme-color',
                    content: '#AA957F',
                    media: '(prefers-color-scheme: light)',
                },
                {
                    name: 'theme-color',
                    content: '#151618',
                    media: '(prefers-color-scheme: dark)',
                },
            ],
            script: [
                {
                    innerHTML: `
                        (function() {
                            var d = document.documentElement.classList;
                            d.remove('light', 'dark');
                            
                            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                                d.add('dark');
                            } else {
                                d.add('light');
                            }
                        })();
                    `,
                    type: 'text/javascript',
                    tagPosition: 'head',
                },
            ],
        },
    },
});
