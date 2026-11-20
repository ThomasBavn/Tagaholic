import { readFileSync } from "fs";
import { join } from "path";

import { BOOKMARKS, createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

/** A core that has opened the given Tags, as the Singer does before Bookmarking from the Tag page. */
async function coreWithOpenedTags(...ids: number[]) {
    const ports = createTestPorts();
    const core = createCore(ports);
    for (const id of ids) {
        ports.tagSource.respondWith(fixture(`tag-${id}.xml`));
        await core.openTag(id);
    }
    return { ports, core };
}

describe("Bookmarking", () => {
    it("starts with no Tag Bookmarked", async () => {
        const { core } = await coreWithOpenedTags(2462);

        expect(await core.isBookmarked(2462)).toBe(false);
    });

    it("Bookmarks a Tag that isn't Bookmarked", async () => {
        const { core } = await coreWithOpenedTags(2462);

        const bookmarked = await core.toggleBookmark(2462);

        expect(bookmarked).toBe(true);
        expect(await core.isBookmarked(2462)).toBe(true);
    });

    it("un-Bookmarks a Bookmarked Tag", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleBookmark(2462);

        const bookmarked = await core.toggleBookmark(2462);

        expect(bookmarked).toBe(false);
        expect(await core.isBookmarked(2462)).toBe(false);
    });

    it("applies quick taps in turn, so that two taps leave the Tag as it was", async () => {
        const { core } = await coreWithOpenedTags(2462);

        const results = await Promise.all([core.toggleBookmark(2462), core.toggleBookmark(2462)]);

        expect(results).toEqual([true, false]);
        expect(await core.isBookmarked(2462)).toBe(false);
    });

    it("Bookmarks a Tag that has no Sung Parts", async () => {
        // A Tag the Singer has only opened has no Sung Parts; Bookmarking doesn't need any.
        const { core } = await coreWithOpenedTags(1786);

        await core.toggleBookmark(1786);

        expect(await core.isBookmarked(1786)).toBe(true);
    });

    it("keeps Bookmarks for a fresh core on the same Store, as after restarting the app", async () => {
        const { ports, core } = await coreWithOpenedTags(2462, 6415);
        await core.toggleBookmark(2462);
        await core.toggleBookmark(6415);
        await core.toggleBookmark(2462);

        const restarted = createCore(ports);

        expect(await restarted.isBookmarked(2462)).toBe(false);
        expect(await restarted.isBookmarked(6415)).toBe(true);
    });
});

describe("The Bookmarks Folder", () => {
    it("is listed even when it holds no Tags", async () => {
        const { core } = await coreWithOpenedTags();

        expect(await core.folders()).toEqual([
            { id: BOOKMARKS, name: "Bookmarks", builtIn: true, tagCount: 0 },
        ]);
    });

    it("counts its Tags", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415, 1786);
        await core.toggleBookmark(2462);
        await core.toggleBookmark(6415);

        const [bookmarks] = await core.folders();

        expect(bookmarks.tagCount).toBe(2);
    });

    it("lists its Tags in the order they were Bookmarked, from the Tags saved on the device", async () => {
        const { ports, core } = await coreWithOpenedTags(6415, 2462);
        await core.toggleBookmark(2462);
        await core.toggleBookmark(6415);
        ports.tagSource.failWith(new Error("offline"));

        const tags = await core.folderTags(BOOKMARKS);

        expect(tags.map((tag) => [tag.id, tag.title])).toEqual([
            [2462, "A Million Stars"],
            [6415, "A Beautiful Friendship"],
        ]);
    });

    it("lists a Tag that is Bookmarked again at the end", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        await core.toggleBookmark(2462);
        await core.toggleBookmark(6415);
        await core.toggleBookmark(2462);
        await core.toggleBookmark(2462);

        const tags = await core.folderTags(BOOKMARKS);

        expect(tags.map((tag) => tag.id)).toEqual([6415, 2462]);
    });
});

describe("Bookmarked status in search results", () => {
    it("marks which results are Bookmarked", async () => {
        const { ports, core } = await coreWithOpenedTags(2462);
        await core.toggleBookmark(2462);
        ports.tagSource.respondWith(fixture("search-eyes.xml"));

        const result = await core.search({ text: "eyes" });

        expect(result.tags.map((tag) => [tag.id, tag.bookmarked])).toEqual([
            [2462, true],
            [4044, false],
            [2527, false],
        ]);
    });

    it("can refresh the status of results already shown, after the Singer changes a Bookmark", async () => {
        const { ports, core } = await coreWithOpenedTags(2462);
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        const result = await core.search({ text: "eyes" });
        await core.toggleBookmark(2462);

        const refreshed = await core.markStatus(result.tags);

        expect(refreshed.map((tag) => [tag.id, tag.bookmarked])).toEqual([
            [2462, true],
            [4044, false],
            [2527, false],
        ]);
    });
});
