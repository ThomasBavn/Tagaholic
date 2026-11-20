import type { FileStore } from "./ports";

/**
 * The web build is only a development convenience, and react-native-blob-util is native-only.
 * It saves no files, so sheet music always comes from barbershoptags.com.
 */
export const appFileStore: FileStore = {
    write: async () => {},
    location: async () => null,
    remove: async () => {},
};
