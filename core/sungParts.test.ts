import { readFileSync } from "fs";
import { join } from "path";

import { createCore, partsOf } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

/** A core that has opened the given Tags, as the Singer does before marking Sung Parts on the Tag page. */
async function coreWithOpenedTags(...ids: number[]) {
    const ports = createTestPorts();
    const core = createCore(ports);
    for (const id of ids) {
        ports.tagSource.respondWith(fixture(`tag-${id}.xml`));
        await core.openTag(id);
    }
    return { ports, core };
}

describe("Parts", () => {
    it("are Tenor, Lead, Baritone and Bass for a 4-part Tag", () => {
        expect(partsOf(4)).toEqual(["Tenor", "Lead", "Baritone", "Bass"]);
    });

    it("add a 5th Part after Bass for a 5-part Tag", () => {
        expect(partsOf(5)).toEqual(["Tenor", "Lead", "Baritone", "Bass", "5th Part"]);
    });

    it("add a 5th and 6th Part after Bass for a 6-part Tag", () => {
        expect(partsOf(6)).toEqual([
            "Tenor",
            "Lead",
            "Baritone",
            "Bass",
            "5th Part",
            "6th Part",
        ]);
    });

    it("keep numbering the extra Parts of larger Tags", () => {
        expect(partsOf(12).slice(4)).toEqual([
            "5th Part",
            "6th Part",
            "7th Part",
            "8th Part",
            "9th Part",
            "10th Part",
            "11th Part",
            "12th Part",
        ]);
    });

    it("are a 1st, 2nd and 3rd Part for a 3-part Tag", () => {
        expect(partsOf(3)).toEqual(["1st Part", "2nd Part", "3rd Part"]);
    });

    it("follow from the number of parts of an opened Tag", async () => {
        const { core } = await coreWithOpenedTags(3716, 2462, 3136, 1540);

        const partCounts = await Promise.all(
            [3716, 2462, 3136, 1540].map(async (id) => (await core.cachedTag(id))!.tag.parts),
        );

        expect(partCounts.map((count) => partsOf(count).length)).toEqual([3, 4, 5, 6]);
    });
});

describe("Sung Parts", () => {
    it("start empty on a Tag the Singer has opened", async () => {
        const { core } = await coreWithOpenedTags(2462);

        expect(await core.sungParts(2462)).toEqual([]);
    });

    it("can be marked, and return the Tag's Sung Parts", async () => {
        const { core } = await coreWithOpenedTags(2462);

        const sung = await core.toggleSungPart(2462, "Lead");

        expect(sung).toEqual(["Lead"]);
        expect(await core.sungParts(2462)).toEqual(["Lead"]);
    });

    it("can be several on one Tag, listed in Part order", async () => {
        const { core } = await coreWithOpenedTags(2462);

        await core.toggleSungPart(2462, "Bass");
        await core.toggleSungPart(2462, "Lead");
        const sung = await core.toggleSungPart(2462, "Baritone");

        expect(sung).toEqual(["Lead", "Baritone", "Bass"]);
    });

    it("can be cleared again", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(2462, "Bass");

        const sung = await core.toggleSungPart(2462, "Lead");

        expect(sung).toEqual(["Bass"]);
    });

    it("include the extra Parts of a 6-part Tag", async () => {
        const { core } = await coreWithOpenedTags(1540);

        await core.toggleSungPart(1540, "6th Part");

        expect(await core.sungParts(1540)).toEqual(["6th Part"]);
    });

    it("use the numbered Parts of a 3-part Tag", async () => {
        const { core } = await coreWithOpenedTags(3716);

        await core.toggleSungPart(3716, "2nd Part");

        expect(await core.sungParts(3716)).toEqual(["2nd Part"]);
    });

    it("can't be a Part the Tag doesn't have", async () => {
        const { core } = await coreWithOpenedTags(3716, 2462);

        await expect(core.toggleSungPart(3716, "Lead")).rejects.toThrow();
        await expect(core.toggleSungPart(2462, "5th Part")).rejects.toThrow();
        expect(await core.sungParts(3716)).toEqual([]);
        expect(await core.sungParts(2462)).toEqual([]);
    });

    it("can't be marked on a Tag the Singer hasn't opened", async () => {
        const { core } = await coreWithOpenedTags();

        await expect(core.toggleSungPart(2462, "Lead")).rejects.toThrow();
    });

    it("are kept apart per Tag", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);

        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(6415, "Bass");

        expect(await core.sungParts(2462)).toEqual(["Lead"]);
        expect(await core.sungParts(6415)).toEqual(["Bass"]);
    });

    it("apply quick taps in turn, so that none is lost", async () => {
        const { core } = await coreWithOpenedTags(2462);

        await Promise.all([
            core.toggleSungPart(2462, "Tenor"),
            core.toggleSungPart(2462, "Bass"),
            core.toggleSungPart(2462, "Tenor"),
        ]);

        expect(await core.sungParts(2462)).toEqual(["Bass"]);
    });

    it("are kept for a fresh core on the same Store, as after restarting the app", async () => {
        const { ports, core } = await coreWithOpenedTags(2462, 3716);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(2462, "Bass");
        await core.toggleSungPart(3716, "1st Part");
        await core.toggleSungPart(2462, "Lead");

        const restarted = createCore(ports);

        expect(await restarted.sungParts(2462)).toEqual(["Bass"]);
        expect(await restarted.sungParts(3716)).toEqual(["1st Part"]);
        expect((await restarted.repertoire()).map((entry) => entry.tag.id)).toEqual([2462, 3716]);
    });
});

