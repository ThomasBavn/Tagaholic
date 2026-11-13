import type { Ports } from "./ports";
import { searchQuery, SearchFailedError, type SearchRequest } from "./search";
import { parseSearchResponse, parseTagResponse, type SearchResult, type Tag } from "./tagXml";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";
export type { SearchResult, SheetMusic, Tag, TagSummary } from "./tagXml";
export { hasNextPage, SEARCH_PAGE_SIZE, SearchFailedError } from "./search";
export type { PartCount, SearchOrder, SearchRequest } from "./search";

/** A Tag saved on the device when it was opened. */
export interface CachedTag {
    tag: Tag;
    /** When the Singer last opened the Tag, in milliseconds since the epoch. */
    lastOpenedAt: number;
}

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult>;
    /** Fetches a Tag for the Tag page, saves it on the device and records when it was opened. */
    openTag(id: number): Promise<Tag>;
    /** The saved copy of a Tag the Singer has opened, or null if it was never opened. */
    cachedTag(id: number): Promise<CachedTag | null>;
}

const cacheKey = (id: number) => `tag:${id}`;

export function createCore({ tagSource, store, clock }: Ports): Core {
    return {
        async search(request) {
            // Outside the try: a bad request is a bug in the app, not a failed search.
            const query = searchQuery(request);
            try {
                return parseSearchResponse(await tagSource.query(query));
            } catch (cause) {
                throw new SearchFailedError(cause);
            }
        },

        async openTag(id) {
            const xml = await tagSource.query({
                id: String(id),
                fldlist: "id,Title,AltTitle,WritKey,Parts,Lyrics,SheetMusic",
                client: "Tagaholic",
            });
            const tag = parseTagResponse(xml);
            if (!tag) {
                throw new Error(`Tag ${id} isn't on barbershoptags.com`);
            }
            const cached: CachedTag = { tag, lastOpenedAt: clock.now() };
            await store.set(cacheKey(id), JSON.stringify(cached));
            return tag;
        },

        async cachedTag(id) {
            const json = await store.get(cacheKey(id));
            return json === null ? null : (JSON.parse(json) as CachedTag);
        },
    };
}
