import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { PdfViewer } from "@/components/PdfViewer";
import { ThemedText } from "@/components/ThemedText";
import type { SheetMusic } from "@/core";

/** Shows a Tag's sheet music, image or PDF, with pinch-zoom and pan. */
export function SheetMusicViewer({ sheetMusic }: { sheetMusic: SheetMusic | null }) {
    const [failed, setFailed] = useState(false);

    if (!sheetMusic) {
        return (
            <Message>barbershoptags.com has no sheet music for this Tag.</Message>
        );
    }
    if (failed) {
        return <Message>{"The sheet music couldn't be loaded. Please try again."}</Message>;
    }

    return (
        <View style={styles.viewer}>
            {sheetMusic.format === "pdf" ? (
                <PdfViewer url={sheetMusic.url} onError={() => setFailed(true)} />
            ) : (
                <ImageZoom
                    uri={sheetMusic.url}
                    minScale={1}
                    maxScale={5}
                    doubleTapScale={2.5}
                    isDoubleTapEnabled
                    resizeMode="contain"
                    style={styles.image}
                    onError={() => setFailed(true)}
                    accessibilityLabel="Sheet music"
                />
            )}
        </View>
    );
}

function Message({ children }: { children: string }) {
    return (
        <View style={styles.message}>
            <ThemedText style={styles.messageText}>{children}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    viewer: {
        flex: 1,
        backgroundColor: "#fff",
        overflow: "hidden",
    },
    image: {
        flex: 1,
        width: "100%",
    },
    message: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    messageText: {
        textAlign: "center",
        opacity: 0.7,
    },
});
