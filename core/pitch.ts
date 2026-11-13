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
