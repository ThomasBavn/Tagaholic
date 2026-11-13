import { Link } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatKey } from "@/components/formatKey";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import type { SearchResult, TagSummary } from "@/core";
import { core } from "@/core/app";

function TagRow({ tag }: { tag: TagSummary }) {
    return (
        <Link href={{ pathname: "/tag/[id]", params: { id: tag.id } }} asChild>
            <Pressable style={styles.row} accessibilityRole="link">
                <ThemedText type="defaultSemiBold">{tag.title}</ThemedText>
                <ThemedText style={styles.details}>
                    {formatKey(tag.key)} · {tag.parts} parts · ★ {tag.rating.toFixed(1)}
                </ThemedText>
            </Pressable>
        </Link>
    );
}

export default function SearchScreen() {
    const [text, setText] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [failed, setFailed] = useState(false);

    const search = async () => {
        if (!text.trim()) return;
        setSearching(true);
        setFailed(false);
        try {
            setResult(await core.search({ text: text.trim() }));
        } catch (error) {
            console.error(error);
            setFailed(true);
        } finally {
            setSearching(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Title or lyrics"
                        value={text}
                        onChangeText={setText}
                        onSubmitEditing={search}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    <Pressable
                        style={styles.button}
                        onPress={search}
                        accessibilityRole="button"
                    >
                        <ThemedText style={styles.buttonText}>Search</ThemedText>
                    </Pressable>
                </View>

                {searching && <ActivityIndicator style={styles.status} />}
                {failed && (
                    <ThemedText style={styles.status}>
                        Search failed. Please try again.
                    </ThemedText>
                )}
                {result && !searching && (
                    <FlatList
                        data={result.tags}
                        keyExtractor={(tag) => String(tag.id)}
                        renderItem={({ item }) => <TagRow tag={item} />}
                        ListHeaderComponent={
                            <ThemedText style={styles.count}>
                                {result.available === 1
                                    ? "1 Tag found"
                                    : `${result.available} Tags found`}
                            </ThemedText>
                        }
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
    searchBar: {
        flexDirection: "row",
        gap: 8,
        padding: 16,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: Colors.light.tint,
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
    },
    status: {
        padding: 16,
    },
    count: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        opacity: 0.6,
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#ccc",
    },
    details: {
        opacity: 0.7,
    },
});
