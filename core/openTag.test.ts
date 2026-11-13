import { readFileSync } from "fs";
import { join } from "path";

import { createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

const sheetMusicUrl = (id: number) =>
    `https://www.barbershoptags.com/dbaction.php?action=DownloadFile&dbase=tags&id=${id}&fldname=SheetMusic`;

describe("Opening a Tag", () => {
    it("returns the Tag's details, lyrics and image sheet music", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-2462.xml"));
        const core = createCore(ports);

        const tag = await core.openTag(2462);

        expect(tag).toEqual({
            id: 2462,
            title: "A Million Stars",
            altTitle: null,
            key: "Major:Gb",
            pitch: { tonality: "major", tonic: "Gb", semitone: 6 },
            parts: 4,
            lyrics: "There's a million stars in the skies. None shine brighter than your eyes.",
            sheetMusic: { url: sheetMusicUrl(2462), format: "image" },
        });
    });

    it("returns PDF sheet music as a PDF", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-6415.xml"));
        const core = createCore(ports);

        const tag = await core.openTag(6415);

        expect(tag.sheetMusic).toEqual({ url: sheetMusicUrl(6415), format: "pdf" });
    });

    it("returns no sheet music when barbershoptags.com has none", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-1786.xml"));
        const core = createCore(ports);

        const tag = await core.openTag(1786);

        expect(tag.title).toBe("A Lifetime's Not Too Long to Live as Friends");
        expect(tag.sheetMusic).toBeNull();
    });

    it("returns the alternative title and number of parts of a 5-part Tag", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-3136.xml"));
        const core = createCore(ports);

        const tag = await core.openTag(3136);

        expect(tag.altTitle).toBe("It's a Grand Night for Singing");
        expect(tag.parts).toBe(5);
    });

    it("asks barbershoptags.com for that one Tag as Tagaholic, requesting only the fields it shows", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-2462.xml"));
        const core = createCore(ports);

        await core.openTag(2462);

        expect(ports.tagSource.queries).toEqual([
            {
                id: "2462",
                fldlist: "id,Title,AltTitle,WritKey,Parts,Lyrics,SheetMusic",
                client: "Tagaholic",
            },
        ]);
    });

    it("fails when barbershoptags.com doesn't have the Tag", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-empty.xml"));
        const core = createCore(ports);

        await expect(core.openTag(99999999)).rejects.toThrow("Tag 99999999");
    });
});

describe("Remembering opened Tags", () => {
    it("saves the Tag's details and when it was opened, for a fresh core on the same Store", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-1786.xml"));
        ports.clock.set(Date.UTC(2026, 10, 13, 9, 30));
        const opened = await createCore(ports).openTag(1786);

        const cached = await createCore(ports).cachedTag(1786);

        expect(cached).toEqual({
            tag: opened,
            lastOpenedAt: Date.UTC(2026, 10, 13, 9, 30),
        });
    });

    it("moves the last-opened time forward when the Tag is opened again", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-2462.xml"));
        const core = createCore(ports);
        ports.clock.set(Date.UTC(2026, 10, 1));
        await core.openTag(2462);

        ports.clock.set(Date.UTC(2026, 10, 13));
        await core.openTag(2462);

        expect((await core.cachedTag(2462))?.lastOpenedAt).toBe(Date.UTC(2026, 10, 13));
    });

    it("knows nothing about a Tag that has never been opened", async () => {
        const core = createCore(createTestPorts());

        expect(await core.cachedTag(2462)).toBeNull();
    });

    it("keeps each opened Tag separately", async () => {
        const ports = createTestPorts();
        const core = createCore(ports);
        ports.tagSource.respondWith(fixture("tag-2462.xml"));
        await core.openTag(2462);
        ports.tagSource.respondWith(fixture("tag-6415.xml"));
        await core.openTag(6415);

        expect((await core.cachedTag(2462))?.tag.title).toBe("A Million Stars");
        expect((await core.cachedTag(6415))?.tag.title).toBe("A Beautiful Friendship");
    });
});