describe("The Repertoire", () => {
    it("starts empty", async () => {
        const { core } = await coreWithOpenedTags(2462);

        expect(await core.repertoire()).toEqual([]);
    });

    it("holds a Tag as soon as its first Sung Part is marked, with its Sung Parts", async () => {
        const { core } = await coreWithOpenedTags(2462);

        await core.toggleSungPart(2462, "Baritone");

        const repertoire = await core.repertoire();
        expect(repertoire.map(({ tag, sungParts }) => [tag.id, tag.title, sungParts])).toEqual([
            [2462, "A Million Stars", ["Baritone"]],
        ]);
    });

    it("shows a Tag's latest Sung Parts", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleSungPart(2462, "Baritone");

        await core.toggleSungPart(2462, "Tenor");

        const [entry] = await core.repertoire();
        expect(entry.sungParts).toEqual(["Tenor", "Baritone"]);
    });

    it("keeps a Tag while it has a Sung Part left", async () => {
        const { core } = await coreWithOpenedTags(2462);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(2462, "Bass");

        await core.toggleSungPart(2462, "Lead");

        expect((await core.repertoire()).map((entry) => entry.tag.id)).toEqual([2462]);
    });

    it("loses a Tag when its last Sung Part is cleared", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(6415, "Lead");

        await core.toggleSungPart(2462, "Lead");

        expect((await core.repertoire()).map((entry) => entry.tag.id)).toEqual([6415]);
    });

    it("lists Tags in the order they joined it, from the Tags saved on the device", async () => {
        const { ports, core } = await coreWithOpenedTags(6415, 2462, 3716);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(3716, "3rd Part");
        await core.toggleSungPart(6415, "Tenor");
        ports.tagSource.failWith(new Error("offline"));

        const repertoire = await core.repertoire();

        expect(repertoire.map((entry) => entry.tag.id)).toEqual([2462, 3716, 6415]);
    });

    it("can be filtered by Part", async () => {
        const { core } = await coreWithOpenedTags(2462, 6415, 1540);
        await core.toggleSungPart(2462, "Lead");
        await core.toggleSungPart(2462, "Bass");
        await core.toggleSungPart(6415, "Tenor");
        await core.toggleSungPart(1540, "Bass");
        await core.toggleSungPart(1540, "5th Part");

        const bass = await core.repertoire("Bass");
        const fifth = await core.repertoire("5th Part");

        expect(bass.map(({ tag, sungParts }) => [tag.id, sungParts])).toEqual([
            [2462, ["Lead", "Bass"]],
            [1540, ["Bass", "5th Part"]],
        ]);
        expect(fifth.map((entry) => entry.tag.id)).toEqual([1540]);
        expect(await core.repertoire("Baritone")).toEqual([]);
    });
});

describe("Repertoire status in search results", () => {
    it("marks which results are in the Repertoire", async () => {
        const { ports, core } = await coreWithOpenedTags(2462);
        await core.toggleSungPart(2462, "Lead");
        ports.tagSource.respondWith(fixture("search-eyes.xml"));

        const result = await core.search({ text: "eyes" });

        expect(result.tags.map((tag) => [tag.id, tag.inRepertoire, tag.bookmarked])).toEqual([
            [2462, true, false],
            [4044, false, false],
            [2527, false, false],
        ]);
    });

    it("can refresh the status of results already shown, after the Singer changes a Sung Part", async () => {
        const { ports, core } = await coreWithOpenedTags(2462);
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        const result = await core.search({ text: "eyes" });
        await core.toggleSungPart(2462, "Tenor");

        const refreshed = await core.markStatus(result.tags);

        expect(refreshed.map((tag) => [tag.id, tag.inRepertoire])).toEqual([
            [2462, true],
            [4044, false],
            [2527, false],
        ]);
    });
});
