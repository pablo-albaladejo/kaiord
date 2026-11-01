export type Part = Readonly<Record<string, unknown>>;

export type TaskState =
  "TASK_STATE_COMPLETED" | "TASK_STATE_FAILED" | "TASK_STATE_REJECTED";

export type UserMessage = {
  readonly messageId: string;
  readonly role: unknown;
  readonly parts: ReadonlyArray<Part>;
};

export type TaskInput = {
  readonly contextId: string;
  readonly message: UserMessage;
  readonly state: TaskState;
  readonly statusText: string;
  /** Spec §3.2.4: historyLength 0 asks for no history. */
  readonly omitHistory?: boolean;
  readonly artifact?: {
    readonly name: string;
    readonly parts: ReadonlyArray<Part>;
  };
};

const ID_BYTES = 12;

export const randomId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_BYTES));
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_");
};

/** D4: a task id embeds no argument, only random bytes. */
export const newTaskId = (): string => `k1.${randomId()}`;

/** D4: the user message is echoed through allowlisted fields only. */
const historyOf = (message: UserMessage, contextId: string) => [
  {
    messageId: message.messageId,
    role: "ROLE_USER",
    parts: message.parts,
    contextId,
  },
];

export const buildTask = (input: TaskInput) => {
  const id = newTaskId();
  const { contextId, artifact } = input;
  const statusMessage = {
    messageId: randomId(),
    role: "ROLE_AGENT",
    parts: [{ text: input.statusText }],
    contextId,
    taskId: id,
  };
  return {
    id,
    contextId,
    status: {
      state: input.state,
      message: statusMessage,
      timestamp: new Date().toISOString(),
    },
    ...(artifact === undefined
      ? {}
      : { artifacts: [{ artifactId: "result", ...artifact }] }),
    ...(input.omitHistory === true
      ? {}
      : { history: historyOf(input.message, contextId) }),
  };
};
