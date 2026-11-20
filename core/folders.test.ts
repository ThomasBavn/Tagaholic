import { readFileSync } from "fs";
import { join } from "path";

import { BOOKMARKS, createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

/** A core that has opened the given Tags, as the Singer does before filing them. */
async function coreWithOpenedTags(...ids: number[]) {
    const ports = createTestPorts();
    const core = createCore(ports);
    for (const id of ids) {
        ports.tagSource.respondWith(fixture(`tag-${id}.xml`));
        await core.openTag(id);
    }
    return { ports, core };
}

describe("The Singer's own Folders", () => {
    it("are listed after Bookmarks, in the order they were created", async () => {
        const { core } = await coreWithOpenedTags();

        await core.createFolder("Chorus retreat 2026");
        await core.createFolder("Afterglow");

        const listed = await core.folders();

        expect(listed.map((folder) => [folder.name, folder.builtIn, folder.tagCount])).toEqual([
            ["Bookmarks", true, 0],
            ["Chorus retreat 2026", false, 0],
            ["Afterglow", false, 0],
        ]);
    });

    it("are named without the spaces around what the Singer typed", async () => {
        const { core } = await coreWithOpenedTags();

        await core.createFolder("  Afterglow ");

        expect((await core.folders()).map((folder) => folder.name)).toEqual([
            "Bookmarks",
            "Afterglow",
        ]);
    });

    it("must have a name", async () => {
        const { core } = await coreWithOpenedTags();

        await expect(core.createFolder("   ")).rejects.toThrow("A Folder needs a name");
        expect(await core.folders()).toHaveLength(1);
    });
});

describe("Adding a Tag to Folders", () => {
    it("files it in each chosen Folder, after the Tags already there", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreat 2026");
        const afterglow = await core.createFolder("Afterglow");
        await core.addToFolder(retreat, 6415);

        await core.addToFolder(retreat, 2462);
        await core.addToFolder(afterglow, 2462);

        expect((await core.folderTags(retreat)).map((tag) => tag.id)).toEqual([6415, 2462]);
        expect((await core.folderTags(afterglow)).map((tag) => tag.id)).toEqual([2462]);
        expect(await core.foldersContaining(2462)).toEqual([retreat, afterglow]);
    });

    it("leaves a Folder as it was when the Tag is already in it", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreat 2026");
        await core.addToFolder(retreat, 2462);
        await core.addToFolder(retreat, 6415);

        await core.addToFolder(retreat, 2462);

        expect((await core.folderTags(retreat)).map((tag) => tag.id)).toEqual([2462, 6415]);
    });

    it("can go into a Folder created on the spot", async () => {
        const { core } = await coreWithOpenedTags(2462);

        const created = await core.createFolder("Afterglow");
        await core.addToFolder(created, 2462);

        expect(await core.folders()).toContainEqual({
            id: created,
            name: "Afterglow",
            builtIn: false,
            tagCount: 1,
        });
    });

    it("counts Bookmarks among the Folders that hold the Tag", async () => {
        const { core } = await coreWithOpenedTags(2462);
        const afterglow = await core.createFolder("Afterglow");
        await core.addToFolder(afterglow, 2462);
        await core.toggleBookmark(2462);

        expect(await core.foldersContaining(2462)).toEqual([BOOKMARKS, afterglow]);
        expect(await core.foldersContaining(6415)).toEqual([]);
    });
});

describe("Removing a Tag from a Folder", () => {
    it("takes it out of that Folder only", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreat 2026");
        const afterglow = await core.createFolder("Afterglow");
        await core.addToFolder(retreat, 2462);
        await core.addToFolder(retreat, 6415);
        await core.addToFolder(afterglow, 2462);

        await core.removeFromFolder(retreat, 2462);

        expect((await core.folderTags(retreat)).map((tag) => tag.id)).toEqual([6415]);
        expect((await core.folderTags(afterglow)).map((tag) => tag.id)).toEqual([2462]);
    });

    it("works for Bookmarks too", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleBookmark(2462);

        await core.removeFromFolder(BOOKMARKS, 2462);

        expect(await core.isBookmarked(2462)).toBe(false);
    });
});

