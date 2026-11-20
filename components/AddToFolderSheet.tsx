import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { FolderNameDialog } from "@/components/FolderNameDialog";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { FolderSummary } from "@/core";
import { core } from "@/core/app";
import { usePalette } from "@/hooks/usePalette";

interface Choice extends FolderSummary {
    holdsTag: boolean;
}

/**
 * "Add to folder…" on the Tag page: the Singer's own Folders, each ticked when it holds the Tag.
 * Tapping a Folder adds the Tag to it or takes it out, and "New Folder…" creates a Folder
 * holding the Tag. Bookmarks is left to the Bookmark button.
 */
export function AddToFolderSheet({ tagId, onClose }: { tagId: number; onClose: () => void }) {
    const palette = usePalette();
    const [choices, setChoices] = useState<Choice[] | null>(null);
    const [naming, setNaming] = useState(false);

    const load = useCallback(async () => {
        const [folders, holding] = await Promise.all([
            core.folders(),
            core.foldersContaining(tagId),
        ]);
        return folders
            .filter((folder) => !folder.builtIn)
            .map((folder) => ({ ...folder, holdsTag: holding.includes(folder.id) }));
    }, [tagId]);

    const reload = useCallback(() => {
        load().then(setChoices, (error) => console.error(error));
    }, [load]);

    useEffect(() => {
        let active = true;
        load().then(
            (loaded) => active && setChoices(loaded),
            (error) => console.error(error),
        );
        return () => {
            active = false;
        };
    }, [load]);

    const toggle = (choice: Choice) => {
        const change = choice.holdsTag
            ? core.removeFromFolder(choice.id, tagId)
            : core.addToFolder(choice.id, tagId);
        change.then(reload, (error) => console.error(error));
    };

    const create = (name: string) => {
        setNaming(false);
        core.createFolder(name)
            .then((id) => core.addToFolder(id, tagId))
            .then(reload, (error) => console.error(error));
    };

    if (naming) {
        return (
            <FolderNameDialog
                title="New Folder"
                confirmLabel="Create"
                onConfirm={create}
                onCancel={() => setNaming(false)}
            />
        );
    }

    return (
        <Modal transparent animationType="slide" onRequestClose={onClose}>
            <Pressable
                style={[styles.backdrop, { backgroundColor: palette.scrim }]}
                onPress={onClose}
                accessibilityLabel="Close"
            />
            <ThemedView style={[styles.sheet, { backgroundColor: palette.surface }]}>
                <View style={styles.header}>
                    <ThemedText type="subtitle">Add to folder</ThemedText>
                    <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
                        <ThemedText type="defaultSemiBold" style={{ color: palette.accent }}>
                            Done
                        </ThemedText>
                    </Pressable>
                </View>
                {choices === null ? (
                    <ActivityIndicator style={styles.row} color={palette.accent} />
                ) : (
                    <FlatList
                        data={choices}
                        keyExtractor={(choice) => choice.id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={styles.row}
                                onPress={() => toggle(item)}
                                accessibilityRole="checkbox"
                                accessibilityLabel={item.name}
                                accessibilityState={{ checked: item.holdsTag }}
                            >
                                <IconSymbol
                                    name={item.holdsTag ? "checkmark.square.fill" : "square"}
                                    size={24}
                                    color={palette.accent}
                                />
                                <ThemedText style={styles.name}>{item.name}</ThemedText>
                            </Pressable>
                        )}
                        ListFooterComponent={
                            <Pressable
                                style={styles.row}
                                onPress={() => setNaming(true)}
                                accessibilityRole="button"
                            >
                                <IconSymbol
                                    name="folder.badge.plus"
                                    size={24}
                                    color={palette.accent}
                                />
                                <ThemedText style={[styles.name, { color: palette.accent }]}>
                                    New Folder…
                                </ThemedText>
                            </Pressable>
                        }
                    />
                )}
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
    },
    sheet: {
        maxHeight: "60%",
        paddingBottom: 24,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    name: {
        flex: 1,
    },
});
