/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type PaletteRole } from '@/constants/Colors';
import { useResolvedColorScheme } from '@/hooks/usePalette';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: PaletteRole
) {
  const theme = useResolvedColorScheme();
  return props[theme] || Colors[theme][colorName];
}
