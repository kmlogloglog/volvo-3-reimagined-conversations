import stylistic from '@stylistic/eslint-plugin';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt([
    {
        files: ['**/*.{vue,js,mjs,jsx}'],
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/eol-last': 'error',
            '@stylistic/indent': ['error', 4],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/comma-spacing': 'error',
            '@stylistic/operator-linebreak': ['error', 'before'],
            '@stylistic/new-parens': 'error',
            '@stylistic/max-len': [
                'error',
                {
                    code: 160,
                    ignorePattern: 'd="([\\s\\S]*?)"',
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                },
            ],
            '@stylistic/block-spacing': 'error',
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
            'vue/script-indent': ['error', 4, { baseIndent: 1 }],
            'vue/html-indent': [
                'error',
                4,
                {
                    baseIndent: 1,
                    alignAttributesVertically: false,
                },
            ],
            'vue/multi-word-component-names': 'off',
            'vue/html-self-closing': [
                'error',
                {
                    html: {
                        void: 'always',
                        normal: 'never',
                        component: 'always',
                    },
                    svg: 'always',
                    math: 'always',
                },
            ],
        },
    },

    {
        files: ['**/*.vue'],
        rules: {
            '@stylistic/indent': 'off',
        },
    },
]);
