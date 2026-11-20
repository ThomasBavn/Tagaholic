import { DarkTheme, DefaultTheme, type Theme } from "expo-router/react-navigation";

/**
 * The app palette: one colour per role, for light and dark mode.
 * Screens pick a role (with `usePalette` or `useThemeColor`) instead of a fixed colour,
 * so they follow the system colour scheme. `Colors.test.ts` checks the contrast of each pair.
 */

// A touch deeper than the old #0a7ea4 tint, so it stays readable on the surface colour too.
const accentLight = "#08759a";
const accentDark = "#5cc1e8";

export const Colors = {
    light: {
        /** Body text and headings. */
        text: "#11181C",
        /** Secondary text: counts, hints, placeholders, empty states. */
        mutedText: "#5F6970",
        /** Screens, the header and the tab bar. */
        background: "#ffffff",
        /** Cards, inputs and unselected chips, set apart from the background. */
        surface: "#F1F3F5",
        /** Dividers between rows, and outlines of inputs and chips. */
        border: "#C5CBD1",
        /** Buttons, selected chips, links, the selected tab and icons that act. */
        accent: accentLight,
        /** Text and icons drawn on the accent. */
        onAccent: "#ffffff",
        /** Dims the screen behind sheets and dialogs. */
        scrim: "rgba(0, 0, 0, 0.4)",
        /** Same as accent; kept for screens not yet moved to the palette roles. */
        tint: accentLight,
        icon: "#687076",
        tabIconDefault: "#687076",
        tabIconSelected: accentLight,
    },
    dark: {
        text: "#ECEDEE",
        mutedText: "#9BA1A6",
        background: "#151718",
        surface: "#202427",
        border: "#3E454B",
        accent: accentDark,
        onAccent: "#0B1A20",
        // Darker than in light mode, or it barely shows over the dark screens.
        scrim: "rgba(0, 0, 0, 0.6)",
        tint: accentDark,
        icon: "#9BA1A6",
        tabIconDefault: "#9BA1A6",
        tabIconSelected: accentDark,
    },
};

export type ColorScheme = keyof typeof Colors;
export type PaletteRole = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * The navigation theme for a colour scheme, so the header, tab bar and screen
 * backgrounds use the palette. The header and tab bar share the screen background.
 */
export function navigationTheme(scheme: ColorScheme): Theme {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    const palette = Colors[scheme];
    return {
        ...base,
        colors: {
            ...base.colors,
            primary: palette.accent,
            background: palette.background,
            card: palette.background,
            text: palette.text,
            border: palette.border,
        },
    };
}
