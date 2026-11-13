import { formatKey, formatTonic, speakTonic } from "@/components/formatKey";

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
