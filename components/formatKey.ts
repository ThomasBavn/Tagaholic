/** Display forms of a tonic's accidental, as barbershoptags.com writes it after the letter. */
const ACCIDENTALS: Record<string, { sign: string; word: string }> = {
    "#": { sign: "♯", word: " sharp" },
    b: { sign: "♭", word: " flat" },
};

/** A tonic with musical signs: "F#" → "F♯", "Gb" → "G♭". */
export function formatTonic(tonic: string): string {
    const accidental = ACCIDENTALS[tonic.slice(1)];
    return accidental ? tonic[0] + accidental.sign : tonic;
}

/** A tonic as a screen reader should say it: "F#" → "F sharp", "Gb" → "G flat". */
export function speakTonic(tonic: string): string {
    const accidental = ACCIDENTALS[tonic.slice(1)];
    return accidental ? tonic[0] + accidental.word : tonic;
}

/** "Major:Gb" → "G♭ major". */
export function formatKey(key: string | null): string {
    if (!key) return "No Key";
    const [tonality, tonic] = key.split(":");
    return tonic ? `${formatTonic(tonic)} ${tonality.toLowerCase()}` : key;
}
