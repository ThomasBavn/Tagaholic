import { readFileSync } from "fs";
import { join } from "path";

import { createCore } from "@/core";
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

    it("asks barbershoptags.com for 4-part Tags as Tagaholic, requesting only summary fields", async () => {
        const ports = createTestPorts();
        ports.tagSource.respondWith(fixture("search-eyes.xml"));
        const core = createCore(ports);

        await core.search({ text: "sore eyes" });

        expect(ports.tagSource.queries).toEqual([
            {
                q: "sore eyes",
                Parts: "4",
                fldlist: "id,Title,WritKey,Parts,Rating",
                client: "Tagaholic",
            },
        ]);
    });
});
