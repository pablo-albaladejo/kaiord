/**
 * A fake extension behind `chrome.runtime.sendMessage`, for the message
 * contract between a Connector and its thin Bridge (ADR 0004): the current
 * extension (protocol 2) answers `request` with the Platform's raw answer by
 * "METHOD path"; the previous one (protocol 1) refuses `request` and answers
 * its legacy actions already read.
 */
export type Message = Record<string, unknown>;
export type RawReply = { status?: number; contentType?: string; body: string };
type Reply = RawReply | { refuse: Record<string, unknown> };

const install = (answerTo: (message: Message) => unknown): Message[] => {
  const sent: Message[] = [];
  (globalThis as Record<string, unknown>).chrome = {
    runtime: {
      lastError: null,
      sendMessage: (
        _id: string,
        message: Message,
        cb: (r: unknown) => void
      ) => {
        sent.push(message);
        cb(answerTo(message));
      },
    },
  };
  return sent;
};

export const uninstallFakeExtension = (): void => {
  delete (globalThis as Record<string, unknown>).chrome;
};

export const json = (payload: unknown, status = 200): RawReply => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(payload),
});

const NOT_ALLOWED = {
  ok: false,
  protocolVersion: 2,
  error: "Request not allowed",
  retryable: false,
};

// `kept`: the actions the current extension still answers itself (a
// Session check, the id a path is built on), by action name.
export const currentExtension = (
  byRequest: Record<string, Reply | ((m: Message) => Reply)>,
  kept: Record<string, unknown> = {}
): Message[] =>
  install((message) => {
    const action = String(message.action);
    if (action in kept) {
      return { ok: true, protocolVersion: 2, data: kept[action] };
    }
    const entry =
      byRequest[`${String(message.method)} ${String(message.path)}`];
    if (message.action !== "request" || entry === undefined) return NOT_ALLOWED;
    const reply = typeof entry === "function" ? entry(message) : entry;
    if ("refuse" in reply) {
      return { ok: false, protocolVersion: 2, ...reply.refuse };
    }
    return {
      ok: true,
      protocolVersion: 2,
      data: {
        status: reply.status ?? 200,
        contentType: reply.contentType ?? "application/json",
        body: reply.body,
      },
    };
  });

export const previousExtension = (
  byAction: Record<string, unknown>
): Message[] =>
  install((message) => {
    const data = byAction[String(message.action)];
    return data === undefined
      ? {
          ok: false,
          protocolVersion: 1,
          error: "Origin or action not permitted",
          retryable: false,
        }
      : { ok: true, protocolVersion: 1, data };
  });
