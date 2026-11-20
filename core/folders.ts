import type { Store } from "./ports";

/** The id of the built-in Bookmarks Folder. */
export const BOOKMARKS = "bookmarks";

/** A Folder as the Folders tab lists it. */
export interface FolderSummary {
    id: string;
    name: string;
    /** True for Bookmarks, which can't be renamed or deleted. */
    builtIn: boolean;
    tagCount: number;
}

/** A Folder as it is kept on the device. */
interface StoredFolder {
    id: string;
    name: string;
    /** In the order the Tags were added. */
    tagIds: number[];
}

const FOLDERS_KEY = "folders";

const emptyBookmarks = (): StoredFolder => ({ id: BOOKMARKS, name: "Bookmarks", tagIds: [] });

/** The Singer's Folders, kept in the Store. Bookmarks always comes first. */
export class Folders {
    /** Changes wait for the one before, so that quick taps can't overwrite each other. */
    private changes: Promise<unknown> = Promise.resolve();

    constructor(private readonly store: Store) {}

    async all(): Promise<StoredFolder[]> {
        const json = await this.store.get(FOLDERS_KEY);
        const stored = json === null ? [] : (JSON.parse(json) as StoredFolder[]);
        const bookmarks = stored.find((folder) => folder.id === BOOKMARKS) ?? emptyBookmarks();
        return [bookmarks, ...stored.filter((folder) => folder.id !== BOOKMARKS)];
    }

    async get(id: string): Promise<StoredFolder | null> {
        return (await this.all()).find((folder) => folder.id === id) ?? null;
    }

    async summaries(): Promise<FolderSummary[]> {
        return (await this.all()).map(({ id, name, tagIds }) => ({
            id,
            name,
            builtIn: id === BOOKMARKS,
            tagCount: tagIds.length,
        }));
    }

    async contains(folderId: string, tagId: number): Promise<boolean> {
        return (await this.get(folderId))?.tagIds.includes(tagId) ?? false;
    }

    /** Adds the Tag at the end of the Folder, or removes it. Returns whether it is now in the Folder. */
    toggle(folderId: string, tagId: number): Promise<boolean> {
        const change = this.changes.then(() => this.applyToggle(folderId, tagId));
        this.changes = change.catch(() => undefined);
        return change;
    }

    private async applyToggle(folderId: string, tagId: number): Promise<boolean> {
        const folders = await this.all();
        const folder = folders.find((candidate) => candidate.id === folderId);
        if (!folder) throw new Error(`There is no Folder "${folderId}"`);
        const had = folder.tagIds.includes(tagId);
        folder.tagIds = had
            ? folder.tagIds.filter((id) => id !== tagId)
            : [...folder.tagIds, tagId];
        await this.store.set(FOLDERS_KEY, JSON.stringify(folders));
        return !had;
    }
}
