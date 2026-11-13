import { readFileSync } from "fs";
import { join } from "path";

import { createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

async function openFixture(id: number, xml = fixture(`tag-${id}.xml`)) {
    const ports = createTestPorts();
    ports.tagSource.respondWith(xml);
    return createCore(ports).openTag(id);
}

/** A recorded Tag with its Key replaced, for Keys barbershoptags.com might send but no recorded Tag has. */
const withKey = (key: string) =>
    fixture("tag-2462.xml").replace("<WritKey>Major:Gb</WritKey>", `<WritKey>${key}</WritKey>`);

describe("Reading a Tag's Key as its Pitch", () => {
    it("reads a major Key with a flat tonic", async () => {
        const tag = await openFixture(2462);

        expect(tag.pitch).toEqual({ tonality: "major", tonic: "Gb", semitone: 6 });
    });

    it("reads a major Key with a natural tonic", async () => {
        const tag = await openFixture(1786);

        expect(tag.pitch).toEqual({ tonality: "major", tonic: "A", semitone: 9 });
    });

    it("reads a major Key with a sharp tonic", async () => {
        const tag = await openFixture(2997);

        expect(tag.pitch).toEqual({ tonality: "major", tonic: "C#", semitone: 1 });
    });

    it("reads a minor Key with a sharp tonic", async () => {
        const tag = await openFixture(4209);

        expect(tag.pitch).toEqual({ tonality: "minor", tonic: "F#", semitone: 6 });
    });

    it("reads a minor Key with a flat tonic", async () => {
        const tag = await openFixture(1201);

        expect(tag.pitch).toEqual({ tonality: "minor", tonic: "Bb", semitone: 10 });
    });

    it("sounds the same note for tonics spelled differently, like F# and Gb", async () => {
        const sharp = await openFixture(2462, withKey("Major:F#"));
        const flat = await openFixture(2462, withKey("Major:Gb"));

        expect(sharp.pitch?.semitone).toBe(flat.pitch?.semitone);
    });

    it("wraps tonics around the octave, so Cb sounds as B and B# as C", async () => {
        const cFlat = await openFixture(2462, withKey("Major:Cb"));
        const bSharp = await openFixture(2462, withKey("Major:B#"));

        expect(cFlat.pitch?.semitone).toBe(11);
        expect(bSharp.pitch?.semitone).toBe(0);
    });

    it("has no Pitch when the Tag has no Key", async () => {
        const tag = await openFixture(2915);

        expect(tag.key).toBeNull();
        expect(tag.pitch).toBeNull();
    });

    it.each([
        "Major",
        "Gb",
        "Major:",
        ":Gb",
        "Dorian:D",
        "Major:H",
        "Major:Gbb",
        "Major:gb",
        "Major:Gb:extra",
    ])("has no Pitch when the Key is unreadable: %p", async (key) => {
        const tag = await openFixture(2462, withKey(key));

        expect(tag.pitch).toBeNull();
    });

    it("keeps the Pitch in the saved copy of the Tag", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("tag-4209.xml"));
        await createCore(ports).openTag(4209);

        const cached = await createCore(ports).cachedTag(4209);

        expect(cached?.tag.pitch).toEqual({ tonality: "minor", tonic: "F#", semitone: 6 });
    });
});
