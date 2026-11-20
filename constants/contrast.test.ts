import { contrastRatio } from "@/constants/contrast";

describe("Contrast between two colours", () => {
    it("is 21:1 between black and white, either way round", () => {
        expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
        expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    });

    it("is 1:1 between a colour and itself", () => {
        expect(contrastRatio("#0a7ea4", "#0a7ea4")).toBeCloseTo(1, 5);
    });

    it("reads three-digit hex colours", () => {
        expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
    });

    it("matches the WCAG figure for a mid grey on white", () => {
        // #767676 is the classic lightest grey that passes 4.5:1 on white.
        expect(contrastRatio("#767676", "#fff")).toBeCloseTo(4.54, 2);
    });

    it("rejects anything that isn't a hex colour", () => {
        expect(() => contrastRatio("red", "#fff")).toThrow(/hex colour/);
    });
});
