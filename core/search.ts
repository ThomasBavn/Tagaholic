import type { SearchResult } from "./tagXml";

/** How many Tags one page of search results holds. */
export const SEARCH_PAGE_SIZE = 20;

/** The part-count filter: a number of Parts, or any. */
export type PartCount = 4 | 5 | 6 | "any";

export type SearchOrder = "rating" | "downloads";

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

const SORTBY: Record<SearchOrder, string> = {
    rating: "Rating",
    downloads: "Downloaded",
};

/**
 * A search couldn't be done: the phone is offline, barbershoptags.com is down,
 * or it answered with something that isn't a search result.
 * This is different from a search that finds nothing.
 */
export class SearchFailedError extends Error {
    constructor(cause: unknown) {
        super("Searching barbershoptags.com failed", { cause });
        this.name = "SearchFailedError";
    }
}

/** The barbershoptags.com API parameters for a search request. */
export function searchQuery({
    text,
    parts = 4,
    sortBy = "rating",
    page = 1,
}: SearchRequest): Record<string, string> {
    if (!Number.isInteger(page) || page < 1) {
        throw new RangeError(`Search pages start at 1, got ${page}`);
    }
    return {
        q: text,
        ...(parts === "any" ? {} : { Parts: String(parts) }),
        Sortby: SORTBY[sortBy],
        n: String(SEARCH_PAGE_SIZE),
        start: String((page - 1) * SEARCH_PAGE_SIZE + 1),
        fldlist: "id,Title,WritKey,Parts,Rating",
        client: "Tagaholic",
    };
}

/**
 * Whether there is a page after `page`. Counts pages rather than Tags shown, so that
 * a Tag repeated across pages (ties in the sort order) can't make paging run on forever.
 */
export function hasNextPage(page: number, result: SearchResult): boolean {
    return result.tags.length > 0 && page * SEARCH_PAGE_SIZE < result.available;
}
