import type { Clock, FileStore, Store, TagSource } from "./ports";
import type { SheetMusic, Tag } from "./tagXml";

/** A Tag cached on the device when it was opened. */
export interface CachedTag {
    /** The Tag as barbershoptags.com last gave it, with its sheet music's barbershoptags.com URL. */
    tag: Tag;
    /** When the Singer last opened the Tag, in milliseconds since the epoch. */
    lastOpenedAt: number;
}

/** A cached Tag as it is kept in the Store. */
interface StoredTag extends CachedTag {
    /** The file store key of its cached sheet music. Missing in Tags cached before sheet music was. */
    sheetMusicFile?: string | null;
}

const storeKey = (id: number) => `tag:${id}`;

/** The Tags the Singer has opened, cached on the device with their sheet music. */
export class TagCache {
    constructor(
        private readonly store: Store,
        private readonly fileStore: FileStore,
        private readonly tagSource: TagSource,
        private readonly clock: Clock,
    ) {}

    async get(id: number): Promise<CachedTag | null> {
        const stored = await this.read(id);
        return stored && { tag: stored.tag, lastOpenedAt: stored.lastOpenedAt };
    }

    /**
     * Caches a Tag fresh from barbershoptags.com, downloading its sheet music again so that
     * changes reach the device. Returns the Tag with its sheet music shown from the device when it can be.
     */
    async refresh(tag: Tag): Promise<Tag> {
        const stored = await this.read(tag.id);
        const oldFile = stored?.sheetMusicFile ?? null;
        let file: string | null = null;

        if (tag.sheetMusic) {
            file = await this.download(tag.id, tag.sheetMusic);
            // Keep the old copy when the new one can't be had, unless it is in a different format.
            if (file === null && stored?.tag.sheetMusic?.format === tag.sheetMusic.format) {
                file = oldFile;
            }
        }
        if (oldFile !== null && oldFile !== file) {
            await this.removeFile(oldFile);
        }

        await this.write({ tag, lastOpenedAt: this.clock.now(), sheetMusicFile: file });
        return this.withCachedSheetMusic(tag, file);
    }

    /** Opens a cached Tag without barbershoptags.com, or returns null when it was never cached. */
    async reopen(id: number): Promise<Tag | null> {
        const stored = await this.read(id);
        if (!stored) return null;
        await this.write({ ...stored, lastOpenedAt: this.clock.now() });
        return this.withCachedSheetMusic(stored.tag, stored.sheetMusicFile ?? null);
    }

    private async read(id: number): Promise<StoredTag | null> {
        const json = await this.store.get(storeKey(id));
        return json === null ? null : (JSON.parse(json) as StoredTag);
    }

    private write(stored: StoredTag): Promise<void> {
        return this.store.set(storeKey(stored.tag.id), JSON.stringify(stored));
    }

    /** Caches the sheet music in a new file, and returns its key, or null if it couldn't be cached. */
    private async download(tagId: number, { url }: SheetMusic): Promise<string | null> {
        // A new name for every download, so that screens never show an older copy they cached.
        const file = `sheet-music-${tagId}-${this.clock.now()}`;
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

    private async withCachedSheetMusic(tag: Tag, file: string | null): Promise<Tag> {
        const { sheetMusic } = tag;
        if (!sheetMusic || file === null) return tag;
        const location = await this.fileStore.location(file);
        return location ? { ...tag, sheetMusic: { ...sheetMusic, url: location } } : tag;
    }
}
