import { UnsupportedFunctionalityError } from "ai";
import type { ClaudeRequest } from "./clean-context-args";
import type { V4CallOptions } from "./language-model-types";

export const unsupported = (functionality: string) =>
  new UnsupportedFunctionalityError({ functionality });

const userTextOf = (options: V4CallOptions): string => {
  const turns = options.prompt.filter((m) => m.role !== "system");
  const [only] = turns;
  if (turns.length !== 1 || only?.role !== "user") {
    throw unsupported("a prompt other than one user message");
  }
  return only.content
    .map((part) => {
      if (part.type !== "text") throw unsupported("file parts");
      return part.text;
    })
    .join("\n");
};

/** Rejects what `claude -p` cannot carry, so the suite reports it unmeasured. */
export const toClaudeRequest = (
  options: V4CallOptions,
  modelId: string
): ClaudeRequest => {
  if ((options.tools ?? []).length > 0) throw unsupported("tool calling");
  const format = options.responseFormat;
  if (format?.type !== "json" || format.schema === undefined) {
    throw unsupported("a call without a JSON schema");
  }
  const system = options.prompt.flatMap((m) =>
    m.role === "system" ? [m.content] : []
  );
  return {
    modelId,
    system: system.join("\n\n"),
    prompt: userTextOf(options),
    jsonSchema: format.schema,
  };
};
