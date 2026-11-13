/**
 * Generates the bundled Pitch samples in assets/audio/pitch: one short, reedy note per
 * tonic, like a chromatic pitch pipe, from F3 up to E4. The app plays these files and
 * never synthesises sound itself, so the Pitch button works offline.
 *
 * Run with `node scripts/generate-pitch-samples.js` after changing the sound.
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets", "audio", "pitch");
const SAMPLE_RATE = 22050;
const ATTACK = 0.04;
const HOLD = 1.3;
const RELEASE = 0.2;
const VOLUME = 0.6;

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

function envelope(t) {
    if (t < ATTACK) return t / ATTACK;
    if (t < ATTACK + HOLD) return 1;
    return Math.max(0, 1 - (t - ATTACK - HOLD) / RELEASE);
}

function render(semitone) {
    const f = frequency(semitone);
    const length = Math.round((ATTACK + HOLD + RELEASE) * SAMPLE_RATE);
    const total = HARMONICS.reduce((sum, a) => sum + a, 0);
    const samples = new Int16Array(length);
    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        // A slight, slow vibrato keeps the tone from sounding electronic.
        const phase = 2 * Math.PI * f * t + 0.02 * Math.sin(2 * Math.PI * 5 * t);
        let value = 0;
        HARMONICS.forEach((amplitude, n) => {
            value += amplitude * Math.sin((n + 1) * phase);
        });
        samples[i] = Math.round((value / total) * envelope(t) * VOLUME * 32767);
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

fs.mkdirSync(OUT_DIR, { recursive: true });
NAMES.forEach((name, semitone) => {
    const file = path.join(OUT_DIR, `${String(semitone).padStart(2, "0")}-${name}.wav`);
    fs.writeFileSync(file, wav(render(semitone)));
    console.log(`${path.relative(process.cwd(), file)}  ${frequency(semitone).toFixed(2)} Hz`);
});
