/** "Major:Gb" → "Gb major". */
export function formatKey(key: string | null): string {
    if (!key) return "No Key";
    const [tonality, tonic] = key.split(":");
    return tonic ? `${tonic} ${tonality.toLowerCase()}` : key;
}
