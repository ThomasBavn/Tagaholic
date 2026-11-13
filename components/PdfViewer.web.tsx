import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";

/**
 * The web build is only a development convenience, and react-native-pdf is native-only.
 * barbershoptags.com serves PDFs as downloads that can't be shown in a frame,
 * so the web build links to the PDF instead.
 */
export function PdfViewer({ url }: { url: string; onError: () => void }) {
    return (
        <View style={styles.container}>
            <a href={url} target="_blank" rel="noreferrer">
                <ThemedText type="link">Open the PDF sheet music</ThemedText>
            </a>
            <ThemedText style={styles.note}>
                PDFs show inside the app on Android.
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
    },
    note: {
        opacity: 0.6,
    },
});
