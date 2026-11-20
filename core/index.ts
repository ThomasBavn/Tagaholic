import { BOOKMARKS, Folders, type FolderSummary } from "./folders";
import type { Ports } from "./ports";
import { searchQuery, SearchFailedError, type SearchRequest } from "./search";
import { partsOf, SungParts, type Part } from "./sungParts";
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
export { partsOf } from "./sungParts";
export type { Part } from "./sungParts";

/** A search result, marked with whether the Singer has Bookmarked it and whether it is in the Repertoire. */
export interface SearchHit extends TagSummary {
    bookmarked: boolean;
    inRepertoire: boolean;
}

/** A Tag in the Repertoire, with the Parts the Singer has sung on it. */
export interface RepertoireEntry {
    tag: Tag;
    /** In Part order, never empty. */
    sungParts: Part[];
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
    /**
     * Marks Tags with whether they are Bookmarked and in the Repertoire now, e.g. to refresh
     * results shown before a change.
     */
    markStatus(tags: TagSummary[]): Promise<SearchHit[]>;
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
    /** The Parts the Singer has sung on a Tag, in Part order. */
    sungParts(id: number): Promise<Part[]>;
    /**
     * Marks a Part as sung on a Tag the Singer has opened, or clears it, which may move the Tag
     * into or out of the Repertoire. Returns the Tag's Sung Parts afterwards.
     */
    toggleSungPart(id: number, part: Part): Promise<Part[]>;
    /**
     * Every Tag with at least one Sung Part, in the order they joined the Repertoire, read from
     * the copies saved on the device. Given a Part, only the Tags on which it is a Sung Part.
     */
    repertoire(part?: Part): Promise<RepertoireEntry[]>;
}

const cacheKey = (id: number) => `tag:${id}`;

export function createCore({ tagSource, store, clock }: Ports): Core {
    const folders = new Folders(store);
    const sungParts = new SungParts(store);

    const cachedTag = async (id: number): Promise<CachedTag | null> => {
        const json = await store.get(cacheKey(id));
        return json === null ? null : (JSON.parse(json) as CachedTag);
    };

    const markStatus = async (tags: TagSummary[]): Promise<SearchHit[]> => {
        const [bookmarks, sung] = await Promise.all([folders.get(BOOKMARKS), sungParts.all()]);
        const bookmarked = new Set(bookmarks?.tagIds);
        const inRepertoire = new Set(sung.map((entry) => entry.tagId));
        return tags.map((tag) => ({
            ...tag,
            bookmarked: bookmarked.has(tag.id),
            inRepertoire: inRepertoire.has(tag.id),
        }));
    };

    return {
        async search(request) {
            // Outside the try: a bad request is a bug in the app, not a failed search.
            const query = searchQuery(request);
            try {
                const result = parseSearchResponse(await tagSource.query(query));
                return { available: result.available, tags: await markStatus(result.tags) };
            } catch (cause) {
                throw new SearchFailedError(cause);
            }
        },

        markStatus,

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

        sungParts: (id) => sungParts.of(id),

        async toggleSungPart(id, part) {
            const cached = await cachedTag(id);
            if (!cached) throw new Error(`Tag ${id} hasn't been opened, so its Parts aren't known`);
            return sungParts.toggle(id, part, partsOf(cached.tag.parts));
        },

        async repertoire(part) {
            const entries = (await sungParts.all()).filter(
                (entry) => part === undefined || entry.parts.includes(part),
            );
            const cached = await Promise.all(entries.map((entry) => cachedTag(entry.tagId)));
            // A Tag in the Repertoire is never evicted from the device, and Sung Parts can only be
            // marked on an opened Tag, so a missing copy would be a bug; there is nothing to show for it.
            return entries.flatMap((entry, index) => {
                const copy = cached[index];
                return copy ? [{ tag: copy.tag, sungParts: entry.parts }] : [];
            });
        },
    };
}
