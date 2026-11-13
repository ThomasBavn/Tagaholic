import {
    describeTransposition,
    formatKey,
    formatTonic,
    formatTransposition,
    speakTonic,
} from "@/components/formatKey";

describe("Showing a tonic", () => {
    it("writes sharps and flats with the musical signs", () => {
        expect(formatTonic("F#")).toBe("F♯");
        expect(formatTonic("Gb")).toBe("G♭");
    });

    it("leaves natural tonics alone, including B", () => {
        expect(formatTonic("B")).toBe("B");
        expect(formatTonic("C")).toBe("C");
    });

    it("spells the accidental as a word for screen readers", () => {
        expect(speakTonic("F#")).toBe("F sharp");
        expect(speakTonic("Bb")).toBe("B flat");
        expect(speakTonic("B")).toBe("B");
    });
});

describe("Showing a Key", () => {
    it("writes the tonic with musical signs before the tonality", () => {
        expect(formatKey("Major:Gb")).toBe("G♭ major");
        expect(formatKey("Minor:F#")).toBe("F♯ minor");
        expect(formatKey("Major:B")).toBe("B major");
    });

    it("says so when the Tag has no Key", () => {
        expect(formatKey(null)).toBe("No Key");
    });
});

describe("Showing a Transposition", () => {
    it("signs it, with a true minus sign, and shows 0 as 0", () => {
        expect(formatTransposition(2)).toBe("+2");
        expect(formatTransposition(-1)).toBe("−1");
        expect(formatTransposition(0)).toBe("0");
    });

    it("describes it in words for screen readers", () => {
        expect(describeTransposition(2)).toBe("up 2 semitones");
        expect(describeTransposition(-1)).toBe("down 1 semitone");
        expect(describeTransposition(0)).toBe("in the Tag's Key");
    });
});
