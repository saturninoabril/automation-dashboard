const defaultTheme = require('tailwindcss/defaultTheme'); // eslint-disable-line
const colors = require('tailwindcss/colors');

module.exports = {
    theme: {
        colors,
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
        options: {
            safelist: [
                'bg-green-100',
                'bg-gray-100',
                'bg-purple-100',
                'bg-red-100',
                'border-blue-100',
                'border-green-100',
                'border-purple-100',
                'border-red-100',
                'hover:bg-blue-200',
                'hover:bg-green-200',
                'hover:bg-purple-200',
                'hover:bg-red-200',
                'text-amber-700',
                'text-cyan-600',
                'text-green-700',
                'text-red-600',
            ],
        },
    },
};
