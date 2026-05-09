/**
 * Stub for `@ai-sdk/gateway` exports referenced (statically) by the `ai` SDK.
 *
 * The SPA always passes a concrete `LanguageModel` instance from
 * `provider-factory.ts` (createAnthropic / createOpenAI / createGoogleGenerativeAI),
 * so the `globalThis.AI_SDK_DEFAULT_PROVIDER ?? gateway` fallback path is never
 * reached at runtime. Aliasing `@ai-sdk/gateway` to this stub at the SPA build
 * boundary lets rolldown drop the full gateway package (~60 KB raw, includes
 * the entire GatewayModelId catalog and thousands of model name strings).
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
      "All AI calls must route through provider-factory.ts (concrete model instance)."
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
}
