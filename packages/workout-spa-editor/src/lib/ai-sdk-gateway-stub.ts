/**
 * Stub for `@ai-sdk/gateway` exports referenced (statically) by the `ai` SDK.
 *
 * The SPA always passes a concrete `LanguageModel` instance from
 * `@kaiord/ai/providers` (createLanguageModel), so the
 * `globalThis.AI_SDK_DEFAULT_PROVIDER ?? gateway` fallback path is never
 * reached at runtime. Aliasing `@ai-sdk/gateway` to this stub at the SPA build
 * boundary lets rolldown drop the full gateway package (~60 KB raw, includes
 * the entire GatewayModelId catalog and thousands of model name strings).
 *
 * LOAD-BEARING: this stub and its `vite.config.ts` alias are a bundle-size
 * optimization, not dead code. The `@ai-sdk/*` deps stay in this package for
 * the alias to resolve even though provider instantiation now lives in
 * `@kaiord/ai/providers`. Do not remove as "unused".
 *
 * Same pattern as the round-5 zod/v3 stub.
 *
 * Vite alias only affects bundling — TypeScript type-checking still resolves
 * the real `.d.ts` from node_modules, so stub return types do not need to
 * match the published `Schema<T>` signatures.
 */

const unreachable = (): never => {
  throw new Error(
    "@ai-sdk/gateway is intentionally stubbed in the SPA build. " +
      "All AI calls must route through @kaiord/ai/providers (concrete model instance)."
  );
};

export const createGateway = unreachable;

export const gateway = new Proxy(
  {},
  {
    get: () => unreachable,
    apply: () => unreachable(),
  }
);

export class GatewayAuthenticationError extends Error {
  constructor(message?: string) {
    super(message ?? "GatewayAuthenticationError");
    this.name = "GatewayAuthenticationError";
  }

  // The `ai` SDK invokes `GatewayAuthenticationError.isInstance(error)`
  // inside `wrapGatewayError` to decide whether to rewrap with a
  // friendly "configure AI_GATEWAY_API_KEY" message. The SPA never
  // talks to the gateway, so the answer is always `false`. Returning
  // it preserves the original error (typically APICallError from the
  // chosen provider) — otherwise the call throws TypeError and the
  // executeWithRetry catch retries the request unnecessarily.
  static isInstance(): boolean {
    return false;
  }
}

// Base gateway error the `ai` SDK statically imports (newer @ai-sdk/gateway
// versions). `wrapGatewayError` calls `GatewayError.isInstance(error)`; same
// reasoning as above — the SPA never reaches the gateway, so it is always
// `false`, preserving the original provider error.
export class GatewayError extends Error {
  constructor(message?: string) {
    super(message ?? "GatewayError");
    this.name = "GatewayError";
  }

  static isInstance(): boolean {
    return false;
  }
}
