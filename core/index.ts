import type { Ports } from "./ports";
import { parseSearchResponse, type SearchResult } from "./tagXml";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";
export type { SearchResult, TagSummary } from "./tagXml";

export interface SearchRequest {
    /** Free text, matched against titles and lyrics by barbershoptags.com. */
    text: string;
}

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult>;
}

export function createCore({ tagSource }: Ports): Core {
    return {
        async search({ text }) {
            const xml = await tagSource.query({
                q: text,
                Parts: "4",
                fldlist: "id,Title,WritKey,Parts,Rating",
                client: "Tagaholic",
            });
            return parseSearchResponse(xml);
        },
    };
}
