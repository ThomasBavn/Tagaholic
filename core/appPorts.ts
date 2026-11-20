import AsyncStorage from "@react-native-async-storage/async-storage";

import { appFileStore } from "./appFileStore";
import type { Ports, Store, TagSource } from "./ports";

const API_URL = "https://www.barbershoptags.com/api.php";

/** How long to wait before treating a weak signal as offline, so that saved Tags still open. */
const QUERY_TIMEOUT_MS = 10_000;
const DOWNLOAD_TIMEOUT_MS = 30_000;

async function get(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`barbershoptags.com responded with ${response.status}`);
        }
        return response;
    } finally {
        clearTimeout(timer);
    }
}

/** Calls the barbershoptags.com API directly (ADR 0001). */
const barbershopTags: TagSource = {
    async query(params) {
        const response = await get(`${API_URL}?${new URLSearchParams(params)}`, QUERY_TIMEOUT_MS);
        return response.text();
    },

    async download(url) {
        const response = await get(url, DOWNLOAD_TIMEOUT_MS);
        return new Uint8Array(await response.arrayBuffer());
    },
};

const asyncStorage: Store = {
    get: (key) => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
    remove: (key) => AsyncStorage.removeItem(key),
};

export function createAppPorts(): Ports {
    return {
        tagSource: barbershopTags,
        store: asyncStorage,
        fileStore: appFileStore,
        clock: { now: () => Date.now() },
    };
}
