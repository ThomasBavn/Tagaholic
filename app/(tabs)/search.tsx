import { FlatList, SafeAreaView, StyleSheet } from "react-native";

import { TagContainer } from "@/components/TagContainer";
import { ThemedView } from "@/components/ThemedView";
import { Tag } from "@/constants/types";
import { XMLParser } from "fast-xml-parser";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { responseToTag } from "../utils/tagHelpers";

export default function HomeScreen() {
    const [data, setData] = useState<Tag[]>([]);

    const results = async (): Promise<Element[] | undefined> => {
        try {
            const queryParams = "q=" + encodeURIComponent("eyes");

            const fetchresponse = await fetch(
                "http://192.168.0.167:3000/api?" + queryParams
            );

            console.log("response", fetchresponse);

            if (!fetchresponse.ok) return;

            // const result = convertXML(await fetchresponse.json());
            // const result = new DOMParser().parseFromString(
            //     await fetchresponse.json(),
            //     "text/xml"
            // );

            const xmlResp = await fetchresponse.json();

            console.log("xml", xmlResp);

            const parser = new XMLParser({ ignoreAttributes: false });
            const result = parser.parse(xmlResp);

            console.log("result", result);

            const final = result.tags.tag.map(responseToTag);

            console.log("final tag", final);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        results().then((data) => setData(data ?? []));
    }, []);

    return (
        <ThemedView style={{ ...styles.stepContainer, height: "100%" }}>
            <SafeAreaProvider>
                <SafeAreaView>
                    <FlatList
                        data={data}
                        keyExtractor={(tag) =>
                            tag.querySelector("id")?.textContent ?? ""
                        }
                        renderItem={(tag) => <TagContainer tag={tag.item} />}
                    />
                </SafeAreaView>
            </SafeAreaProvider>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stepContainer: {
        // gap: 8,
        // marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: "absolute",
    },
});
