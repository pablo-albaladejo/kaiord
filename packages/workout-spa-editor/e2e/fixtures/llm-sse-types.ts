/** One server-sent event: an optional `event:` name and its `data:`. */
export type SseEvent = { event?: string; data: unknown };
