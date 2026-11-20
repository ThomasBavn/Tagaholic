import { useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

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
    const textColor = useThemeColor({}, "text");
    const canConfirm = name.trim() !== "";
    const confirm = () => {
        if (canConfirm) onConfirm(name);
    };

    return (
        <Modal transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <ThemedView style={styles.dialog}>
                    <ThemedText type="subtitle">{title}</ThemedText>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        onSubmitEditing={confirm}
                        placeholder="Folder name"
                        placeholderTextColor="#888"
                        autoFocus
                        returnKeyType="done"
                        accessibilityLabel="Folder name"
                        style={[styles.input, { color: textColor }]}
                    />
                    <View style={styles.buttons}>
                        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
                            <ThemedText style={styles.button}>Cancel</ThemedText>
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
                                style={[styles.button, !canConfirm && styles.disabled]}
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
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    dialog: {
        gap: 16,
        padding: 20,
        borderRadius: 12,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.tint,
        paddingVertical: 8,
        fontSize: 16,
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 24,
    },
    button: {
        color: Colors.light.tint,
    },
    disabled: {
        opacity: 0.4,
    },
});
