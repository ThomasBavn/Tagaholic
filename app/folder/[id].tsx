import { Link, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";

import { formatKey } from "@/components/formatKey";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BOOKMARKS, type Tag } from "@/core";
import { core } from "@/core/app";
import { usePalette } from "@/hooks/usePalette";

function TagRow({
    tag,
    folderName,
    onRemove,
}: {
    tag: Tag;
    folderName: string;
    onRemove: () => void;
}) {
    const palette = usePalette();
    return (
        <View style={[styles.row, { borderBottomColor: palette.border }]}>
            <Link href={{ pathname: "/tag/[id]", params: { id: tag.id } }} asChild>
                <Pressable style={styles.link} accessibilityRole="link">
                    <ThemedText type="defaultSemiBold">{tag.title}</ThemedText>
                    <ThemedText style={{ color: palette.mutedText }}>
                        {formatKey(tag.key)} · {tag.parts} parts
                    </ThemedText>
                </Pressable>
            </Link>
            <Pressable
                onPress={onRemove}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${tag.title} from ${folderName}`}
            >
                <IconSymbol name="minus.circle" size={22} color={palette.icon} />
            </Pressable>
        </View>
    );
}

interface Loaded {
    id: string;
    name: string;
    tags: Tag[];
}

/** One Folder's Tags, read from the device so that it works offline. */
export default function FolderScreen() {
    const palette = usePalette();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [outcome, setOutcome] = useState<Loaded | { id: string; failed: true } | null>(null);
    const current = outcome?.id === id ? outcome : null;
    const loaded = current && "tags" in current ? current : null;
    const failed = current !== null && "failed" in current;

    const load = useCallback(async (): Promise<Loaded> => {
        const [folders, tags] = await Promise.all([core.folders(), core.folderTags(id)]);
        const name = folders.find((folder) => folder.id === id)?.name ?? "Folder";
        return { id, name, tags };
    }, [id]);

    // Reloaded on every visit, since the Singer may change a Tag's Folders on its Tag page.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            load().then(
                (result) => active && setOutcome(result),
                (error) => {
                    console.error(error);
                    if (active) setOutcome({ id, failed: true });
                },
            );
            return () => {
                active = false;
            };
        }, [id, load]),
    );

    const remove = (tagId: number) => {
        core.removeFromFolder(id, tagId)
            .then(load)
            .then(setOutcome, (error) => console.error(error));
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: loaded?.name ?? (failed ? "Folder" : "") }} />
            {!loaded && !failed && <ActivityIndicator style={styles.status} color={palette.accent} />}
            {failed && (
                <ThemedText style={styles.status}>This Folder couldn&apos;t be opened.</ThemedText>
            )}
            {loaded && (
                <FlatList
                    data={loaded.tags}
                    keyExtractor={(tag) => String(tag.id)}
                    renderItem={({ item }) => (
                        <TagRow
                            tag={item}
                            folderName={loaded.name}
                            onRemove={() => remove(item.id)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.status}>
                            <ThemedText type="defaultSemiBold">No Tags yet</ThemedText>
                            <ThemedText>
                                {id === BOOKMARKS
                                    ? "Tap the Bookmark button on a Tag page to save it here."
                                    : "Use “Add to folder…” on a Tag page to file it here."}
                            </ThemedText>
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
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    link: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
});
