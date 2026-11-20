import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

/**
 * A scrollable row of chips, one per label. As "switch" chips each one is on or off by itself,
 * as for Sung Part toggles; as "radio" chips exactly one is chosen, as for a filter.
 */
export function PartChips({
    label,
    role,
    options,
    isSelected,
    onPress,
}: {
    label: string;
    role: "switch" | "radio";
    options: string[];
    isSelected: (option: string) => boolean;
    onPress: (option: string) => void;
}) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.row}
            accessibilityRole={role === "radio" ? "radiogroup" : undefined}
            accessibilityLabel={label}
        >
            {options.map((option) => {
                const selected = isSelected(option);
                return (
                    <Pressable
                        key={option}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => onPress(option)}
                        accessibilityRole={role}
                        accessibilityLabel={option}
                        accessibilityState={{ checked: selected }}
                    >
                        <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {option}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // A ScrollView grows by default; this one keeps to the height of its chips.
    scroll: {
        flexGrow: 0,
    },
    row: {
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.light.tint,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    chipSelected: {
        backgroundColor: Colors.light.tint,
    },
    chipText: {
        fontSize: 14,
        lineHeight: 20,
    },
    chipTextSelected: {
        color: "#fff",
    },
});
