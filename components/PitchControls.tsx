import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PitchButton } from "@/components/PitchButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { stepTransposition, type Pitch } from "@/core";

/** The group's height, and the width of each square transpose button. */
const HEIGHT = 36;

/**
 * The Pitch button between buttons that transpose it down and up a semitone. Stepping past
 * ±11 rolls the Transposition over to 0. It starts at 0 each time the Tag page opens: it
 * isn't remembered.
 */
export function PitchControls({ pitch }: { pitch: Pitch }) {
    const [transposition, setTransposition] = useState(0);

    return (
        <View style={styles.group}>
            <TransposeButton
                icon="chevron.down"
                label="Lower Pitch a semitone"
                onPress={() => setTransposition((current) => stepTransposition(current, -1))}
            />
            <View style={styles.divider} />
            <PitchButton pitch={pitch} transposition={transposition} />
            <View style={styles.divider} />
            <TransposeButton
                icon="chevron.up"
                label="Raise Pitch a semitone"
                onPress={() => setTransposition((current) => stepTransposition(current, 1))}
            />
        </View>
    );
}

function TransposeButton({
    icon,
    label,
    onPress,
}: {
    icon: "chevron.down" | "chevron.up";
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.transpose, pressed && styles.pressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <IconSymbol name={icon} size={22} color="#fff" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    group: {
        flexDirection: "row",
        height: HEIGHT,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: Colors.light.tint,
        // Lifts the group off the sheet music it floats over.
        elevation: 4,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
    },
    divider: {
        width: 1,
        backgroundColor: "rgba(255, 255, 255, 0.4)",
    },
    transpose: {
        width: HEIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        opacity: 0.7,
    },
});
