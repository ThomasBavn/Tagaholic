import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FolderNameDialog } from "@/components/FolderNameDialog";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import type { FolderSummary } from "@/core";
import { core } from "@/core/app";

const tagCount = (count: number) => (count === 1 ? "1 Tag" : `${count} Tags`);

function FolderRow({
    folder,
    onRename,
    onDelete,
}: {
    folder: FolderSummary;
    onRename: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={styles.row}>
            <Link href={{ pathname: "/folder/[id]", params: { id: folder.id } }} asChild>
                <Pressable style={styles.link} accessibilityRole="link">
                    <IconSymbol
                        name={folder.builtIn ? "bookmark.fill" : "folder.fill"}
                        size={24}
                        color={Colors.light.tint}
                    />
                    <ThemedText type="defaultSemiBold" style={styles.name}>
                        {folder.name}
                    </ThemedText>
                    <ThemedText style={styles.count}>{tagCount(folder.tagCount)}</ThemedText>
                </Pressable>
            </Link>
            {/* Bookmarks can't be renamed or deleted. */}
            {!folder.builtIn && (
                <>
                    <Pressable
                        onPress={onRename}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Rename ${folder.name}`}
                    >
                        <IconSymbol name="pencil" size={22} color={Colors.light.icon} />
                    </Pressable>
                    <Pressable
                        onPress={onDelete}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${folder.name}`}
                    >
                        <IconSymbol name="trash" size={22} color={Colors.light.icon} />
                    </Pressable>
                </>
            )}
        </View>
    );
}

/** The Folders tab: Bookmarks first, then the Singer's own Folders, which can be managed here. */
export default function FoldersScreen() {
    const [folders, setFolders] = useState<FolderSummary[] | null>(null);
    const [naming, setNaming] = useState<{ renaming: FolderSummary | null } | null>(null);

    const reload = useCallback(() => {
        core.folders().then(setFolders, (error) => console.error(error));
    }, []);

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

    const saveName = (name: string) => {
        const renaming = naming?.renaming;
        setNaming(null);
        const change = renaming ? core.renameFolder(renaming.id, name) : core.createFolder(name);
        change.then(reload, (error) => console.error(error));
    };

    const confirmDelete = (folder: FolderSummary) => {
        Alert.alert(
            `Delete "${folder.name}"?`,
            "Its Tags stay in your other Folders and keep their Sung Parts.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () =>
                        core.deleteFolder(folder.id).then(reload, (error) => console.error(error)),
                },
            ],
        );
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="title">Folders</ThemedText>
                    <Pressable
                        onPress={() => setNaming({ renaming: null })}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="New Folder"
                    >
                        <IconSymbol name="folder.badge.plus" size={28} color={Colors.light.tint} />
                    </Pressable>
                </View>
                {folders === null ? (
                    <ActivityIndicator style={styles.header} />
                ) : (
                    <FlatList
                        data={folders}
                        keyExtractor={(folder) => folder.id}
                        renderItem={({ item }) => (
                            <FolderRow
                                folder={item}
                                onRename={() => setNaming({ renaming: item })}
                                onDelete={() => confirmDelete(item)}
                            />
                        )}
                    />
                )}
                {naming && (
                    <FolderNameDialog
                        title={naming.renaming ? "Rename Folder" : "New Folder"}
                        initialName={naming.renaming?.name}
                        confirmLabel={naming.renaming ? "Rename" : "Create"}
                        onConfirm={saveName}
                        onCancel={() => setNaming(null)}
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        paddingRight: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ccc",
    },
    link: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 16,
        paddingVertical: 12,
    },
    name: {
        flex: 1,
    },
    count: {
        opacity: 0.6,
    },
});
