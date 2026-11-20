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
/** Own Folders are numbered "folder-1", "folder-2" and so on; this holds the last number used. */
const LAST_FOLDER_NUMBER_KEY = "folders:lastNumber";

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
        return this.change((folders) => {
            const folder = find(folders, folderId);
            const had = folder.tagIds.includes(tagId);
            folder.tagIds = had
                ? folder.tagIds.filter((id) => id !== tagId)
                : [...folder.tagIds, tagId];
            return !had;
        });
    }

    /** Adds a new, empty Folder after the others. Returns its id. */
    create(name: string): Promise<string> {
        return this.change(async (folders) => {
            const trimmed = folderName(name);
            // Counted in the Store, so that a deleted Folder's id is never given out again.
            const number = Number((await this.store.get(LAST_FOLDER_NUMBER_KEY)) ?? 0) + 1;
            await this.store.set(LAST_FOLDER_NUMBER_KEY, String(number));
            const id = `folder-${number}`;
            folders.push({ id, name: trimmed, tagIds: [] });
            return id;
        });
    }

    /** Adds the Tag at the end of the Folder, unless it is already there. */
    add(folderId: string, tagId: number): Promise<void> {
        return this.change((folders) => {
            const folder = find(folders, folderId);
            if (!folder.tagIds.includes(tagId)) folder.tagIds = [...folder.tagIds, tagId];
        });
    }

    /** Takes the Tag out of the Folder, if it is there. */
    remove(folderId: string, tagId: number): Promise<void> {
        return this.change((folders) => {
            const folder = find(folders, folderId);
            folder.tagIds = folder.tagIds.filter((id) => id !== tagId);
        });
    }

    /** The ids of the Folders that hold the Tag, Bookmarks first. */
    async containing(tagId: number): Promise<string[]> {
        return (await this.all())
            .filter((folder) => folder.tagIds.includes(tagId))
            .map((folder) => folder.id);
    }

    /** Renames one of the Singer's own Folders. Bookmarks can't be renamed. */
    rename(folderId: string, name: string): Promise<void> {
        return this.change((folders) => {
            if (folderId === BOOKMARKS) throw new Error("Bookmarks can't be renamed");
            find(folders, folderId).name = folderName(name);
        });
    }

    /** Deletes one of the Singer's own Folders. Its Tags stay in any other Folders. */
    delete(folderId: string): Promise<void> {
        return this.change((folders) => {
            if (folderId === BOOKMARKS) throw new Error("Bookmarks can't be deleted");
            folders.splice(folders.indexOf(find(folders, folderId)), 1);
        });
    }

    /** Applies a change to the stored Folders and saves it, after any change under way. */
    private change<T>(apply: (folders: StoredFolder[]) => T | Promise<T>): Promise<T> {
        const change = this.changes.then(async () => {
            const folders = await this.all();
            const result = await apply(folders);
            await this.store.set(FOLDERS_KEY, JSON.stringify(folders));
            return result;
        });
        this.changes = change.catch(() => undefined);
        return change;
    }
}

function find(folders: StoredFolder[], id: string): StoredFolder {
    const folder = folders.find((candidate) => candidate.id === id);
    if (!folder) throw new Error(`There is no Folder "${id}"`);
    return folder;
}

/** A Folder name without the spaces around it. A Folder must have a name. */
function folderName(name: string): string {
    const trimmed = name.trim();
    if (trimmed === "") throw new Error("A Folder needs a name");
    return trimmed;
}
