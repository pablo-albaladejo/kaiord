import { beforeEach, describe, expect, it } from "vitest";

// GLOSSARY, "What the athlete reads": a cause that was not verified is never
// stated. WHOOP says the captured bearer no longer signs in with a 401; a
// 403, a 5xx or a tab that did not answer is WHOOP failing, and the request
// fails with its status and no needsReauth. With no bearer captured yet the
// Session check asks nothing and answers "not-checked", never signed out.

const { storeToken } = require("../background.js");

const APP = { origin: "https://kaiord.com" };
const CYCLES =
  "/core-details-bff/v0/cycles/details?id=42&startTime=2026-11-01T00%3A00%3A00.000Z&endTime=2026-11-23T00%3A00%3A00.000Z";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const tabAnswers = async (tabReply) => {
  await storeToken(makeJwt({ "custom:user_id": "42" }));
  chrome.tabs.query.mockImplementation((_q, cb) => cb([{ id: 99 }]));
  chrome.tabs.sendMessage.mockImplementation((_id, _msg, cb) => cb(tabReply));
};

const send = (message) =>
  new Promise((resolve) => externalCb(message, APP, resolve));
const read = () => send({ action: "request", method: "GET", path: CYCLES });

describe("WHOOP is reported signed out only when it said so", () => {
  beforeEach(() => __resetChromeMock());

  it("should flag a read needsReauth when WHOOP answers 401", async () => {
    // Arrange
    await tabAnswers({ ok: false, status: 401, contentType: "", body: "" });

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, status: 401, needsReauth: true });
  });

  it.each([[403], [503]])(
    "should fail a read answered %i with its status and no needsReauth",
    async (status) => {
      // Arrange
      await tabAnswers({ ok: false, status, contentType: "", body: "" });

      // Act
      const res = await read();

      // Assert
      expect(res).toMatchObject({ ok: false, status });
      expect(res.needsReauth).toBeUndefined();
    }
  );

  it("should answer not-checked, never signed out, with no bearer captured", async () => {
    // Arrange
    const message = { action: "ping" };

    // Act
    const res = await send(message);

    // Assert
    expect(res.data).toMatchObject({
      session: "not-checked",
      connected: false,
    });
    expect(res.needsReauth).toBeUndefined();
  });
});
