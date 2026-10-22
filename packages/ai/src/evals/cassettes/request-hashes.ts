import type { MockLanguageModelV4 } from "ai/test";
import type { PromptDefinition } from "../../prompts/registry";
import { canonicalSchema, hashOf } from "./canonical-hash";

/** What a `LanguageModelV4` receives per call, the same on record and replay. */
export type CallOptions = MockLanguageModelV4["doGenerateCalls"][number];

/** System prompt, messages, canonical schema and model id: the request. */
export const requestHashOf = (
  options: CallOptions,
  modelId: string
): string => {
  const system = options.prompt.filter((m) => m.role === "system");
  const messages = options.prompt.filter((m) => m.role !== "system");
  const format = options.responseFormat;
  const schema = format?.type === "json" ? (format.schema ?? null) : null;
  return hashOf({
    modelId,
    system: system.map((m) => m.content),
    messages,
    schema: canonicalSchema(schema),
  });
};

export const toolsHashOf = (options: CallOptions): string =>
  hashOf(options.tools ?? []);

export const promptHashOf = (prompt: PromptDefinition): string =>
  hashOf({
    id: prompt.id,
    version: prompt.version,
    template: prompt.template,
  });

export const fixtureHashOf = (fixture: unknown): string => hashOf(fixture);
