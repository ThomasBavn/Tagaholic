import { Link } from "expo-router";
import { useRef, useState } from "react";
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
import { SearchOptions } from "@/components/SearchOptions";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import {
    hasNextPage,
    type PartCount,
    type SearchOrder,
    type SearchRequest,
    type TagSummary,
} from "@/core";
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

type Status = "idle" | "searching" | "failed" | "loadingMore" | "moreFailed" | "done";

export default function SearchScreen() {
    const [text, setText] = useState("");
    const [parts, setParts] = useState<PartCount>(4);
    const [sortBy, setSortBy] = useState<SearchOrder>("rating");
    /** The text of the search whose results are shown. */
    const [query, setQuery] = useState<string | null>(null);
    const [tags, setTags] = useState<TagSummary[]>([]);
    const [available, setAvailable] = useState(0);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [status, setStatus] = useState<Status>("idle");
    /** Identifies the latest search, so that answers to older ones are ignored. */
    const latest = useRef(0);

    const runSearch = async (request: SearchRequest & { page: number }) => {
        const id = ++latest.current;
        const first = request.page === 1;
        setStatus(first ? "searching" : "loadingMore");
        try {
            const result = await core.search(request);
            if (id !== latest.current) return;
            setTags((shown) => {
                if (first) return result.tags;
                const seen = new Set(shown.map((tag) => tag.id));
                return [...shown, ...result.tags.filter((tag) => !seen.has(tag.id))];
            });
            setAvailable(result.available);
            setPage(request.page);
            setHasMore(hasNextPage(request.page, result));
            setStatus("done");
        } catch (error) {
            if (id !== latest.current) return;
            console.error(error);
            setStatus(first ? "failed" : "moreFailed");
        }
    };

    /**
     * Starts a new search from page 1 with the typed text. When an option changes and the
     * box has been cleared, it searches the shown query again.
     */
    const search = (options: { parts?: PartCount; sortBy?: SearchOrder } = {}) => {
        const optionChanged = options.parts !== undefined || options.sortBy !== undefined;
        const searchText = text.trim() || (optionChanged ? query : null);
        if (!searchText) return;
        setText(searchText);
        setQuery(searchText);
        setTags([]);
        void runSearch({
            text: searchText,
            parts: options.parts ?? parts,
            sortBy: options.sortBy ?? sortBy,
            page: 1,
        });
    };

    const changeParts = (value: PartCount) => {
        setParts(value);
        search({ parts: value });
    };

    const changeSortBy = (value: SearchOrder) => {
        setSortBy(value);
        search({ sortBy: value });
    };

    const loadNextPage = () => {
        if (query === null) return;
        void runSearch({ text: query, parts, sortBy, page: page + 1 });
    };

    const onEndReached = () => {
        if (hasMore && status === "done") loadNextPage();
    };

    const showList = status === "done" || status === "loadingMore" || status === "moreFailed";

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Title or lyrics"
                        value={text}
                        onChangeText={setText}
                        onSubmitEditing={() => search()}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    <Pressable
                        style={styles.button}
                        onPress={() => search()}
                        accessibilityRole="button"
                    >
                        <ThemedText style={styles.buttonText}>Search</ThemedText>
                    </Pressable>
                </View>
                <SearchOptions
                    parts={parts}
                    sortBy={sortBy}
                    onChangeParts={changeParts}
                    onChangeSortBy={changeSortBy}
                />

                {status === "searching" && <ActivityIndicator style={styles.status} />}
                {status === "failed" && (
                    <View style={styles.status}>
                        <ThemedText type="defaultSemiBold">
                            Can&apos;t reach barbershoptags.com
                        </ThemedText>
                        <ThemedText>
                            You may be offline, or the site may be down. Check your connection
                            and try again.
                        </ThemedText>
                    </View>
                )}
                {showList && (
                    <FlatList
                        data={tags}
                        keyExtractor={(tag) => String(tag.id)}
                        renderItem={({ item }) => <TagRow tag={item} />}
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.5}
                        ListHeaderComponent={
                            available > 0 ? (
                                <ThemedText style={styles.count}>
                                    {available === 1 ? "1 Tag found" : `${available} Tags found`}
                                </ThemedText>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.status}>
                                <ThemedText type="defaultSemiBold">No Tags found</ThemedText>
                                <ThemedText>
                                    {parts === "any"
                                        ? `Nothing matches “${query}”. Try other words.`
                                        : `No ${parts}-part Tags match “${query}”. Try other words or another number of parts.`}
                                </ThemedText>
                            </View>
                        }
                        ListFooterComponent={
                            status === "loadingMore" ? (
                                <ActivityIndicator style={styles.status} />
                            ) : status === "moreFailed" ? (
                                <Pressable
                                    style={styles.status}
                                    onPress={loadNextPage}
                                    accessibilityRole="button"
                                >
                                    <ThemedText>
                                        Couldn&apos;t load more Tags. Tap to try again.
                                    </ThemedText>
                                </Pressable>
                            ) : null
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
        gap: 4,
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
