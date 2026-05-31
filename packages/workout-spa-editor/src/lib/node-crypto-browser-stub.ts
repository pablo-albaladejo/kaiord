/**
 * Browser stub for Node's `crypto` builtin.
 *
 * `@kaiord/core`'s built `dist/index.js` emits a bare
 * `import { createHash } from "crypto"` (tsup strips the `node:` prefix).
 * In the production rolldown build this resolves to an empty module, so
 * the SPA loads fine and `createHash` is simply `undefined` (the
 * `canonicalHash` export is not exercised in the browser UI). Vite's dev
 * server, by contrast, externalizes `crypto` to a throwing proxy that
 * crashes the whole SPA at module-eval time.
 *
 * This stub gives the dev server the same behaviour as the shipped
 * production bundle. It is wired up via a `resolve.alias` entry in
 * `vite.config.ts`, alongside the existing `zod/v3` and `@ai-sdk/gateway`
 * stubs.
 */

export const createHash = undefined as unknown;
export default {};
