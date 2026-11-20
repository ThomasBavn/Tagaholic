import { BOOKMARKS, Folders, type FolderSummary } from "./folders";
import type { Ports } from "./ports";
import { searchQuery, SearchFailedError, type SearchRequest } from "./search";
import {
    parseSearchResponse,
    parseTagResponse,
    type SearchResult,
    type Tag,
    type TagSummary,
} from "./tagXml";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";
export type { Pitch } from "./pitch";
export { justIntonationCents, stepTransposition, transposePitch } from "./pitch";
export type { SearchResult, SheetMusic, Tag, TagSummary } from "./tagXml";
export { hasNextPage, SEARCH_PAGE_SIZE, SearchFailedError } from "./search";
export type { PartCount, SearchOrder, SearchRequest } from "./search";
export { BOOKMARKS } from "./folders";
export type { FolderSummary } from "./folders";

/** A search result, marked with whether the Singer has Bookmarked it. */
export interface SearchHit extends TagSummary {
    bookmarked: boolean;
}

/** A Tag saved on the device when it was opened. */
export interface CachedTag {
    tag: Tag;
    /** When the Singer last opened the Tag, in milliseconds since the epoch. */
    lastOpenedAt: number;
}

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult<SearchHit>>;
    /** Marks Tags with whether they are Bookmarked now, e.g. to refresh results shown before a change. */
    markBookmarked(tags: TagSummary[]): Promise<SearchHit[]>;
    /** Fetches a Tag for the Tag page, saves it on the device and records when it was opened. */
    openTag(id: number): Promise<Tag>;
    /** The saved copy of a Tag the Singer has opened, or null if it was never opened. */
    cachedTag(id: number): Promise<CachedTag | null>;
    isBookmarked(id: number): Promise<boolean>;
    /** Adds the Tag to Bookmarks, or removes it. Returns whether it is now Bookmarked. */
    toggleBookmark(id: number): Promise<boolean>;
    /** Every Folder with its Tag count, Bookmarks first. */
    folders(): Promise<FolderSummary[]>;
    /** The Tags in a Folder, in the order they were added, read from the copies saved on the device. */
    folderTags(folderId: string): Promise<Tag[]>;
}

const cacheKey = (id: number) => `tag:${id}`;

export function createCore({ tagSource, store, clock }: Ports): Core {
    const folders = new Folders(store);

    const cachedTag = async (id: number): Promise<CachedTag | null> => {
        const json = await store.get(cacheKey(id));
        return json === null ? null : (JSON.parse(json) as CachedTag);
    };

    const markBookmarked = async (tags: TagSummary[]): Promise<SearchHit[]> => {
        const bookmarks = new Set((await folders.get(BOOKMARKS))?.tagIds);
        return tags.map((tag) => ({ ...tag, bookmarked: bookmarks.has(tag.id) }));
    };

    return {
        async search(request) {
            // Outside the try: a bad request is a bug in the app, not a failed search.
            const query = searchQuery(request);
            try {
                const result = parseSearchResponse(await tagSource.query(query));
                return { available: result.available, tags: await markBookmarked(result.tags) };
            } catch (cause) {
                throw new SearchFailedError(cause);
            }
        },

        markBookmarked,

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

        cachedTag,

        isBookmarked: (id) => folders.contains(BOOKMARKS, id),

        toggleBookmark: (id) => folders.toggle(BOOKMARKS, id),

        folders: () => folders.summaries(),

        async folderTags(folderId) {
            const folder = await folders.get(folderId);
            if (!folder) throw new Error(`There is no Folder "${folderId}"`);
            const cached = await Promise.all(folder.tagIds.map(cachedTag));
            // A Tag in a Folder is never evicted from the device, so a missing copy would
            // mean it was added without being opened; there is nothing to show for it.
            return cached.flatMap((entry) => (entry ? [entry.tag] : []));
        },
    };
}
