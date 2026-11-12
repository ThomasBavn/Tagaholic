import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FileStore, Ports, Store, TagSource } from "./ports";

const API_URL = "https://www.barbershoptags.com/api.php";

/** Calls the barbershoptags.com API directly (ADR 0001). */
const barbershopTags: TagSource = {
    async query(params) {
        const response = await fetch(`${API_URL}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            throw new Error(`barbershoptags.com responded with ${response.status}`);
        }
        return response.text();
    },
};

const asyncStorage: Store = {
    get: (key) => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
    remove: (key) => AsyncStorage.removeItem(key),
};

/** Sheet music files are cached from #10 onwards; nothing uses the file store before then. */
const noFileStore: FileStore = {
    write: () => Promise.reject(new Error("The file store isn't available yet (#10)")),
    read: () => Promise.reject(new Error("The file store isn't available yet (#10)")),
    remove: () => Promise.reject(new Error("The file store isn't available yet (#10)")),
};

export function createAppPorts(): Ports {
    return {
        tagSource: barbershopTags,
        store: asyncStorage,
        fileStore: noFileStore,
        clock: { now: () => Date.now() },
    };
}
