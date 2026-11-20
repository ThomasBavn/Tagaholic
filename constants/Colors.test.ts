import { Colors, navigationTheme, type ColorScheme } from "@/constants/Colors";
import { contrastRatio, hexToRgb } from "@/constants/contrast";

const schemes: ColorScheme[] = ["light", "dark"];

// WCAG AA: 4.5:1 for body text, 3:1 for icons, large text and control outlines.
const TEXT = 4.5;
const ICON = 3;

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
        expect(contrastRatio(palette.border, palette.background)).toBeGreaterThanOrEqual(1.3);
        expect(contrastRatio(palette.border, palette.surface)).toBeGreaterThanOrEqual(1.15);
    });

    it("has a surface that sets cards and inputs apart from the background", () => {
        expect(palette.surface.toLowerCase()).not.toBe(palette.background.toLowerCase());
    });

    it("has a coloured accent, distinct from the text colour", () => {
        const [r, g, b] = hexToRgb(palette.accent);
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(80);
        expect(contrastRatio(palette.accent, palette.text)).toBeGreaterThan(1.3);
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
