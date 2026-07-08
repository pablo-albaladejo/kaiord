/**
 * Versioned prompt registry. `definePrompt` registers a template keyed by id;
 * `resolvePrompt` substitutes its `{{variable}}` placeholders. Resolving an
 * unregistered id, or omitting a declared variable, fails fast with a typed
 * error. No locale axis yet — the i18n program adds one when localized prompts
 * land.
 */
import { loadPrompt } from "./load-prompt";

export type PromptDefinition = {
  id: string;
  version: string;
  template: string;
  variables: string[];
};

export class PromptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptError";
  }
}

const REGISTRY = new Map<string, PromptDefinition>();

export const definePrompt = (def: PromptDefinition): PromptDefinition => {
  REGISTRY.set(def.id, def);
  return def;
};

const getOrThrow = (id: string): PromptDefinition => {
  const def = REGISTRY.get(id);
  if (!def) throw new PromptError(`Unknown prompt id: ${id}`);
  return def;
};

export const resolvePrompt = (
  id: string,
  opts: { vars?: Record<string, string> } = {}
): string => {
  const def = getOrThrow(id);
  const vars = opts.vars ?? {};
  for (const name of def.variables) {
    if (!(name in vars)) {
      throw new PromptError(
        `Missing prompt variable "${name}" for prompt ${id}`
      );
    }
  }
  return loadPrompt(def.template, vars);
};

export const getPromptVersion = (id: string): string => getOrThrow(id).version;
