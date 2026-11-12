import type { Clock, FileStore, Ports, Store, TagSource } from "./ports";

/** A Tag source for tests. It never touches the network. */
export class TestTagSource implements TagSource {
    async query(): Promise<string> {
        throw new Error("TestTagSource has no responses configured");
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

export class InMemoryFileStore implements FileStore {
    private readonly files = new Map<string, Uint8Array>();

    async write(key: string, data: Uint8Array): Promise<void> {
        this.files.set(key, data);
    }

    async read(key: string): Promise<Uint8Array | null> {
        return this.files.get(key) ?? null;
    }

    async remove(key: string): Promise<void> {
        this.files.delete(key);
    }
}

/** A clock that stands still unless a test moves it. */
export class TestClock implements Clock {
    constructor(private readonly time = Date.UTC(2026, 0, 1)) {}

    now(): number {
        return this.time;
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
