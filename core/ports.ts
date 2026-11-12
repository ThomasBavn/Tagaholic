/**
 * The core's connections to the outside world. Each one is deliberately thin,
 * so that behaviour lives in the core, where tests can reach it.
 */

/** barbershoptags.com: sends API query parameters, returns the raw XML response. */
export interface TagSource {
    query(params: Record<string, string>): Promise<string>;
}

/** On-device key-value storage for the Singer's data and cached Tag details. */
export interface Store {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}

/** On-device files, used for cached sheet music. */
export interface FileStore {
    write(key: string, data: Uint8Array): Promise<void>;
    read(key: string): Promise<Uint8Array | null>;
    remove(key: string): Promise<void>;
}

/** The current time, in milliseconds since the epoch. */
export interface Clock {
    now(): number;
}

export interface Ports {
    tagSource: TagSource;
    store: Store;
    fileStore: FileStore;
    clock: Clock;
}
