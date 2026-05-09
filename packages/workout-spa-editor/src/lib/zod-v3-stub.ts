/**
 * Stub for `zod/v3` exports referenced (statically) by `@ai-sdk/provider-utils`.
 *
 * The SPA only uses zod v4 (aiWorkoutSchema is v4). provider-utils's `zodSchema()`
 * dispatcher checks `isZod4Schema(s)` and routes v4 schemas through the v4 path,
 * never invoking the v3-to-json-schema parsers — but rolldown still bundles the
 * v3 parser modules because they are statically reachable via named imports of
 * `ZodFirstPartyTypeKind` from `zod/v3`. Aliasing `zod/v3` to this stub at the
 * SPA build boundary lets rolldown drop the full v3 module (~86 KB rendered).
 *
 * Only the `ZodFirstPartyTypeKind` symbol is needed; provider-utils consumes it
 * for `def.typeName === ZodFirstPartyTypeKind.<name>` comparisons inside the v3
 * parsers — never executed for v4 schemas at runtime.
 */
export const ZodFirstPartyTypeKind = Object.freeze({
  ZodString: "ZodString",
  ZodNumber: "ZodNumber",
  ZodNaN: "ZodNaN",
  ZodBigInt: "ZodBigInt",
  ZodBoolean: "ZodBoolean",
  ZodDate: "ZodDate",
  ZodSymbol: "ZodSymbol",
  ZodUndefined: "ZodUndefined",
  ZodNull: "ZodNull",
  ZodAny: "ZodAny",
  ZodUnknown: "ZodUnknown",
  ZodNever: "ZodNever",
  ZodVoid: "ZodVoid",
  ZodArray: "ZodArray",
  ZodObject: "ZodObject",
  ZodUnion: "ZodUnion",
  ZodDiscriminatedUnion: "ZodDiscriminatedUnion",
  ZodIntersection: "ZodIntersection",
  ZodTuple: "ZodTuple",
  ZodRecord: "ZodRecord",
  ZodMap: "ZodMap",
  ZodSet: "ZodSet",
  ZodFunction: "ZodFunction",
  ZodLazy: "ZodLazy",
  ZodLiteral: "ZodLiteral",
  ZodEnum: "ZodEnum",
  ZodEffects: "ZodEffects",
  ZodNativeEnum: "ZodNativeEnum",
  ZodOptional: "ZodOptional",
  ZodNullable: "ZodNullable",
  ZodDefault: "ZodDefault",
  ZodCatch: "ZodCatch",
  ZodPromise: "ZodPromise",
  ZodBranded: "ZodBranded",
  ZodPipeline: "ZodPipeline",
  ZodReadonly: "ZodReadonly",
} as const);
