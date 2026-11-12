import { createCore } from "@/core";
import { createTestPorts } from "@/core/testing";

describe("Tagaholic core", () => {
    it("can be created from its test connections", () => {
        const core = createCore(createTestPorts());

        expect(core).toBeDefined();
    });
});
