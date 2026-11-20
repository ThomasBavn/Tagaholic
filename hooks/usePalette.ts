import { Colors, type ColorScheme } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

/** The system colour scheme as light or dark: `null` and 'unspecified' count as light. */
export function useResolvedColorScheme(): ColorScheme {
    return useColorScheme() === "dark" ? "dark" : "light";
}

/** The app palette for the current colour scheme. */
export function usePalette() {
    return Colors[useResolvedColorScheme()];
}
