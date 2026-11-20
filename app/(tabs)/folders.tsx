import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { FolderSummary } from "@/core";
import { core } from "@/core/app";
import { usePalette } from "@/hooks/usePalette";

const tagCount = (count: number) => (count === 1 ? "1 Tag" : `${count} Tags`);

function FolderRow({ folder }: { folder: FolderSummary }) {
    const palette = usePalette();
    return (
        <Link href={{ pathname: "/folder/[id]", params: { id: folder.id } }} asChild>
            <Pressable
                style={[styles.row, { borderBottomColor: palette.border }]}
                accessibilityRole="link"
            >
                <IconSymbol
                    name={folder.builtIn ? "bookmark.fill" : "folder.fill"}
                    size={24}
                    color={palette.accent}
                />
                <ThemedText type="defaultSemiBold" style={styles.name}>
                    {folder.name}
                </ThemedText>
                <ThemedText style={styles.count}>{tagCount(folder.tagCount)}</ThemedText>
            </Pressable>
        </Link>
    );
}

/** The Folders tab: Bookmarks first, then the Singer's own Folders. */
export default function FoldersScreen() {
    const [folders, setFolders] = useState<FolderSummary[] | null>(null);

    // Reloaded on every visit, since Tag pages change the counts.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            core.folders().then(
                (loaded) => active && setFolders(loaded),
                (error) => console.error(error),
            );
            return () => {
                active = false;
            };
        }, []),
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ThemedText type="title" style={styles.title}>
                    Folders
                </ThemedText>
                {folders === null ? (
                    <ActivityIndicator style={styles.title} />
                ) : (
                    <FlatList
                        data={folders}
                        keyExtractor={(folder) => folder.id}
                        renderItem={({ item }) => <FolderRow folder={item} />}
                    />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        padding: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    name: {
        flex: 1,
    },
    count: {
        opacity: 0.6,
    },
});
