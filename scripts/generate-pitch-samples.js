/**
 * Generates the bundled Pitch samples in assets/audio/pitch: one reedy note per tonic,
 * like a chromatic pitch pipe, from F3 up to E4. The app plays these files and never
 * synthesises sound itself, so the Pitch button works offline.
 *
 * Each sample is a steady note that loops seamlessly, so the app can sound it for as long
 * as the Singer holds the Pitch button.
 *
 * Run with `node scripts/generate-pitch-samples.js` after changing the sound.
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets", "audio", "pitch");
/** Ample for these notes: their highest harmonic is under 2.7 kHz. */
const SAMPLE_RATE = 11025;
/**
 * The loop length. Every wave in the note completes a whole number of cycles in it, so the
 * end runs straight back into the start. It is long because expo-audio on iOS (and some
 * browsers) loop by restarting the file, with a tiny gap: most held notes never reach it.
 * A longer loop also keeps the note closer to true pitch.
 */
const LOOP_SECONDS = 10;
const VOLUME = 0.6;
/** A slight, slow vibrato keeps the tone from sounding electronic. Whole cycles per loop. */
const VIBRATO_HZ = 5;

/**
 * File names by semitone above C. "s" stands for sharp, since "#" is awkward in asset paths.
 * components/PitchButton.tsx requires these files by name, in this order: keep the two in step.
 */
const NAMES = ["C", "Cs-Db", "D", "Ds-Eb", "E", "F", "Fs-Gb", "G", "Gs-Ab", "A", "As-Bb", "B"];

/** Relative strengths of the first harmonics: bright, with a hint of a free reed's odd-harmonic buzz. */
const HARMONICS = [1, 0.55, 0.45, 0.25, 0.22, 0.12, 0.1, 0.05];

/** Pitch pipes sound in a narrow range, so F to B sit below middle C and C to E above it. */
function frequency(semitone) {
    const midi = semitone >= 5 ? 48 + semitone : 60 + semitone;
    return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * The frequency the sample actually sounds: the true note, nudged to a whole number of
 * cycles per loop so it loops seamlessly. The nudge is at most 1/20 Hz, under 1 cent.
 */
function loopedFrequency(semitone) {
    return Math.round(frequency(semitone) * LOOP_SECONDS) / LOOP_SECONDS;
}

function render(semitone) {
    const f = loopedFrequency(semitone);
    const length = LOOP_SECONDS * SAMPLE_RATE;
    const total = HARMONICS.reduce((sum, a) => sum + a, 0);
    const samples = new Int16Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const phase = 2 * Math.PI * f * t + 0.02 * Math.sin(2 * Math.PI * VIBRATO_HZ * t);
        let value = 0;
        HARMONICS.forEach((amplitude, n) => {
            value += amplitude * Math.sin((n + 1) * phase);
        });
        samples[i] = Math.round((value / total) * VOLUME * 32767);
    }
    return samples;
}

function wav(samples) {
    const header = Buffer.alloc(44);
    const dataSize = samples.length * 2;
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(SAMPLE_RATE, 24);
    header.writeUInt32LE(SAMPLE_RATE * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, Buffer.from(samples.buffer)]);
}

function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    NAMES.forEach((name, semitone) => {
        const file = path.join(OUT_DIR, `${String(semitone).padStart(2, "0")}-${name}.wav`);
        fs.writeFileSync(file, wav(render(semitone)));
        console.log(`${path.relative(process.cwd(), file)}  ${loopedFrequency(semitone).toFixed(2)} Hz`);
    });
}

if (require.main === module) main();

module.exports = { loopedFrequency, render };
