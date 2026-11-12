import type { Ports } from "./ports";

export type { Clock, FileStore, Ports, Store, TagSource } from "./ports";

/**
 * Tagaholic's domain behaviour. Screens call this and render what it returns.
 * It has no operations yet; #3 adds search.
 */
export type Core = Record<string, never>;

export function createCore(ports: Ports): Core {
    return {};
}
