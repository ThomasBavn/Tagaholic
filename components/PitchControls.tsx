import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PitchButton } from "@/components/PitchButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { TRANSPOSE_LIMIT, type Pitch } from "@/core";

/**
 * The Pitch button between buttons that transpose it down and up a semitone. The
 * Transposition starts at 0 each time the Tag page opens: it isn't remembered.
 */
export function PitchControls({ pitch }: { pitch: Pitch }) {
    const [semitones, setSemitones] = useState(0);

    return (
        <View style={styles.group}>
            <TransposeButton
                icon="chevron.down"
                label="Lower Pitch a semitone"
                disabled={semitones <= -TRANSPOSE_LIMIT}
                onPress={() => setSemitones((current) => Math.max(current - 1, -TRANSPOSE_LIMIT))}
            />
            <PitchButton pitch={pitch} semitones={semitones} />
            <TransposeButton
                icon="chevron.up"
                label="Raise Pitch a semitone"
                disabled={semitones >= TRANSPOSE_LIMIT}
                onPress={() => setSemitones((current) => Math.min(current + 1, TRANSPOSE_LIMIT))}
            />
        </View>
    );
}

function TransposeButton({
    icon,
    label,
    disabled,
    onPress,
}: {
    icon: "chevron.down" | "chevron.up";
    label: string;
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.transpose,
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
        >
            <IconSymbol name={icon} size={24} color="#fff" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    group: {
        flexDirection: "row",
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: Colors.light.tint,
        // Lifts the group off the sheet music it floats over.
        elevation: 4,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
    },
    transpose: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    pressed: {
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.4,
    },
});
