/**
 * Type definitions for the F6 Data Hub chat-tool evals: does the model
 * call `get_data_routes`/`set_data_route` correctly for the two hub
 * conversational scenarios from the spec?
 */
export type ChatToolBenchmark = {
  id: string;
  userText: string;
  category: "read" | "action";
  expectedTool: string;
  /** Read scenarios: the final answer must mention every phrase
      (case-insensitive substring match). */
  expectedAnswerIncludes?: string[];
  /** Action scenarios: the proposed tool call's input must match every
      key/value pair (partial match — extra fields are allowed). */
  expectedActionInput?: Record<string, unknown>;
};

export type ChatToolEvalResult = {
  id: string;
  pass: boolean;
  errors: string[];
  toolCalled?: string;
  durationMs: number;
};
