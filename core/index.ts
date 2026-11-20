import { BOOKMARKS, Folders, type FolderSummary } from "./folders";
import type { Ports } from "./ports";
import { TagCache, type CachedTag } from "./tagCache";
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
export type { CachedTag } from "./tagCache";

/** A search result, marked with whether the Singer has Bookmarked it. */
export interface SearchHit extends TagSummary {
    bookmarked: boolean;
}

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult<SearchHit>>;
    /** Marks Tags with whether they are Bookmarked now, e.g. to refresh results shown before a change. */
    markBookmarked(tags: TagSummary[]): Promise<SearchHit[]>;
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
}

export function createCore({ tagSource, store, fileStore, clock }: Ports): Core {
    const folders = new Folders(store);
    const tagCache = new TagCache(store, fileStore, tagSource, clock);
    const cachedTag = (id: number) => tagCache.get(id);

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
    };
}
