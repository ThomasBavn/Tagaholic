/** The red, green and blue channels of a `#rgb` or `#rrggbb` colour, each 0–255. */
export function hexToRgb(hex: string): [number, number, number] {
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!match) {
        throw new Error(`Expected a hex colour such as #0a7ea4, got "${hex}"`);
    }
    const digits =
        match[1].length === 3
            ? match[1].replace(/./g, (digit) => digit + digit)
            : match[1];
    return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16)) as [
        number,
        number,
        number,
    ];
}

/** WCAG 2 relative luminance: 0 for black, 1 for white. */
function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2 contrast ratio between two colours, from 1 (identical) to 21 (black on white).
 * Body text needs 4.5, large text and icons need 3.
 */
export function contrastRatio(a: string, b: string): number {
    const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
        (x, y) => y - x,
    );
    return (lighter + 0.05) / (darker + 0.05);
}
