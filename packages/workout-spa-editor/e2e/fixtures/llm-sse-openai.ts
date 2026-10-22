import type { SseEvent } from "./llm-sse-types";

const OPENAI_ITEM = { type: "message", id: "msg_mock_stream" };

/** OpenAI Responses API events (the SDK default for `openai(modelId)`). */
export const openAiResponses = (deltas: string[]): SseEvent[] => [
  {
    data: {
      type: "response.created",
      response: { id: "resp_mock", created_at: 0, model: "gpt-4o-mini" },
    },
  },
  {
    data: {
      type: "response.output_item.added",
      output_index: 0,
      item: OPENAI_ITEM,
    },
  },
  ...deltas.map((delta) => ({
    data: {
      type: "response.output_text.delta",
      item_id: OPENAI_ITEM.id,
      output_index: 0,
      delta,
    },
  })),
  {
    data: {
      type: "response.output_item.done",
      output_index: 0,
      item: OPENAI_ITEM,
    },
  },
  {
    data: {
      type: "response.completed",
      response: {
        incomplete_details: null,
        usage: { input_tokens: 100, output_tokens: 200 },
      },
    },
  },
];

/** OpenAI Chat Completions chunks (`openai.chat(modelId)`). */
export const openAiChat = (deltas: string[]): SseEvent[] => [
  ...deltas.map((content, i) => ({
    data: {
      id: "chatcmpl_mock",
      object: "chat.completion.chunk",
      created: 0,
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          delta: i === 0 ? { role: "assistant", content } : { content },
          finish_reason: null,
        },
      ],
    },
  })),
  {
    data: {
      id: "chatcmpl_mock",
      object: "chat.completion.chunk",
      created: 0,
      model: "gpt-4o-mini",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 100, completion_tokens: 200 },
    },
  },
  { data: "[DONE]" },
];
