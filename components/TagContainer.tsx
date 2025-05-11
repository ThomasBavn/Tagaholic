import { GestureResponderEvent, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function TagContainer({ tag }: { tag: Element }) {
    console.log("tagContainer props", tag);

    const onClick = (e: GestureResponderEvent) => {};

    return (
        <Pressable onPress={onClick}>
            <div style={{ borderBottom: "2px solid" }}>
                <div style={styles.border}>
                    <ThemedView style={styles.stepContainer}>
                        <ThemedText type="defaultSemiBold">
                            {tag.querySelector("Title")?.textContent}
                        </ThemedText>
                    </ThemedView>
                </div>
            </div>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    border: {
        padding: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: "absolute",
    },
});
