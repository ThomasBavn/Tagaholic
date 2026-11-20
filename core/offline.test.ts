import { readFileSync } from "fs";
import { join } from "path";

import { createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

const sheetMusicUrl = (id: number) =>
    `https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=${id}&fldname=SheetMusic`;

const offline = () => new TypeError("Network request failed");

const sheetMusic = (...bytes: number[]) => new Uint8Array(bytes);

/** Ports on which the Singer has opened Tag 2462 while online, with its sheet music. */
async function portsWithOpenedTag() {
    const ports = createTestPorts();
    ports.tagSource.respondWith(fixture("tag-2462.xml"));
    ports.tagSource.serveFile(sheetMusicUrl(2462), sheetMusic(1, 2, 3));
    await createCore(ports).openTag(2462);
    return ports;
}

describe("Saving sheet music on the device", () => {
    it("shows a Tag's sheet music from the device once it is opened", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-2462.xml"));
        ports.tagSource.serveFile(sheetMusicUrl(2462), sheetMusic(1, 2, 3));

        const tag = await createCore(ports).openTag(2462);

        expect(tag.sheetMusic?.format).toBe("image");
        expect(ports.fileStore.fileAt(tag.sheetMusic!.url)).toEqual(sheetMusic(1, 2, 3));
    });

    it("shows sheet music from barbershoptags.com when it can't be downloaded", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-6415.xml"));

        const tag = await createCore(ports).openTag(6415);

        expect(tag.sheetMusic).toEqual({ url: sheetMusicUrl(6415), format: "pdf" });
    });
});

describe("Opening a Tag offline", () => {
    it("opens a Tag opened before, with its details, Pitch and sheet music", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.failWith(offline());

        const tag = await createCore(ports).openTag(2462);

        expect(tag).toMatchObject({
            id: 2462,
            title: "A Million Stars",
            key: "Major:Gb",
            pitch: { tonality: "major", tonic: "Gb", semitone: 6 },
            parts: 4,
        });
        expect(tag.sheetMusic?.format).toBe("image");
        expect(ports.fileStore.fileAt(tag.sheetMusic!.url)).toEqual(sheetMusic(1, 2, 3));
    });

    it("opens a Tag that has no sheet music", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-1786.xml"));
        await createCore(ports).openTag(1786);
        ports.tagSource.failWith(offline());

        const tag = await createCore(ports).openTag(1786);

        expect(tag.title).toBe("A Lifetime's Not Too Long to Live as Friends");
        expect(tag.sheetMusic).toBeNull();
    });

    it("records when the Tag was opened", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.failWith(offline());
        ports.clock.set(Date.UTC(2026, 10, 20));

        const core = createCore(ports);
        await core.openTag(2462);

        expect((await core.cachedTag(2462))?.lastOpenedAt).toBe(Date.UTC(2026, 10, 20));
    });

    it("also opens from the device when barbershoptags.com answers with something that isn't a Tag", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.respondWith("<html>Sign in to the Wi-Fi</html>");

        const tag = await createCore(ports).openTag(2462);

        expect(tag.title).toBe("A Million Stars");
    });

    it("fails for a Tag that was never opened", async () => {
        const ports = createTestPorts();
        ports.tagSource.failWith(offline());

        await expect(createCore(ports).openTag(2462)).rejects.toThrow();
    });

    it("lists a Folder's Tags", async () => {
        const ports = await portsWithOpenedTag();
        await createCore(ports).toggleBookmark(2462);
        ports.tagSource.failWith(offline());

        const core = createCore(ports);

        expect(await core.folders()).toContainEqual(
            expect.objectContaining({ id: "bookmarks", tagCount: 1 }),
        );
        expect((await core.folderTags("bookmarks")).map((tag) => tag.title)).toEqual([
            "A Million Stars",
        ]);
    });
});

describe("Refreshing a Tag opened before", () => {
    it("picks up changed details from barbershoptags.com", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.respondWith(
            fixture("tag-2462.xml")
                .replace("A Million Stars", "A Million Stars (corrected)")
                .replace("Major:Gb", "Major:G"),
        );

        const core = createCore(ports);
        const tag = await core.openTag(2462);

        expect(tag.title).toBe("A Million Stars (corrected)");
        expect(tag.pitch?.tonic).toBe("G");
        expect((await core.cachedTag(2462))?.tag.title).toBe("A Million Stars (corrected)");
    });

    it("picks up changed sheet music, and keeps only the new copy", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.failWith(offline());
        const before = await createCore(ports).openTag(2462);
        ports.tagSource.goOnline();
        ports.clock.set(Date.UTC(2026, 10, 20));
        ports.tagSource.serveFile(sheetMusicUrl(2462), sheetMusic(4, 5, 6));

        const after = await createCore(ports).openTag(2462);

        expect(ports.fileStore.fileAt(after.sheetMusic!.url)).toEqual(sheetMusic(4, 5, 6));
        expect(ports.fileStore.fileAt(before.sheetMusic!.url)).toBeNull();
    });

    it("keeps the saved sheet music when the new copy can't be downloaded", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.stopServingFile(sheetMusicUrl(2462));

        const tag = await createCore(ports).openTag(2462);

        expect(ports.fileStore.fileAt(tag.sheetMusic!.url)).toEqual(sheetMusic(1, 2, 3));
    });

    it("removes the saved sheet music when barbershoptags.com no longer has any", async () => {
        const ports = await portsWithOpenedTag();
        ports.tagSource.failWith(offline());
        const before = await createCore(ports).openTag(2462);
        ports.tagSource.goOnline();
        ports.tagSource.respondWith(
            fixture("tag-2462.xml").replace(/<SheetMusic type.*<\/SheetMusic>/, ""),
        );

        const core = createCore(ports);
        const after = await core.openTag(2462);
        ports.tagSource.failWith(offline());

        expect(after.sheetMusic).toBeNull();
        expect(ports.fileStore.fileAt(before.sheetMusic!.url)).toBeNull();
        expect((await core.openTag(2462)).sheetMusic).toBeNull();
    });
});
