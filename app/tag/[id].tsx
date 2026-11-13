import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PitchButton } from "@/components/PitchButton";
import { SheetMusicViewer } from "@/components/SheetMusicViewer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import type { Tag } from "@/core";
import { core } from "@/core/app";

/** The Tag page: a stack screen any tab can open with `/tag/<id>`. */
export default function TagScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    // The outcome remembers which id it belongs to, so a new id shows the
    // spinner again without resetting state inside the effect.
    const [outcome, setOutcome] = useState<
        { id: string; tag: Tag } | { id: string; failed: true } | null
    >(null);
    const current = outcome?.id === id ? outcome : null;
    const tag = current && "tag" in current ? current.tag : null;
    const failed = current !== null && "failed" in current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        let active = true;
        core.openTag(Number(id)).then(
            (opened) => active && setOutcome({ id, tag: opened }),
            (error) => {
                console.error(error);
                if (active) setOutcome({ id, failed: true });
            },
        );
        return () => {
            active = false;
        };
    }, [id]);

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: `#${id}` }} />
            {!tag && !failed && <ActivityIndicator style={styles.status} />}
            {failed && (
                <ThemedText style={styles.status}>
                    This Tag couldn&apos;t be opened. Please try again.
                </ThemedText>
            )}
            {tag && <SheetMusicViewer sheetMusic={tag.sheetMusic} />}
            {tag?.pitch && (
                // Floats in the lower-left corner, over the sheet music, clear of notches and home bars.
                <View
                    style={[
                        styles.pitch,
                        { bottom: insets.bottom + 16, left: insets.left + 16 },
                    ]}
                >
                    <PitchButton pitch={tag.pitch} />
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    status: {
        padding: 16,
    },
    pitch: {
        position: "absolute",
    },
});
