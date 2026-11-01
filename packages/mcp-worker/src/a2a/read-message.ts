import type { Part, UserMessage } from "./task";

export type ReadMessage = UserMessage & {
  readonly contextId?: unknown;
  readonly taskId?: unknown;
};

export type SkillCall = {
  readonly skill: string;
  readonly args: Record<string, unknown>;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** `null` when the message lacks the 1.0 shape the reply depends on. */
export const readMessage = (value: unknown): ReadMessage | null => {
  if (!isObject(value)) return null;
  const { messageId, parts, contextId, taskId, role } = value;
  if (typeof messageId !== "string" || !Array.isArray(parts)) return null;
  if (!parts.every(isObject)) return null;
  return { messageId, role, parts: parts as Part[], contextId, taskId };
};

/**
 * D3: the first data part names the skill; its other keys are the tool's
 * arguments. `null` when there is no such part or the skill is unknown.
 */
export const readSkillCall = (
  parts: ReadonlyArray<Part>,
  skillIds: ReadonlyArray<string>
): SkillCall | null => {
  const data = parts.find((part) => "data" in part)?.data;
  if (!isObject(data)) return null;
  const { skill, ...args } = data;
  if (typeof skill !== "string" || !skillIds.includes(skill)) return null;
  return { skill, args };
};
