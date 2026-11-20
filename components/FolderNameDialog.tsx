import { useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { usePalette } from "@/hooks/usePalette";

/**
 * Asks the Singer for a Folder name, to create or rename a Folder. It reads `initialName`
 * only when it mounts, so callers unmount it between uses.
 */
export function FolderNameDialog({
    title,
    initialName = "",
    confirmLabel,
    onConfirm,
    onCancel,
}: {
    title: string;
    initialName?: string;
    confirmLabel: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initialName);
    const palette = usePalette();
    const canConfirm = name.trim() !== "";
    const confirm = () => {
        if (canConfirm) onConfirm(name);
    };

    return (
        <Modal transparent animationType="fade" onRequestClose={onCancel}>
            <View style={[styles.backdrop, { backgroundColor: palette.scrim }]}>
                <ThemedView style={[styles.dialog, { backgroundColor: palette.surface }]}>
                    <ThemedText type="subtitle">{title}</ThemedText>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        onSubmitEditing={confirm}
                        placeholder="Folder name"
                        placeholderTextColor={palette.mutedText}
                        autoFocus
                        returnKeyType="done"
                        accessibilityLabel="Folder name"
                        style={[
                            styles.input,
                            { color: palette.text, borderBottomColor: palette.border },
                        ]}
                    />
                    <View style={styles.buttons}>
                        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
                            <ThemedText style={{ color: palette.accent }}>Cancel</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={confirm}
                            disabled={!canConfirm}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canConfirm }}
                        >
                            <ThemedText
                                type="defaultSemiBold"
                                style={[{ color: palette.accent }, !canConfirm && styles.disabled]}
                            >
                                {confirmLabel}
                            </ThemedText>
                        </Pressable>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    dialog: {
        gap: 16,
        padding: 20,
        borderRadius: 12,
    },
    input: {
        borderBottomWidth: 1,
        paddingVertical: 8,
        fontSize: 16,
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 24,
    },
    disabled: {
        opacity: 0.4,
    },
});
