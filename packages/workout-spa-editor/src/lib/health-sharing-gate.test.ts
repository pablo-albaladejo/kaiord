import { describe, expect, it, vi } from "vitest";

import {
  askOnce,
  createHealthSharingGate,
  type HealthQuestion,
} from "./health-sharing-gate";
import { createHealthSharingStore } from "./health-sharing-store";
import { hasUnsavedEdits } from "./unsaved-edits";

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
};

const setUp = () => {
  const storage = memoryStorage();
  const store = createHealthSharingStore(() => storage);
  const gate = createHealthSharingGate(store);
  return { storage, store, gate };
};

const CHAT: HealthQuestion = { flow: "assistant", providerType: "anthropic" };

describe("health sharing gate", () => {
  it("should ask the first time and send once without keeping the answer", async () => {
    // Arrange
    const { gate, store } = setUp();
    const ask = vi.fn().mockResolvedValue("once");
    gate.setAsker(ask);

    // Act
    const share = await gate.request(CHAT);

    // Assert
    expect(share).toBe("send");
    expect(ask).toHaveBeenCalledWith(CHAT, expect.any(AbortSignal));
    expect(store.read()).toEqual({});
  });

  it("should never ask again once the athlete always allows a Provider", async () => {
    // Arrange
    const { gate } = setUp();
    const ask = vi.fn().mockResolvedValue("always");
    gate.setAsker(ask);

    // Act
    const first = await gate.request(CHAT);
    const later = await gate.request({ ...CHAT, flow: "labImport" });

    // Assert
    expect([first, later]).toEqual(["send", "send"]);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it("should keep a don't-send answer and withhold without asking again", async () => {
    // Arrange
    const { gate, store } = setUp();
    const ask = vi.fn().mockResolvedValue("never");
    gate.setAsker(ask);

    // Act
    const first = await gate.request(CHAT);
    const later = await gate.request({ ...CHAT, flow: "generation" });

    // Assert
    expect([first, later]).toEqual(["withhold", "withhold"]);
    expect(ask).toHaveBeenCalledTimes(1);
    expect(store.read()).toEqual({ anthropic: "never" });
  });

  it("should ask again for a Provider that has no answer of its own", async () => {
    // Arrange
    const { gate } = setUp();
    const ask = vi.fn().mockResolvedValue("always");
    gate.setAsker(ask);
    await gate.request(CHAT);

    // Act
    await gate.request({ ...CHAT, providerType: "openai" });

    // Assert
    expect(ask).toHaveBeenLastCalledWith(
      { ...CHAT, providerType: "openai" },
      expect.any(AbortSignal)
    );
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it("should withhold when nothing on screen can ask the athlete", async () => {
    // Arrange
    const { gate } = setUp();

    // Act
    const share = await gate.request(CHAT);

    // Assert
    expect(share).toBe("withhold");
  });

  it("should report unsaved work while the question waits for an answer", async () => {
    // Arrange
    const { gate } = setUp();
    let answer: (value: "once") => void = () => undefined;
    gate.setAsker(() => new Promise((resolve) => (answer = resolve)));

    // Act
    const pending = gate.request(CHAT);
    await Promise.resolve();
    const whileAsking = hasUnsavedEdits();
    answer("once");
    await pending;

    // Assert
    expect(whileAsking).toBe(true);
    expect(hasUnsavedEdits()).toBe(false);
  });

  it("should ask once for two requests of the same path waiting together", async () => {
    // Arrange
    const { gate } = setUp();
    const ask = vi.fn().mockResolvedValue("once");
    gate.setAsker(ask);

    // Act
    const shares = await Promise.all([gate.request(CHAT), gate.request(CHAT)]);

    // Assert
    expect(shares).toEqual(["send", "send"]);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it("should keep the answer in this browser's storage, readable after a reload", async () => {
    // Arrange
    const { gate, storage } = setUp();
    gate.setAsker(async () => "always");
    await gate.request(CHAT);

    // Act
    const reloaded = createHealthSharingStore(() => storage).read();

    // Assert
    expect(reloaded).toEqual({ anthropic: "always" });
  });

  it("should ask a batch once for all its generations", async () => {
    // Arrange
    const ask = vi.fn().mockResolvedValue("send");
    const askHealth = askOnce(ask);

    // Act
    const shares = await Promise.all([askHealth(), askHealth(), askHealth()]);

    // Assert
    expect(shares).toEqual(["send", "send", "send"]);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  describe("while the question waits", () => {
    const deferred = () => {
      const answers: Array<(value: "once" | "always" | "never") => void> = [];
      const signals: AbortSignal[] = [];
      const ask = vi.fn(
        (_q: HealthQuestion, signal: AbortSignal) =>
          new Promise<"once" | "always" | "never">((resolve, reject) => {
            answers.push(resolve);
            signals.push(signal);
            signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );
      return { ask, answers, signals };
    };

    it("should cancel the question when the run that asked is stopped", async () => {
      // Arrange
      const { gate } = setUp();
      const { ask, signals } = deferred();
      gate.setAsker(ask);
      const stop = new AbortController();
      const waiting = gate.request(CHAT, { signal: stop.signal });
      await vi.waitFor(() => expect(ask).toHaveBeenCalledOnce());

      // Act
      stop.abort();

      // Assert
      await expect(waiting).rejects.toThrow(/abort/i);
      expect(signals[0]?.aborted).toBe(true);
      expect(hasUnsavedEdits()).toBe(false);
    });

    it("should keep the question for a run that still waits on it", async () => {
      // Arrange
      const { gate } = setUp();
      const { ask, answers, signals } = deferred();
      gate.setAsker(ask);
      const stop = new AbortController();
      const stopped = gate.request(CHAT, { signal: stop.signal });
      const kept = gate.request(CHAT);
      await vi.waitFor(() => expect(ask).toHaveBeenCalledOnce());

      // Act
      stop.abort();
      answers[0]?.("always");

      // Assert
      await expect(stopped).rejects.toThrow(/abort/i);
      await expect(kept).resolves.toBe("send");
      expect(signals[0]?.aborted).toBe(false);
    });

    it("should not ask a second path for the same Provider once the first is always allowed", async () => {
      // Arrange
      const { gate } = setUp();
      const { ask, answers } = deferred();
      gate.setAsker(ask);
      const chat = gate.request(CHAT);
      const generation = gate.request({ ...CHAT, flow: "generation" });
      await vi.waitFor(() => expect(ask).toHaveBeenCalledOnce());

      // Act
      answers[0]?.("always");

      // Assert
      await expect(chat).resolves.toBe("send");
      await expect(generation).resolves.toBe("send");
      expect(ask).toHaveBeenCalledOnce();
    });

    it("should ask the second path after the first is sent this time only", async () => {
      // Arrange
      const { gate } = setUp();
      const { ask, answers } = deferred();
      gate.setAsker(ask);
      const chat = gate.request(CHAT);
      const generation = gate.request({ ...CHAT, flow: "generation" });
      await vi.waitFor(() => expect(ask).toHaveBeenCalledOnce());

      // Act
      answers[0]?.("once");
      await chat;
      await vi.waitFor(() => expect(ask).toHaveBeenCalledTimes(2));
      answers[1]?.("never");

      // Assert
      await expect(generation).resolves.toBe("withhold");
    });

    it("should tell the run it waits, and not when a standing answer decides", async () => {
      // Arrange
      const { gate, store } = setUp();
      const { ask, answers } = deferred();
      gate.setAsker(ask);
      const onWait = vi.fn();
      const waiting = gate.request(CHAT, { onWait });
      await vi.waitFor(() => expect(ask).toHaveBeenCalledOnce());
      answers[0]?.("always");
      await waiting;
      const decided = vi.fn();

      // Act
      await gate.request({ ...CHAT, flow: "labImport" }, { onWait: decided });

      // Assert
      expect(onWait).toHaveBeenCalledOnce();
      expect(decided).not.toHaveBeenCalled();
      expect(store.read()).toEqual({ anthropic: "always" });
    });
  });
});
