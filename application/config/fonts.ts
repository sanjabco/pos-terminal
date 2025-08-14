// Font configuration for the entire app
export const Fonts = {
    // Regular font weights
    regular: 'IRANSansWebFaNum',
    light: 'IRANSansWebFaNum-Light',
    ultraLight: 'IRANSansWebFaNum-UltraLight',
    medium: 'IRANSansWebFaNum-Medium',
    bold: 'IRANSansWebFaNum-Bold',

    // Font sizes
    sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 22,
        '3xl': 24,
        '4xl': 28,
        '5xl': 32,
    },

    // Common text styles
    styles: {
        header: {
            fontFamily: 'IRANSansWebFaNum-Bold',
            fontSize: 20,
            color: '#333',
        },
        title: {
            fontFamily: 'IRANSansWebFaNum-Bold',
            fontSize: 18,
            color: '#333',
        },
        subtitle: {
            fontFamily: 'IRANSansWebFaNum-Medium',
            fontSize: 16,
            color: '#666',
        },
        body: {
            fontFamily: 'IRANSansWebFaNum',
            fontSize: 14,
            color: '#333',
        },
        caption: {
            fontFamily: 'IRANSansWebFaNum',
            fontSize: 12,
            color: '#666',
        },
        button: {
            fontFamily: 'IRANSansWebFaNum-Medium',
            fontSize: 16,
            color: 'white',
        },
        input: {
            fontFamily: 'IRANSansWebFaNum',
            fontSize: 14,
            color: '#333',
        },
    },
} as const;

// Helper function to get font style
export const getFontStyle = (type: keyof typeof Fonts.styles, overrides?: any) => ({
    ...Fonts.styles[type],
    ...overrides,
});

// Helper function to get font family
export const getFontFamily = (weight: keyof Omit<typeof Fonts, 'sizes' | 'styles'>) => {
    return Fonts[weight];
}; 