import type { SseEvent } from "./llm-sse-types";

/** Anthropic Messages streaming events for a text reply. */
export const anthropic = (deltas: string[]): SseEvent[] => [
  {
    event: "message_start",
    data: {
      type: "message_start",
      message: {
        id: "msg_mock_stream",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-5-20241022",
        content: [],
        usage: { input_tokens: 100, output_tokens: 1 },
      },
    },
  },
  {
    event: "content_block_start",
    data: {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    },
  },
  ...deltas.map((text) => ({
    event: "content_block_delta",
    data: {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
  })),
  {
    event: "content_block_stop",
    data: { type: "content_block_stop", index: 0 },
  },
  {
    event: "message_delta",
    data: {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 200 },
    },
  },
  { event: "message_stop", data: { type: "message_stop" } },
];
