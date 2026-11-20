import type { Clock, FileStore, Ports, Store, TagSource } from "./ports";

/** A Tag source for tests. It never touches the network: it serves a canned XML response and canned files. */
export class TestTagSource implements TagSource {
    readonly queries: Record<string, string>[] = [];
    private response: string | null = null;
    private failure: Error | null = null;
    private readonly files = new Map<string, Uint8Array>();

    respondWith(xml: string): void {
        this.response = xml;
    }

    /** Serves a file, such as sheet music, at a URL. */
    serveFile(url: string, data: Uint8Array): void {
        this.files.set(url, data);
    }

    /** Makes downloads from the URL fail, while queries still work. */
    stopServingFile(url: string): void {
        this.files.delete(url);
    }

    /** Makes every query and download fail, as when the phone is offline or barbershoptags.com is down. */
    failWith(error: Error): void {
        this.failure = error;
    }

    /** Undoes `failWith`. */
    goOnline(): void {
        this.failure = null;
    }

    async query(params: Record<string, string>): Promise<string> {
        this.queries.push(params);
        if (this.failure !== null) {
            throw this.failure;
        }
        if (this.response === null) {
            throw new Error("TestTagSource has no response configured");
        }
        return this.response;
    }

    async download(url: string): Promise<Uint8Array> {
        if (this.failure !== null) {
            throw this.failure;
        }
        const file = this.files.get(url);
        if (!file) {
            throw new Error(`TestTagSource serves no file at ${url}`);
        }
        return file;
    }
}

export class InMemoryStore implements Store {
    private readonly data = new Map<string, string>();

    async get(key: string): Promise<string | null> {
        return this.data.get(key) ?? null;
    }

    async set(key: string, value: string): Promise<void> {
        this.data.set(key, value);
    }

    async remove(key: string): Promise<void> {
        this.data.delete(key);
    }
}

const MEMORY_LOCATION = "memory://";

export class InMemoryFileStore implements FileStore {
    private readonly files = new Map<string, Uint8Array>();

    async write(key: string, data: Uint8Array): Promise<void> {
        this.files.set(key, data);
    }

    async location(key: string): Promise<string | null> {
        return this.files.has(key) ? MEMORY_LOCATION + key : null;
    }

    /** What a screen would show from a location the file store gave out, or null if the file is gone. */
    fileAt(location: string): Uint8Array | null {
        if (!location.startsWith(MEMORY_LOCATION)) return null;
        return this.files.get(location.slice(MEMORY_LOCATION.length)) ?? null;
    }

    async remove(key: string): Promise<void> {
        this.files.delete(key);
    }
}

/** A clock that stands still unless a test moves it. */
export class TestClock implements Clock {
    constructor(private time = Date.UTC(2026, 0, 1)) {}

    now(): number {
        return this.time;
    }

    set(time: number): void {
        this.time = time;
    }
}

export interface TestPorts extends Ports {
    tagSource: TestTagSource;
    store: InMemoryStore;
    fileStore: InMemoryFileStore;
    clock: TestClock;
}

export function createTestPorts(): TestPorts {
    return {
        tagSource: new TestTagSource(),
        store: new InMemoryStore(),
        fileStore: new InMemoryFileStore(),
        clock: new TestClock(),
    };
}
