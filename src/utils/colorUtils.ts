// Types
export interface ColorPalette {
    primary: string;
    secondary: string;
    tertiary?: string;
}

export interface StatusColors extends ColorPalette {
    success: string;
    error: string;
    warning: string;
    info: string;
    purple: string;
}

// Constants
const COSMIC_COLORS = [
    '#D07E47', // Orange
    '#a66794', // Purple
    '#e89558', // Light Orange
    '#b87aa6', // Light Purple
    '#d88575', // Coral
    '#c96d3d', // Dark Orange
    '#955b84', // Dark Purple
    '#d88446', // Amber
    '#6b9bd1', // Blue
    '#88b87a', // Green
    '#c77435', // Brown Orange
    '#845075', // Deep Purple
    '#7daee0', // Light Blue
    '#9bc98d', // Light Green
    '#b85e34', // Rust
    '#a66794', // Mauve
] as const;

// Default color values for SSR
const DEFAULT_COLORS = {
    status: {
        primary: '#D07E47',
        success: '#88b87a',
        error: '#d87575',
        warning: '#e89558',
        info: '#6b9bd1',
        purple: '#a66794',
    },
    text: {
        primary: '#2a2520',
        secondary: '#6b5d52',
        tertiary: '#9a8a7d',
    },
    border: {
        primary: '#e8e3df',
        secondary: '#d4ccc4',
    },
    background: {
        primary: '#ffffff',
        secondary: '#faf9f8',
        tertiary: '#f5f3f1',
    },
} as const;

// Utility functions
const isServerSide = (): boolean => typeof window === 'undefined';

const getComputedColor = (property: string): string => {
    if (isServerSide()) return '';
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
};

const createColorGetter = <T extends Record<string, string>>(
    cssPrefix: string,
    defaultColors: T
): () => T => {
    return () => {
        if (isServerSide()) return defaultColors;

        const result = {} as T;
        for (const key in defaultColors) {
            (result as any)[key] = getComputedColor(`--${cssPrefix}-${key}`);
        }
        return result;
    };
};

/**
 * String'den tutarlı bir renk üretir (aynı string her zaman aynı rengi verir)
 * @param str - Renk üretilecek string (örn: test grubu adı)
 * @returns Cosmic tema renginden bir renk kodu
 */
export function getConsistentColorFromString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32-bit integer'a dönüştür
    }

    const index = Math.abs(hash) % COSMIC_COLORS.length;
    return COSMIC_COLORS[index];
}

// Color getter functions
export const getChartColors = createColorGetter('status', DEFAULT_COLORS.status) as () => StatusColors;
export const getTextColors = createColorGetter('text', DEFAULT_COLORS.text) as () => ColorPalette;
export const getBorderColors = createColorGetter('border', DEFAULT_COLORS.border) as () => ColorPalette;
export const getBgColors = createColorGetter('bg', DEFAULT_COLORS.background) as () => ColorPalette;
