import type { Ports } from "./ports";
import { searchQuery, SearchFailedError, type SearchRequest } from "./search";
import { parseSearchResponse, type SearchResult } from "./tagXml";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";
export type { SearchResult, TagSummary } from "./tagXml";
export { hasNextPage, SEARCH_PAGE_SIZE, SearchFailedError } from "./search";
export type { PartCount, SearchOrder, SearchRequest } from "./search";

/** Tagaholic's domain behaviour. Screens call this and render what it returns. */
export interface Core {
    search(request: SearchRequest): Promise<SearchResult>;
}

export function createCore({ tagSource }: Ports): Core {
    return {
        async search(request) {
            // Outside the try: a bad request is a bug in the app, not a failed search.
            const query = searchQuery(request);
            try {
                return parseSearchResponse(await tagSource.query(query));
            } catch (cause) {
                throw new SearchFailedError(cause);
            }
        },
    };
}
