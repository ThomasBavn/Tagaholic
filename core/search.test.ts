import { readFileSync } from "fs";
import { join } from "path";

import { createCore, SEARCH_PAGE_SIZE, SearchFailedError, type SearchRequest } from "@/core";
import { createTestPorts } from "@/core/testing";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("Searching Tags", () => {
    it("returns the matching Tags with title, Key, number of parts and rating", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        const core = createCore(ports);

        const result = await core.search({ text: "eyes" });

        expect(result.available).toBe(148);
        expect(result.tags).toEqual([
            { id: 2462, title: "A Million Stars", key: "Major:Gb", parts: 4, rating: 3.3926 },
            { id: 4044, title: "A Million Stars", key: "Major:Gb", parts: 4, rating: 3.2565 },
            { id: 2527, title: "A Sight For Sore Eyes", key: "Major:C", parts: 4, rating: 3.2788 },
        ]);
    });

    it("returns no Tags when nothing matches", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-empty.xml"));
        const core = createCore(ports);

        const result = await core.search({ text: "xyzzyqq" });

        expect(result).toEqual({ available: 0, tags: [] });
    });

    it("reads a single result with an escaped title and no Key", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-glad.xml"));
        const core = createCore(ports);

        const result = await core.search({ text: "glad you're with me" });

        expect(result.tags).toEqual([
            {
                id: 2160,
                title: "And I'm Glad You're With Me Tonight",
                key: null,
                parts: 4,
                rating: 3.244,
            },
        ]);
    });

    it("asks barbershoptags.com for the first page of 4-part Tags by rating, as Tagaholic, requesting only summary fields", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        const core = createCore(ports);

        await core.search({ text: "sore eyes" });

        expect(ports.tagSource.queries).toEqual([
            {
                q: "sore eyes",
                Parts: "4",
                Sortby: "Rating",
                n: String(SEARCH_PAGE_SIZE),
                start: "1",
                fldlist: "id,Title,WritKey,Parts,Rating",
                client: "Tagaholic",
            },
        ]);
    });
});

describe("Filtering, sorting and paging search results", () => {
    async function querySentFor(request: SearchRequest) {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        await createCore(ports).search(request);
        return ports.tagSource.queries[0];
    }

    it.each([4, 5, 6] as const)("asks for %i-part Tags", async (parts) => {
        const query = await querySentFor({ text: "eyes", parts });

        expect(query.Parts).toBe(String(parts));
    });

    it("leaves out the part count when any number of parts will do", async () => {
        const query = await querySentFor({ text: "eyes", parts: "any" });

        expect(query).not.toHaveProperty("Parts");
    });

    it("sorts by rating", async () => {
        const query = await querySentFor({ text: "eyes", sortBy: "rating" });

        expect(query.Sortby).toBe("Rating");
    });

    it("sorts by download count", async () => {
        const query = await querySentFor({ text: "eyes", sortBy: "downloads" });

        expect(query.Sortby).toBe("Downloaded");
    });

    it("asks for the page after the ones already shown", async () => {
        const second = await querySentFor({ text: "eyes", page: 2 });
        const third = await querySentFor({ text: "eyes", page: 3 });

        expect(second).toMatchObject({
            n: String(SEARCH_PAGE_SIZE),
            start: String(SEARCH_PAGE_SIZE + 1),
        });
        expect(third).toMatchObject({
            n: String(SEARCH_PAGE_SIZE),
            start: String(2 * SEARCH_PAGE_SIZE + 1),
        });
    });

    it("keeps the filter and sort order when loading the next page", async () => {
        const query = await querySentFor({
            text: "eyes",
            parts: 6,
            sortBy: "downloads",
            page: 2,
        });

        expect(query).toMatchObject({ q: "eyes", Parts: "6", Sortby: "Downloaded" });
    });
});

describe("When a search fails", () => {
    it("reports a failed search when barbershoptags.com can't be reached", async () => {
        const ports = createTestPorts();
        ports.tagSource.failWith(new TypeError("Network request failed"));
        const core = createCore(ports);

        await expect(core.search({ text: "eyes" })).rejects.toBeInstanceOf(SearchFailedError);
    });

    it("reports a failed search when barbershoptags.com answers with something that isn't a search result", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith("<html><body>Service Unavailable</body></html>");
        const core = createCore(ports);

        await expect(core.search({ text: "eyes" })).rejects.toBeInstanceOf(SearchFailedError);
    });

    it("does not treat an empty result as a failure", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-empty.xml"));
        const core = createCore(ports);

        await expect(core.search({ text: "xyzzyqq" })).resolves.toEqual({ available: 0, tags: [] });
    });
});
