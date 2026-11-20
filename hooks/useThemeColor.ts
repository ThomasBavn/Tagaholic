/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { type PaletteRole } from '@/constants/Colors';
import { usePalette, useResolvedColorScheme } from '@/hooks/usePalette';

/** A palette role, unless the caller overrides it for the current colour scheme. */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: PaletteRole
) {
  const override = props[useResolvedColorScheme()];
  const palette = usePalette();
  return override || palette[colorName];
}
