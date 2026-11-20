import { Colors, navigationTheme, type ColorScheme } from "@/constants/Colors";
import { contrastRatio, hexToRgb } from "@/constants/contrast";

const schemes: ColorScheme[] = ["light", "dark"];

// WCAG AA: 4.5:1 for body text, 3:1 for icons, large text and control outlines.
const TEXT = 4.5;
const ICON = 3;
// Hairline dividers only need to be visible, not readable.
const BORDER_ON_BACKGROUND = 1.3;
const BORDER_ON_SURFACE = 1.15;
// The accent mustn't be a grey such as the old plain-white dark tint: its
// strongest and weakest channels must differ by this much (out of 255).
const MIN_ACCENT_CHROMA = 80;
const ACCENT_VS_TEXT = 1.3;
// The scrim behind sheets and dialogs is translucent black: dark enough to set the
// sheet apart, light enough that the screen behind still shows through.
const MIN_SCRIM_ALPHA = 0.3;
const MAX_SCRIM_ALPHA = 0.7;

describe.each(schemes)("The %s palette", (scheme) => {
    const palette = Colors[scheme];

    it("defines the same roles as the other mode", () => {
        expect(Object.keys(palette).sort()).toEqual(Object.keys(Colors.light).sort());
    });

    it.each(["background", "surface"] as const)("has readable text on the %s", (behind) => {
        expect(contrastRatio(palette.text, palette[behind])).toBeGreaterThanOrEqual(TEXT);
        expect(contrastRatio(palette.mutedText, palette[behind])).toBeGreaterThanOrEqual(TEXT);
    });

    it("has readable text on the accent, for buttons and selected chips", () => {
        expect(contrastRatio(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(TEXT);
    });

    it.each(["background", "surface"] as const)(
        "has an accent that reads as text and icons on the %s",
        (behind) => {
            expect(contrastRatio(palette.accent, palette[behind])).toBeGreaterThanOrEqual(TEXT);
        },
    );

    it("has unselected tab icons that stand out from the background", () => {
        expect(contrastRatio(palette.icon, palette.background)).toBeGreaterThanOrEqual(ICON);
        expect(contrastRatio(palette.tabIconDefault, palette.background)).toBeGreaterThanOrEqual(
            ICON,
        );
    });

    it("has a border that shows against the background and surface", () => {
        expect(contrastRatio(palette.border, palette.background)).toBeGreaterThanOrEqual(
            BORDER_ON_BACKGROUND,
        );
        expect(contrastRatio(palette.border, palette.surface)).toBeGreaterThanOrEqual(
            BORDER_ON_SURFACE,
        );
    });

    it("has a surface that sets cards and inputs apart from the background", () => {
        expect(palette.surface.toLowerCase()).not.toBe(palette.background.toLowerCase());
    });

    it("has a coloured accent, distinct from the text colour", () => {
        const [r, g, b] = hexToRgb(palette.accent);
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(MIN_ACCENT_CHROMA);
        expect(contrastRatio(palette.accent, palette.text)).toBeGreaterThan(ACCENT_VS_TEXT);
    });

    it("has a scrim that dims the screen behind sheets and dialogs without hiding it", () => {
        const match = /^rgba\(0, 0, 0, (0\.\d+)\)$/.exec(palette.scrim);
        expect(match).not.toBeNull();
        const alpha = Number(match![1]);
        expect(alpha).toBeGreaterThanOrEqual(MIN_SCRIM_ALPHA);
        expect(alpha).toBeLessThanOrEqual(MAX_SCRIM_ALPHA);
    });

    it("selects tabs and tints with the accent", () => {
        expect(palette.tint).toBe(palette.accent);
        expect(palette.tabIconSelected).toBe(palette.accent);
    });
});

describe("The navigation theme", () => {
    it.each(schemes)("uses the %s palette for the header, tab bar and screens", (scheme) => {
        const palette = Colors[scheme];
        const theme = navigationTheme(scheme);

        expect(theme.dark).toBe(scheme === "dark");
        expect(theme.colors).toMatchObject({
            primary: palette.accent,
            background: palette.background,
            card: palette.background,
            text: palette.text,
            border: palette.border,
        });
    });
});
