import type { Store } from "./ports";

/** One voice in a Tag, named as the Tag page shows it, e.g. "Lead" or "5th Part". */
export type Part = string;

const STANDARD_PARTS: Part[] = ["Tenor", "Lead", "Baritone", "Bass"];

function ordinal(n: number): string {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
    const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
    return `${n}${suffix}`;
}

const numberedPart = (n: number): Part => `${ordinal(n)} Part`;

/**
 * The Parts of a Tag with this many parts: Tenor, Lead, Baritone and Bass, then a 5th Part,
 * 6th Part and so on. A Tag with fewer than 4 parts has a 1st, 2nd and 3rd Part instead.
 */
export function partsOf(partCount: number): Part[] {
    const count = Number.isInteger(partCount) && partCount > 0 ? partCount : 0;
    if (count < STANDARD_PARTS.length) {
        return Array.from({ length: count }, (_, index) => numberedPart(index + 1));
    }
    return [
        ...STANDARD_PARTS,
        ...Array.from({ length: count - STANDARD_PARTS.length }, (_, index) =>
            numberedPart(STANDARD_PARTS.length + index + 1),
        ),
    ];
}

/** One Tag's Sung Parts as kept on the device. */
interface StoredSungParts {
    tagId: number;
    /** In Part order, never empty: a Tag with no Sung Parts isn't kept. */
    parts: Part[];
}

const SUNG_PARTS_KEY = "sungParts";

/**
 * The Singer's Sung Parts, kept in the Store in the order the Tags joined the Repertoire.
 * The Repertoire is derived from them: every Tag with at least one Sung Part.
 */
export class SungParts {
    /** Changes wait for the one before, so that quick taps can't overwrite each other. */
    private changes: Promise<unknown> = Promise.resolve();

    constructor(private readonly store: Store) {}

    async all(): Promise<StoredSungParts[]> {
        const json = await this.store.get(SUNG_PARTS_KEY);
        return json === null ? [] : (JSON.parse(json) as StoredSungParts[]);
    }

    async of(tagId: number): Promise<Part[]> {
        return (await this.all()).find((entry) => entry.tagId === tagId)?.parts ?? [];
    }

    /**
     * Marks the Part as sung on the Tag, or clears it. `tagParts` are all the Tag's Parts,
     * which the Part must be one of. Returns the Tag's Sung Parts afterwards.
     */
    toggle(tagId: number, part: Part, tagParts: Part[]): Promise<Part[]> {
        const change = this.changes.then(() => this.applyToggle(tagId, part, tagParts));
        this.changes = change.catch(() => undefined);
        return change;
    }

    private async applyToggle(tagId: number, part: Part, tagParts: Part[]): Promise<Part[]> {
        if (!tagParts.includes(part)) {
            throw new Error(`Tag ${tagId} has no ${part}; its Parts are ${tagParts.join(", ")}`);
        }
        const all = await this.all();
        const sung = all.find((entry) => entry.tagId === tagId)?.parts ?? [];
        const toggled = sung.includes(part)
            ? sung.filter((candidate) => candidate !== part)
            : tagParts.filter((candidate) => candidate === part || sung.includes(candidate));

        const joined = all.some((entry) => entry.tagId === tagId);
        const updated =
            toggled.length === 0
                ? all.filter((entry) => entry.tagId !== tagId)
                : joined
                  ? all.map((entry) => (entry.tagId === tagId ? { tagId, parts: toggled } : entry))
                  : [...all, { tagId, parts: toggled }];
        await this.store.set(SUNG_PARTS_KEY, JSON.stringify(updated));
        return toggled;
    }
}
