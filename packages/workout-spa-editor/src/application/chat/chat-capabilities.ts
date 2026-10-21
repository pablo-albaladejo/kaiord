/**
 * Declarative catalog of what the chat assistant can do, one entry per tool
 * in `buildChatTools`. The UI renders it locally (empty state and "What can I
 * do?") so discovering the assistant's capabilities never costs a model call.
 * A parity test fails when a tool is registered without an entry, or the
 * other way round, so adding a tool means adding one line here plus its
 * `chat.json` strings.
 *
 * Visible tools need a label under `capabilities.tool.<name>` and example prompts under
 * `capabilities.example.<id>` in the `chat` namespace.
 */

export const CHAT_CAPABILITY_GROUPS = ["consult", "log", "do"] as const;

export type ChatCapabilityGroup = (typeof CHAT_CAPABILITY_GROUPS)[number];

export type ChatCapability = {
  group: ChatCapabilityGroup;
  /** Writes data, so the engine stops for the user's confirmation. */
  writes: boolean;
  /** Example prompt ids, rendered as suggestion chips. */
  examples: readonly string[];
  /** Plumbing the user never asks for (kept for registry parity, not shown). */
  hidden?: boolean;
};

export const CHAT_CAPABILITIES = {
  get_today: { group: "consult", writes: false, examples: [], hidden: true },
  query_workouts: { group: "consult", writes: false, examples: ["week"] },
  query_health: { group: "consult", writes: false, examples: ["sleep"] },
  query_energy_balance: {
    group: "consult",
    writes: false,
    examples: ["balance"],
  },
  query_coaching: { group: "consult", writes: false, examples: ["coachPlan"] },
  get_data_routes: {
    group: "consult",
    writes: false,
    examples: ["weightSource"],
  },
  log_health_metric: {
    group: "log",
    writes: true,
    examples: ["logWeight", "logSleep"],
  },
  log_intake: { group: "log", writes: true, examples: ["logMeal"] },
  create_workout: { group: "do", writes: true, examples: ["createWorkout"] },
  push_to_garmin: { group: "do", writes: true, examples: ["pushGarmin"] },
  sync_coaching: { group: "do", writes: true, examples: ["syncCoaching"] },
  set_data_route: { group: "do", writes: true, examples: ["setRoute"] },
} as const satisfies Record<string, ChatCapability>;

export type ChatCapabilityToolName = keyof typeof CHAT_CAPABILITIES;

export type ChatCapabilitySection = {
  group: ChatCapabilityGroup;
  /** True when any tool in the group writes (the user confirms each one). */
  writes: boolean;
  tools: ChatCapabilityToolName[];
  examples: string[];
};

/** The catalog grouped in display order, with each group's example ids. */
export const chatCapabilitySections = (): ChatCapabilitySection[] =>
  CHAT_CAPABILITY_GROUPS.map((group) => {
    const entries = (
      Object.entries(CHAT_CAPABILITIES) as [
        ChatCapabilityToolName,
        ChatCapability,
      ][]
    ).filter(([, c]) => c.group === group && !c.hidden);
    return {
      group,
      writes: entries.some(([, c]) => c.writes),
      tools: entries.map(([name]) => name),
      examples: entries.flatMap(([, c]) => c.examples),
    };
  });
