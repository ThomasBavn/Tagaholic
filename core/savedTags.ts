import type { Clock, FileStore, Store, TagSource } from "./ports";
import type { Tag } from "./tagXml";

/** A Tag saved on the device when it was opened. */
export interface CachedTag {
    /** The Tag as barbershoptags.com last gave it, with its sheet music's barbershoptags.com URL. */
    tag: Tag;
    /** When the Singer last opened the Tag, in milliseconds since the epoch. */
    lastOpenedAt: number;
}

/** A saved Tag as it is kept in the Store. */
interface SavedTag extends CachedTag {
    /** The file store key of its saved sheet music. Missing in Tags saved before sheet music was. */
    sheetMusicFile?: string | null;
}

const storeKey = (id: number) => `tag:${id}`;

/** The Tags the Singer has opened, saved on the device with their sheet music. */
export class SavedTags {
    constructor(
        private readonly store: Store,
        private readonly fileStore: FileStore,
        private readonly tagSource: TagSource,
        private readonly clock: Clock,
    ) {}

    async get(id: number): Promise<CachedTag | null> {
        const saved = await this.read(id);
        return saved && { tag: saved.tag, lastOpenedAt: saved.lastOpenedAt };
    }

    /**
     * Saves a Tag fresh from barbershoptags.com, downloading its sheet music again so that
     * changes reach the device. Returns the Tag with its sheet music shown from the device when it can be.
     */
    async refresh(tag: Tag): Promise<Tag> {
        const saved = await this.read(tag.id);
        const oldFile = saved?.sheetMusicFile ?? null;
        let file: string | null = null;

        if (tag.sheetMusic) {
            file = await this.download(tag);
            // Keep the old copy when the new one can't be had, unless it is in a different format.
            if (file === null && saved?.tag.sheetMusic?.format === tag.sheetMusic.format) {
                file = oldFile;
            }
        }
        if (oldFile !== null && oldFile !== file) {
            await this.removeFile(oldFile);
        }

        await this.write({ tag, lastOpenedAt: this.clock.now(), sheetMusicFile: file });
        return this.withSavedSheetMusic(tag, file);
    }

    /** Opens a saved Tag without barbershoptags.com, or returns null when it was never saved. */
    async reopen(id: number): Promise<Tag | null> {
        const saved = await this.read(id);
        if (!saved) return null;
        await this.write({ ...saved, lastOpenedAt: this.clock.now() });
        return this.withSavedSheetMusic(saved.tag, saved.sheetMusicFile ?? null);
    }

    private async read(id: number): Promise<SavedTag | null> {
        const json = await this.store.get(storeKey(id));
        return json === null ? null : (JSON.parse(json) as SavedTag);
    }

    private write(saved: SavedTag): Promise<void> {
        return this.store.set(storeKey(saved.tag.id), JSON.stringify(saved));
    }

    /** Saves the Tag's sheet music in a new file, and returns its key, or null if it couldn't be saved. */
    private async download(tag: Tag): Promise<string | null> {
        const { url, format } = tag.sheetMusic!;
        // A new name for every download, so that screens never show an older copy they cached.
        const file = `sheet-music-${tag.id}-${this.clock.now()}${format === "pdf" ? ".pdf" : ""}`;
        try {
            await this.fileStore.write(file, await this.tagSource.download(url));
            return file;
        } catch {
            // Offline, or the device is full: the Tag still opens, with sheet music from barbershoptags.com.
            return null;
        }
    }

    private async removeFile(file: string): Promise<void> {
        try {
            await this.fileStore.remove(file);
        } catch {
            // A leftover file costs only space; the Tag still opens.
        }
    }

    private async withSavedSheetMusic(tag: Tag, file: string | null): Promise<Tag> {
        const location = tag.sheetMusic && file !== null ? await this.fileStore.location(file) : null;
        return location ? { ...tag, sheetMusic: { ...tag.sheetMusic!, url: location } } : tag;
    }
}
