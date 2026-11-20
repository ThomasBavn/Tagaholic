import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatKey } from "@/components/formatKey";
import { PartChips } from "@/components/PartChips";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import type { Part, RepertoireEntry } from "@/core";
import { core } from "@/core/app";

const ALL = "All";

const STANDARD_PARTS = ["Tenor", "Lead", "Baritone", "Bass"];

/** Tenor, Lead, Baritone and Bass first, then the numbered Parts by number. */
const partRank = (part: Part) => {
    const standard = STANDARD_PARTS.indexOf(part);
    return standard >= 0 ? standard : STANDARD_PARTS.length + parseInt(part, 10);
};

/** Every Part that is a Sung Part on some Tag in the Repertoire, to filter by. */
function sungPartsIn(entries: RepertoireEntry[]): Part[] {
    const parts = new Set(entries.flatMap((entry) => entry.sungParts));
    return [...parts].sort((a, b) => partRank(a) - partRank(b));
}

function EntryRow({ entry }: { entry: RepertoireEntry }) {
    const { tag, sungParts } = entry;
    return (
        <Link href={{ pathname: "/tag/[id]", params: { id: tag.id } }} asChild>
            <Pressable style={styles.row} accessibilityRole="link">
                <ThemedText type="defaultSemiBold">{tag.title}</ThemedText>
                <ThemedText style={styles.details}>
                    {formatKey(tag.key)} · {tag.parts} parts
                </ThemedText>
                <ThemedText style={styles.sung}>Sung: {sungParts.join(", ")}</ThemedText>
            </Pressable>
        </Link>
    );
}

/** The Repertoire tab: every Tag with at least one Sung Part, read from the device so that it works offline. */
export default function RepertoireScreen() {
    const [filter, setFilter] = useState<Part | null>(null);
    const [loaded, setLoaded] = useState<
        { filter: Part | null; parts: Part[]; entries: RepertoireEntry[] } | null
    >(null);
    const [failed, setFailed] = useState(false);

    // Reloaded on every visit, since Tag pages change Sung Parts.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            Promise.all([core.repertoire(), filter === null ? null : core.repertoire(filter)]).then(
                ([all, filtered]) => {
                    if (!active) return;
                    const parts = sungPartsIn(all);
                    // The last Tag with this Sung Part may have left the Repertoire.
                    if (filter !== null && !parts.includes(filter)) {
                        setFilter(null);
                        return;
                    }
                    setFailed(false);
                    setLoaded({ filter, parts, entries: filtered ?? all });
                },
                (error) => {
                    console.error(error);
                    if (active) setFailed(true);
                },
            );
            return () => {
                active = false;
            };
        }, [filter]),
    );

    const current = loaded?.filter === filter ? loaded : null;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ThemedText type="title" style={styles.title}>
                    Repertoire
                </ThemedText>
                {loaded && loaded.parts.length > 0 && (
                    <PartChips
                        label="Filter by Part"
                        role="radio"
                        options={[ALL, ...loaded.parts]}
                        isSelected={(option) => option === (filter ?? ALL)}
                        onPress={(option) => setFilter(option === ALL ? null : option)}
                    />
                )}
                {failed && (
                    <ThemedText style={styles.status}>
                        The Repertoire couldn&apos;t be loaded.
                    </ThemedText>
                )}
                {!failed && !current && <ActivityIndicator style={styles.status} />}
                {!failed && current && (
                    <FlatList
                        data={current.entries}
                        keyExtractor={(entry) => String(entry.tag.id)}
                        renderItem={({ item }) => <EntryRow entry={item} />}
                        ListEmptyComponent={
                            <View style={styles.status}>
                                <ThemedText type="defaultSemiBold">No Tags yet</ThemedText>
                                <ThemedText>
                                    Mark the Parts you have sung on a Tag page, and the Tag
                                    appears here.
                                </ThemedText>
                            </View>
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
    title: {
        padding: 16,
    },
    status: {
        gap: 4,
        padding: 16,
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
    sung: {
        opacity: 0.9,
    },
});
