import { readFileSync } from "fs";
import { join } from "path";

import { createCore, justIntonationCents, stepTransposition, transposePitch } from "@/core";
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

describe("Transposing a Pitch", () => {
    const gFlatMajor = { tonality: "major", tonic: "Gb", semitone: 6 } as const;

    it("raises the Pitch by semitones", () => {
        expect(transposePitch(gFlatMajor, 2)).toEqual({ tonality: "major", tonic: "Ab", semitone: 8 });
    });

    it("wraps around the octave going up past B and down past C", () => {
        const bFlatMinor = { tonality: "minor", tonic: "Bb", semitone: 10 } as const;
        const dFlatMajor = { tonality: "major", tonic: "Db", semitone: 1 } as const;

        expect(transposePitch(bFlatMinor, 3)).toEqual({ tonality: "minor", tonic: "Db", semitone: 1 });
        expect(transposePitch(dFlatMajor, -2)).toEqual({ tonality: "major", tonic: "B", semitone: 11 });
        expect(transposePitch(gFlatMajor, -11)).toEqual({ tonality: "major", tonic: "G", semitone: 7 });
    });

    it("spells with sharps when the Key's tonic is sharp or natural, and flats when it is flat", () => {
        const fSharpMinor = { tonality: "minor", tonic: "F#", semitone: 6 } as const;
        const gMajor = { tonality: "major", tonic: "G", semitone: 7 } as const;

        expect(transposePitch(fSharpMinor, 2).tonic).toBe("G#");
        expect(transposePitch(fSharpMinor, 1).tonic).toBe("G");
        expect(transposePitch(gMajor, 1).tonic).toBe("G#");
        expect(transposePitch(gMajor, -1).tonic).toBe("F#");
        expect(transposePitch(gFlatMajor, -1).tonic).toBe("F");
        expect(transposePitch(gFlatMajor, -3).tonic).toBe("Eb");
        // B natural is a natural tonic, not a flat one, despite its letter.
        const bMajor = { tonality: "major", tonic: "B", semitone: 11 } as const;
        expect(transposePitch(bMajor, -1).tonic).toBe("A#");
    });

    it("leaves the Pitch as the Key spells it when moved by 0 semitones", () => {
        const cFlatMajor = { tonality: "major", tonic: "Cb", semitone: 11 } as const;

        expect(transposePitch(gFlatMajor, 0)).toEqual(gFlatMajor);
        expect(transposePitch(cFlatMajor, 0)).toEqual(cFlatMajor);
    });
});

describe("Stepping the Transposition a semitone", () => {
    it("moves one semitone up or down", () => {
        expect(stepTransposition(0, 1)).toBe(1);
        expect(stepTransposition(0, -1)).toBe(-1);
        expect(stepTransposition(-5, 1)).toBe(-4);
    });

    it("rolls over to 0 past +11 and past −11, an octave away from the Key", () => {
        expect(stepTransposition(11, 1)).toBe(0);
        expect(stepTransposition(-11, -1)).toBe(0);
    });
});

describe("Tuning a transposed Pitch in just intonation", () => {
    it("leaves the Key's own tonic at standard pitch", () => {
        expect(justIntonationCents(0)).toBe(0);
    });

    it.each([
        [7, "a pure fifth (3/2)", 1.955],
        [4, "a pure major third (5/4)", -13.686],
        [3, "a pure minor third (6/5)", 15.641],
        [10, "a pure minor seventh (9/5)", 17.596],
    ])("tunes %i semitones up as %s, that many cents off equal temperament", (semitones, _, cents) => {
        expect(justIntonationCents(semitones)).toBeCloseTo(cents, 3);
    });

    it("tunes downward Transpositions as the same pure intervals below the Key", () => {
        expect(justIntonationCents(-7)).toBeCloseTo(-1.955, 3);
        expect(justIntonationCents(-4)).toBeCloseTo(13.686, 3);
    });
});
