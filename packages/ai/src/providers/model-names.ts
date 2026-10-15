import { MODEL_CATALOG } from "./provider-models";
import type { LlmProviderType } from "./types";

// A provider pins a snapshot of an alias with a date or a revision number.
const PIN = /^(.+?)-(\d{8}|\d{4}-\d{2}-\d{2}|\d{3})$/;

const splitPin = (id: string): { base: string; pin?: string } => {
  const m = PIN.exec(id);
  return m ? { base: m[1]!, pin: m[2] } : { base: id };
};

const formatPin = (pin: string): string =>
  /^\d{8}$/.test(pin)
    ? `${pin.slice(0, 4)}-${pin.slice(4, 6)}-${pin.slice(6)}`
    : pin;

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

const CLAUDE = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?$/;

const nameOf = (id: string): string => {
  const claude = CLAUDE.exec(id);
  if (claude) {
    const [, family, major, minor] = claude;
    return `Claude ${capitalize(family!)} ${minor ? `${major}.${minor}` : major}`;
  }
  if (id.startsWith("gpt-")) {
    const [version, ...rest] = id.slice(4).split("-");
    return [`GPT-${version}`, ...rest].join(" ");
  }
  if (id.startsWith("gemini-")) {
    return id.split("-").map(capitalize).join(" ");
  }
  return id;
};

/**
 * A model's product name ("Claude Sonnet 5", "GPT-5 mini"), with a pinned
 * snapshot's date or revision in brackets. An id with no known shape (a custom
 * or future model) is shown as it is.
 */
export const modelDisplayName = (modelId: string): string => {
  const { base, pin } = splitPin(modelId);
  const name = nameOf(base);
  if (!pin || name === base) return nameOf(modelId);
  return `${name} (${formatPin(pin)})`;
};

/**
 * The catalog models worth offering: a pinned snapshot is dropped when its
 * alias is listed too, since both name the same model.
 */
export const listedModels = (type: LlmProviderType): string[] => {
  const ids = MODEL_CATALOG[type].map((m) => m.id);
  return ids.filter((id) => {
    const { base, pin } = splitPin(id);
    return !pin || !ids.includes(base);
  });
};
