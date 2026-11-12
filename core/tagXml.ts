import { XMLParser } from "fast-xml-parser";

/** A Tag as it appears in search results. */
export interface TagSummary {
    id: number;
    title: string;
    /** The Key as barbershoptags.com writes it, e.g. "Major:Gb", or null when the Tag has none. */
    key: string | null;
    parts: number;
    rating: number;
}

export interface SearchResult {
    /** How many Tags match in total, across all pages. */
    available: number;
    tags: TagSummary[];
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false,
    htmlEntities: true,
    isArray: (name) => name === "tag",
});

/** Reads a barbershoptags.com search response. */
export function parseSearchResponse(xml: string): SearchResult {
    const root = parser.parse(xml).tags;

    return {
        available: Number(root["@available"]),
        tags: (root.tag ?? []).map(
            (tag: Record<string, string>): TagSummary => ({
                id: Number(tag.id),
                title: tag.Title,
                key: tag.WritKey || null,
                parts: Number(tag.Parts),
                rating: Number(tag.Rating),
            }),
        ),
    };
}
