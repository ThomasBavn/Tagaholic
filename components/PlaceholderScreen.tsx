import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

/** A tab screen whose feature hasn't been built yet. */
export function PlaceholderScreen({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.content}>
                <ThemedText type="title">{title}</ThemedText>
                <ThemedText>{description}</ThemedText>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        gap: 8,
        padding: 16,
    },
});
