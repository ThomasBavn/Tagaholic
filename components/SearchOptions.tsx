import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import type { PartCount, SearchOrder } from "@/core";

const PART_COUNTS: { value: PartCount; label: string }[] = [
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: "any", label: "Any" },
];

const ORDERS: { value: SearchOrder; label: string }[] = [
    { value: "rating", label: "Rating" },
    { value: "downloads", label: "Downloads" },
];

function Choice<T>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.label}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => {
                            if (!selected) onChange(option.value);
                        }}
                        accessibilityRole="radio"
                        accessibilityLabel={option.label}
                        accessibilityState={{ checked: selected }}
                    >
                        <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {option.label}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

/** The Search tab's part-count filter and sort order. */
export function SearchOptions({
    parts,
    sortBy,
    onChangeParts,
    onChangeSortBy,
}: {
    parts: PartCount;
    sortBy: SearchOrder;
    onChangeParts: (parts: PartCount) => void;
    onChangeSortBy: (sortBy: SearchOrder) => void;
}) {
    return (
        <View style={styles.container}>
            <Choice label="Parts" options={PART_COUNTS} value={parts} onChange={onChangeParts} />
            <Choice label="Sort by" options={ORDERS} value={sortBy} onChange={onChangeSortBy} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    group: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    label: {
        width: 64,
        opacity: 0.7,
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