describe("Deleting a Folder", () => {
    it("removes only that grouping, leaving the Tags in Bookmarks and other Folders", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreat 2026");
        const afterglow = await core.createFolder("Afterglow");
        await core.addToFolder(retreat, 2462);
        await core.addToFolder(retreat, 6415);
        await core.addToFolder(afterglow, 2462);
        await core.toggleBookmark(2462);

        await core.deleteFolder(retreat);

        expect((await core.folders()).map((folder) => [folder.name, folder.tagCount])).toEqual([
            ["Bookmarks", 1],
            ["Afterglow", 1],
        ]);
        expect(await core.foldersContaining(2462)).toEqual([BOOKMARKS, afterglow]);
        expect((await core.folderTags(afterglow)).map((tag) => tag.title)).toEqual([
            "A Million Stars",
        ]);
        expect(await core.cachedTag(6415)).not.toBeNull();
    });

    it("isn't possible for Bookmarks", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleBookmark(2462);

        await expect(core.deleteFolder(BOOKMARKS)).rejects.toThrow("Bookmarks can't be deleted");
        expect(await core.isBookmarked(2462)).toBe(true);
    });
});

describe("Folders on the device", () => {
    it("are kept for a fresh core on the same Store, as after restarting the app", async () => {
        const { ports, core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreet");
        const afterglow = await core.createFolder("Afterglow");
        const old = await core.createFolder("Old quartet");
        await core.addToFolder(retreat, 2462);
        await core.addToFolder(retreat, 6415);
        await core.addToFolder(afterglow, 6415);
        await core.removeFromFolder(retreat, 2462);
        await core.renameFolder(retreat, "Chorus retreat 2026");
        await core.deleteFolder(old);

        const restarted = createCore(ports);

        expect(await restarted.folders()).toEqual([
            { id: BOOKMARKS, name: "Bookmarks", builtIn: true, tagCount: 0 },
            { id: retreat, name: "Chorus retreat 2026", builtIn: false, tagCount: 1 },
            { id: afterglow, name: "Afterglow", builtIn: false, tagCount: 1 },
        ]);
        expect(await restarted.foldersContaining(6415)).toEqual([retreat, afterglow]);
    });

    it("take quick changes in turn, so that none is lost", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        const retreat = await core.createFolder("Chorus retreat 2026");

        const [afterglow] = await Promise.all([
            core.createFolder("Afterglow"),
            core.addToFolder(retreat, 2462),
            core.addToFolder(retreat, 6415),
            core.toggleBookmark(2462),
        ]);

        expect((await core.folders()).map((folder) => [folder.id, folder.tagCount])).toEqual([
            [BOOKMARKS, 1],
            [retreat, 2],
            [afterglow, 0],
        ]);
    });
});

describe("Renaming a Folder", () => {
    it("changes its name and keeps its place and Tags", async () => {
        const { core } = await coreWithOpenedTags(2462);
        const retreat = await core.createFolder("Chorus retreet");
        await core.createFolder("Afterglow");
        await core.addToFolder(retreat, 2462);

        await core.renameFolder(retreat, " Chorus retreat 2026 ");

        expect((await core.folders()).map((folder) => [folder.name, folder.tagCount])).toEqual([
            ["Bookmarks", 0],
            ["Chorus retreat 2026", 1],
            ["Afterglow", 0],
        ]);
    });

    it("needs a name", async () => {
        const { core } = await coreWithOpenedTags();
        const retreat = await core.createFolder("Chorus retreat");

        await expect(core.renameFolder(retreat, "")).rejects.toThrow("A Folder needs a name");
        expect((await core.folders())[1].name).toBe("Chorus retreat");
    });

    it("isn't possible for Bookmarks", async () => {
        const { core } = await coreWithOpenedTags();

        await expect(core.renameFolder(BOOKMARKS, "Favourites")).rejects.toThrow(
            "Bookmarks can't be renamed",
        );
        expect((await core.folders())[0].name).toBe("Bookmarks");
    });
});
