import { BOOKMARKS, Folders, type FolderSummary } from "./folders";
import type { Ports } from "./ports";
import { TagCache, type CachedTag } from "./tagCache";
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
export type { CachedTag } from "./tagCache";

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

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult<SearchHit>>;
    /**
     * Marks Tags with whether they are Bookmarked and in the Repertoire now, e.g. to refresh
     * results shown before a change.
     */
    markStatus(tags: TagSummary[]): Promise<SearchHit[]>;
    /**
     * Fetches a Tag for the Tag page, caches it and its sheet music on the device, and records
     * when it was opened. The sheet music URL points at the copy on the device when there is one.
     * When barbershoptags.com can't be reached, opens the copy cached on the device instead.
     */
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
    /** Creates one of the Singer's own Folders, listed after the others. Returns its id. */
    createFolder(name: string): Promise<string>;
    /** Renames one of the Singer's own Folders. Bookmarks can't be renamed. */
    renameFolder(folderId: string, name: string): Promise<void>;
    /**
     * Deletes one of the Singer's own Folders. Only the grouping goes: its Tags keep their
     * Sung Parts and their place in other Folders. Bookmarks can't be deleted.
     */
    deleteFolder(folderId: string): Promise<void>;
    /** Adds a Tag at the end of a Folder, unless it is already there. */
    addToFolder(folderId: string, tagId: number): Promise<void>;
    /** Takes a Tag out of a Folder, leaving it in any other Folders. */
    removeFromFolder(folderId: string, tagId: number): Promise<void>;
    /** The ids of the Folders that hold a Tag, in the Folders tab's order. */
    foldersContaining(tagId: number): Promise<string[]>;
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
    /** Every Part that is a Sung Part on some Tag in the Repertoire, in Part order, to filter it by. */
    repertoireParts(): Promise<Part[]>;
}

export function createCore({ tagSource, store, fileStore, clock }: Ports): Core {
    const folders = new Folders(store);
    const sungParts = new SungParts(store);
    const tagCache = new TagCache(store, fileStore, tagSource, clock);
    const cachedTag = (id: number) => tagCache.get(id);

    const markStatus = async (tags: TagSummary[]): Promise<SearchHit[]> => {
        const [bookmarks, repertoireIds] = await Promise.all([
            folders.get(BOOKMARKS),
            sungParts.tagIds(),
        ]);
        const bookmarked = new Set(bookmarks?.tagIds);
        const inRepertoire = new Set(repertoireIds);
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
            let tag: Tag | null;
            try {
                const xml = await tagSource.query({
                    id: String(id),
                    fldlist: "id,Title,AltTitle,WritKey,Parts,Lyrics,SheetMusic",
                    client: "Tagaholic",
                });
                tag = parseTagResponse(xml);
            } catch (cause) {
                // Offline, barbershoptags.com is down, or a Wi-Fi sign-in page answered.
                const cached = await tagCache.reopen(id);
                if (cached) return cached;
                throw new Error(`Tag ${id} couldn't be fetched and isn't cached on the device`, {
                    cause,
                });
            }
            if (!tag) {
                throw new Error(`Tag ${id} isn't on barbershoptags.com`);
            }
            return tagCache.refresh(tag);
        },

        cachedTag,

        isBookmarked: (id) => folders.contains(BOOKMARKS, id),

        toggleBookmark: (id) => folders.toggle(BOOKMARKS, id),

        folders: () => folders.summaries(),

        createFolder: (name) => folders.create(name),

        renameFolder: (folderId, name) => folders.rename(folderId, name),

        deleteFolder: (folderId) => folders.delete(folderId),

        addToFolder: (folderId, tagId) => folders.add(folderId, tagId),

        removeFromFolder: (folderId, tagId) => folders.remove(folderId, tagId),

        foldersContaining: (tagId) => folders.containing(tagId),

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
            const entries = await sungParts.withPart(part);
            const cached = await Promise.all(entries.map((entry) => cachedTag(entry.tagId)));
            // A Tag in the Repertoire is never evicted from the device, and Sung Parts can only be
            // marked on an opened Tag, so a missing copy would be a bug; there is nothing to show for it.
            return entries.flatMap((entry, index) => {
                const copy = cached[index];
                return copy ? [{ tag: copy.tag, sungParts: entry.parts }] : [];
            });
        },

        repertoireParts: () => sungParts.sungAnywhere(),
    };
}
