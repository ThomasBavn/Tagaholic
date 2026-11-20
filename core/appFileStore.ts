import ReactNativeBlobUtil from "react-native-blob-util";

import type { FileStore } from "./ports";

const { fs } = ReactNativeBlobUtil;

/** In the app's document folder, which Android keeps until the app is uninstalled, unlike its cache. */
const DIRECTORY = `${fs.dirs.DocumentDir}/sheet-music`;

const pathOf = (key: string) => `${DIRECTORY}/${key}`;

/** Base64, the encoding react-native-blob-util writes binary files in. */
function toBase64(data: Uint8Array): string {
    let binary = "";
    // In chunks, since spreading a whole PDF into one call overflows the stack.
    for (let start = 0; start < data.length; start += 0x8000) {
        binary += String.fromCharCode(...data.subarray(start, start + 0x8000));
    }
    return btoa(binary);
}

/** Sheet music files on the device, kept with react-native-blob-util (already used by react-native-pdf). */
export const appFileStore: FileStore = {
    async write(key, data) {
        if (!(await fs.isDir(DIRECTORY))) {
            await fs.mkdir(DIRECTORY);
        }
        await fs.writeFile(pathOf(key), toBase64(data), "base64");
    },

    async location(key) {
        return (await fs.exists(pathOf(key))) ? `file://${pathOf(key)}` : null;
    },

    async remove(key) {
        if (await fs.exists(pathOf(key))) {
            await fs.unlink(pathOf(key));
        }
    },
};
