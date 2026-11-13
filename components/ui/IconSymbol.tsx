// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { type ColorValue, type StyleProp, type TextStyle } from "react-native";

// SymbolViewProps["name"] also allows a per-platform object; only plain SF Symbol names are mapped.
type IconMapping = Record<
    Extract<SymbolViewProps["name"], string>,
    ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
    "chevron.right": "chevron-right",
    "magnifyingglass.circle.fill": "search",
    "folder.fill": "folder",
    "music.note.list": "library-music",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
    name,
    size = 24,
    color,
    style,
}: {
    name: IconSymbolName;
    size?: number;
    color: ColorValue;
    style?: StyleProp<TextStyle>;
    weight?: SymbolWeight;
}) {
    return (
        <MaterialIcons
            // Tab bars hand over a ColorValue (which RN 0.88 types also allow as null/number); in practice it is a color string.
            color={color as ComponentProps<typeof MaterialIcons>["color"]}
            size={size}
            name={MAPPING[name]}
            style={style}
        />
    );
}
