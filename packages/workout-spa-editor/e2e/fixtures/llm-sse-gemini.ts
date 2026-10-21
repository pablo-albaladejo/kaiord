import type { SseEvent } from "./llm-sse-types";

/** Gemini `streamGenerateContent?alt=sse` chunks. */
export const gemini = (deltas: string[]): SseEvent[] =>
  deltas.map((text, i) => ({
    data: {
      candidates: [
        {
          content: { role: "model", parts: [{ text }] },
          index: 0,
          ...(i === deltas.length - 1 ? { finishReason: "STOP" } : {}),
        },
      ],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 200,
        totalTokenCount: 300,
      },
    },
  }));
