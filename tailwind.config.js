const defaultTheme = require('tailwindcss/defaultTheme'); // eslint-disable-line
const colors = require('tailwindcss/colors');

module.exports = {
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            amber: colors.amber,
            blue: colors.blue,
            cyan: colors.cyan,
            gray: colors.trueGray,
            green: colors.green,
            purple: colors.purple,
            red: colors.red,
            violet: colors.violet,
            yellow: colors.yellow,
        },
        fontFamily: {
            mono: [
                'Menlo',
                'Monaco',
                '"Lucida Console"',
                'Consolas',
                '"Liberation Mono"',
                '"Courier New"',
                'monospace',
            ],
        },
        extend: {
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans],
            },
            width: {
                72: '18rem',
            },
        },
    },
    variants: {
        backgroundColor: ['responsive', 'hover', 'focus', 'active'],
    },
    plugins: [require('@tailwindcss/ui'), require('tailwindcss-hyphens')],
    purge: {
        enabled: process.env.NODE_ENV === 'production',
        content: ['./components/**/*.tsx', './pages/**/*.tsx'],
    },
};
