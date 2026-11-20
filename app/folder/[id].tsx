import { Link, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";

import { formatKey } from "@/components/formatKey";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BOOKMARKS, type Tag } from "@/core";
import { core } from "@/core/app";

function TagRow({ tag }: { tag: Tag }) {
    return (
        <Link href={{ pathname: "/tag/[id]", params: { id: tag.id } }} asChild>
            <Pressable style={styles.row} accessibilityRole="link">
                <ThemedText type="defaultSemiBold">{tag.title}</ThemedText>
                <ThemedText style={styles.details}>
                    {formatKey(tag.key)} · {tag.parts} parts
                </ThemedText>
            </Pressable>
        </Link>
    );
}

/** One Folder's Tags, read from the device so that it works offline. */
export default function FolderScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [outcome, setOutcome] = useState<
        { id: string; tags: Tag[] } | { id: string; failed: true } | null
    >(null);
    const current = outcome?.id === id ? outcome : null;
    const tags = current && "tags" in current ? current.tags : null;
    const failed = current !== null && "failed" in current;

    // Reloaded on every visit, since the Singer may un-Bookmark a Tag on its Tag page.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            core.folderTags(id).then(
                (loaded) => active && setOutcome({ id, tags: loaded }),
                (error) => {
                    console.error(error);
                    if (active) setOutcome({ id, failed: true });
                },
            );
            return () => {
                active = false;
            };
        }, [id]),
    );

    return (
        <ThemedView style={styles.container}>
            {/* Only Bookmarks exists until the Singer's own Folders arrive (#9). */}
            <Stack.Screen options={{ title: id === BOOKMARKS ? "Bookmarks" : "Folder" }} />
            {!tags && !failed && <ActivityIndicator style={styles.status} />}
            {failed && (
                <ThemedText style={styles.status}>This Folder couldn&apos;t be opened.</ThemedText>
            )}
            {tags && (
                <FlatList
                    data={tags}
                    keyExtractor={(tag) => String(tag.id)}
                    renderItem={({ item }) => <TagRow tag={item} />}
                    ListEmptyComponent={
                        <View style={styles.status}>
                            <ThemedText type="defaultSemiBold">No Tags yet</ThemedText>
                            {id === BOOKMARKS && (
                                <ThemedText>
                                    Tap the Bookmark button on a Tag page to save it here.
                                </ThemedText>
                            )}
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    status: {
        gap: 4,
        padding: 16,
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ccc",
    },
    details: {
        opacity: 0.7,
    },
});
