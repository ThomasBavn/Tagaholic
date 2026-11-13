const { loopedFrequency, render } = require("./generate-pitch-samples");

/** Equal-tempered F3 to E4, by semitone above C (A4 = 440 Hz). */
const TRUE_HZ = [
    261.63, 277.18, 293.66, 311.13, 329.63, 174.61, 185.0, 196.0, 207.65, 220.0, 233.08, 246.94,
];

const SEMITONES = Array.from({ length: 12 }, (_, semitone) => semitone);

describe("Pitch samples", () => {
    test.each(SEMITONES)("semitone %i lasts 10 seconds before it loops, so held notes rarely reach the seam", (semitone) => {
        // The WAV header states 11025 samples per second.
        expect(render(semitone).length).toBe(10 * 11025);
    });

    test.each(SEMITONES)("semitone %i sounds within 1 cent of the true note", (semitone) => {
        const cents = 1200 * Math.log2(loopedFrequency(semitone) / TRUE_HZ[semitone]);
        expect(Math.abs(cents)).toBeLessThan(1);
    });

    test.each(SEMITONES)("semitone %i loops with no jump from its end back to its start", (semitone) => {
        const samples = render(semitone);
        let largestStep = 0;
        for (let i = 1; i < samples.length; i++) {
            largestStep = Math.max(largestStep, Math.abs(samples[i] - samples[i - 1]));
        }
        const wrapStep = Math.abs(samples[0] - samples[samples.length - 1]);
        expect(wrapStep).toBeLessThanOrEqual(largestStep);
    });

    test.each(SEMITONES)("semitone %i sounds as loud at its end as in its middle, so a held note never fades", (semitone) => {
        const samples = render(semitone);
        const peak = (from, to) => Math.max(...Array.from(samples.slice(from, to), Math.abs));
        const tenth = Math.floor(samples.length / 10);
        const middle = peak(5 * tenth, 6 * tenth);
        expect(peak(samples.length - tenth, samples.length)).toBeGreaterThan(0.95 * middle);
        expect(peak(0, tenth)).toBeGreaterThan(0.95 * middle);
    });
});
