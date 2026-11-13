import { StyleSheet } from "react-native";
import Pdf from "react-native-pdf";

/** Shows a PDF with pinch-zoom and pan, using the phone's native PDF renderer. */
export function PdfViewer({ url, onError }: { url: string; onError: () => void }) {
    return (
        <Pdf
            source={{ uri: url, cache: true }}
            style={styles.pdf}
            minScale={1}
            maxScale={5}
            trustAllCerts={false}
            onError={(error) => {
                console.error(error);
                onError();
            }}
        />
    );
}

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
        backgroundColor: "#fff",
    },
});
