import type { Ports } from "./ports";
import { searchQuery, SearchFailedError, type PartCount, type SearchOrder } from "./search";
import { parseSearchResponse, type SearchResult } from "./tagXml";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";
export type { SearchResult, TagSummary } from "./tagXml";
export { SEARCH_PAGE_SIZE, SearchFailedError } from "./search";
export type { PartCount, SearchOrder } from "./search";

export interface SearchRequest {
    /** Free text, matched against titles and lyrics by barbershoptags.com. */
    text: string;
    /** Only Tags with this many Parts. Defaults to 4. */
    parts?: PartCount;
    /** Defaults to "rating". */
    sortBy?: SearchOrder;
    /** Which page of results, starting at 1. Defaults to 1. */
    page?: number;
}

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult>;
}

export function createCore({ tagSource }: Ports): Core {
    return {
        async search(request) {
            try {
                return parseSearchResponse(await tagSource.query(searchQuery(request)));
            } catch (cause) {
                throw new SearchFailedError(cause);
            }
        },
    };
}
