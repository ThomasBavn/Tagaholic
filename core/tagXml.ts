import { XMLParser } from "fast-xml-parser";

import { readPitch, type Pitch } from "./pitch";

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

/** Sheet music the app can show, and where barbershoptags.com serves it. */
export interface SheetMusic {
    url: string;
    format: "image" | "pdf";
}

/** Everything the Tag page shows about a Tag. */
export interface Tag {
    id: number;
    title: string;
    altTitle: string | null;
    /** The Key as barbershoptags.com writes it, e.g. "Major:Gb", or null when the Tag has none. */
    key: string | null;
    /** The tonic to sound before singing, or null when the Key is missing or can't be read. */
    pitch: Pitch | null;
    parts: number;
    lyrics: string | null;
    /** Null when barbershoptags.com has no sheet music for the Tag, or only in a format the app can't show. */
    sheetMusic: SheetMusic | null;
}

const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function readSheetMusic(field: unknown): SheetMusic | null {
    if (!field || typeof field !== "object") return null;
    const { "#text": url, "@type": type } = field as Record<string, string>;
    if (!url || !type) return null;
    const lowerType = type.toLowerCase();
    if (lowerType === "pdf") return { url, format: "pdf" };
    if (IMAGE_TYPES.has(lowerType)) return { url, format: "image" };
    return null;
}

/** Reads a barbershoptags.com response for one Tag, or null when it holds no Tag. */
export function parseTagResponse(xml: string): Tag | null {
    const [tag] = (parser.parse(xml).tags.tag ?? []) as Record<string, unknown>[];
    if (!tag) return null;
    const text = (field: unknown) => (typeof field === "string" && field ? field : null);
    const key = text(tag.WritKey);

    return {
        id: Number(tag.id),
        title: String(tag.Title),
        altTitle: text(tag.AltTitle),
        key,
        pitch: readPitch(key),
        parts: Number(tag.Parts),
        lyrics: text(tag.Lyrics),
        sheetMusic: readSheetMusic(tag.SheetMusic),
    };
}

/** Reads a barbershoptags.com search response. */
export function parseSearchResponse(xml: string): SearchResult {
    const root = parser.parse(xml)?.tags;
    const available = Number(root?.["@available"]);
    if (typeof root !== "object" || !Number.isInteger(available)) {
        throw new Error("Not a barbershoptags.com search response");
    }

    return {
        available,
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
