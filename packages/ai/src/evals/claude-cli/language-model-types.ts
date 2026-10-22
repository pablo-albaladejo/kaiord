import type { LanguageModel } from "ai";

/** The V4 member of the SDK's model union; no provider package needed. */
export type LanguageModelV4 = Extract<
  LanguageModel,
  { specificationVersion: "v4" }
>;
export type V4CallOptions = Parameters<LanguageModelV4["doGenerate"]>[0];
export type V4GenerateResult = Awaited<
  ReturnType<LanguageModelV4["doGenerate"]>
>;
export type V4Warning = V4GenerateResult["warnings"][number];

/** Where the adapter hands CLI provenance to a recorder. */
export const CLI_METADATA_KEY = "claudeCli";
