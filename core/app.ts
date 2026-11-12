import { createCore } from "./index";
import { createAppPorts } from "./appPorts";

/** The core the app's screens use, connected to the real world. */
export const core = createCore(createAppPorts());
