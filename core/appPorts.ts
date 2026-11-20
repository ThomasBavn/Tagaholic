import AsyncStorage from "@react-native-async-storage/async-storage";

import { appFileStore } from "./appFileStore";
import type { Ports, Store, TagSource } from "./ports";

const API_URL = "https://www.barbershoptags.com/api.php";

/** How long to wait before treating a weak signal as offline, so that saved Tags still open. */
const QUERY_TIMEOUT_MS = 10_000;
const DOWNLOAD_TIMEOUT_MS = 30_000;

/** Fetches from barbershoptags.com and reads the response, giving up after the timeout. */
async function fetchFromBarbershopTags<T>(
    url: string,
    timeoutMs: number,
    readBody: (response: Response) => Promise<T>,
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`barbershoptags.com responded with ${response.status}`);
        }
        return await readBody(response);
    } finally {
        clearTimeout(timer);
    }
}

/** Calls the barbershoptags.com API directly (ADR 0001). */
const barbershopTags: TagSource = {
    query: (params) =>
        fetchFromBarbershopTags(
            `${API_URL}?${new URLSearchParams(params)}`,
            QUERY_TIMEOUT_MS,
            (response) => response.text(),
        ),

    download: (url) =>
        fetchFromBarbershopTags(url, DOWNLOAD_TIMEOUT_MS, async (response) => {
            // A Wi-Fi sign-in or error page must not replace sheet music already on the device.
            if (response.headers.get("content-type")?.includes("text/html")) {
                throw new Error(`barbershoptags.com sent a web page instead of the file at ${url}`);
            }
            return new Uint8Array(await response.arrayBuffer());
        }),
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
