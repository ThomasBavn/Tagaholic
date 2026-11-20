/**
 * The core's connections to the outside world. Each one is deliberately thin,
 * so that behaviour lives in the core, where tests can reach it.
 */

/** barbershoptags.com: answers API queries with raw XML, and serves the files Tags link to. */
export interface TagSource {
    query(params: Record<string, string>): Promise<string>;
    /** Downloads a file barbershoptags.com links to, such as a Tag's sheet music. */
    download(url: string): Promise<Uint8Array>;
}

/** On-device key-value storage for the Singer's data and cached Tag details. */
export interface Store {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
}

/** On-device files, used for cached sheet music. Keys are plain file names. */
export interface FileStore {
    write(key: string, data: Uint8Array): Promise<void>;
    /** Where a screen can show the file from, such as a file:// URI, or null when there is no such file. */
    location(key: string): Promise<string | null>;
    /** Removes the file, if there is one. */
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
