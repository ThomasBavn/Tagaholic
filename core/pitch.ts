/** The tonic of a Tag's Key, to sound like a pitch pipe while the Singer holds the Pitch button. */
export interface Pitch {
    tonality: "major" | "minor";
    /** The tonic as the Key spells it, e.g. "Gb" or "F#". */
    tonic: string;
    /** The tonic's note, in semitones above C (0–11). Enharmonic tonics, like F# and Gb, share one. */
    semitone: number;
}

const TONALITIES: Record<string, Pitch["tonality"]> = { Major: "major", Minor: "minor" };
const NATURALS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTALS: Record<string, number> = { "": 0, "#": 1, b: -1 };

/**
 * Reads a Key as barbershoptags.com writes it, e.g. "Major:Gb" or "Minor:F#".
 * Returns null when the Key is missing or can't be read, so the Singer is never given a wrong note.
 */
export function readPitch(key: string | null): Pitch | null {
    const match = /^(\w+):([A-G])(#|b)?$/.exec(key ?? "");
    if (!match) return null;
    const [, writtenTonality, natural, accidental = ""] = match;
    const tonality = TONALITIES[writtenTonality];
    if (!tonality) return null;

    return {
        tonality,
        tonic: natural + accidental,
        semitone: (NATURALS[natural] + ACCIDENTALS[accidental] + 12) % 12,
    };
}

/** How far the Singer can transpose a Pitch, in semitones either way: just short of an octave. */
const TRANSPOSE_LIMIT = 11;

/**
 * The Transposition moved a semitone up (step 1) or down (step -1). A step past the limit
 * rolls over to 0: an octave from the Key sounds the Key's own note again.
 */
export function stepTransposition(semitones: number, step: 1 | -1): number {
    const next = semitones + step;
    return Math.abs(next) > TRANSPOSE_LIMIT ? 0 : next;
}

/** Tonic spellings by semitone above C. */
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * The Pitch moved by a number of semitones, up when positive and down when negative.
 * The new tonic is spelled the way the Key leans: with flats when the Key's tonic is flat,
 * otherwise with sharps.
 */
export function transposePitch(pitch: Pitch, semitones: number): Pitch {
    if (semitones === 0) return pitch;
    const semitone = (((pitch.semitone + semitones) % 12) + 12) % 12;
    const spellings = pitch.tonic.endsWith("b") ? FLATS : SHARPS;
    return { ...pitch, tonic: spellings[semitone], semitone };
}
