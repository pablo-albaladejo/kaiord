import type { LanguageModel } from "ai";
import { getPromptVersion, resolvePrompt } from "../prompts/registry";
import type { AgentDefinition } from "./definition-types";

export type ResolvedPrompt = { system: string; promptVersion: string };

/** Resolve the agent's system prompt and its registered version. */
export const resolveSystemPrompt = (
  definition: AgentDefinition
): ResolvedPrompt => ({
  system: resolvePrompt(definition.systemPrompt.id, {
    vars: definition.systemPrompt.vars,
  }),
  promptVersion: getPromptVersion(definition.systemPrompt.id),
});

/** SDK provider string (OTel `gen_ai.system`); `unknown` for string models. */
export const providerOf = (model: LanguageModel): string =>
  typeof model === "string" ? "unknown" : (model.provider ?? "unknown");

export const modelIdOf = (model: LanguageModel): string =>
  typeof model === "string" ? model : (model.modelId ?? "unknown");
