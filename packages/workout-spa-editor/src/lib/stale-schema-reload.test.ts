import { afterEach, describe, expect, it, vi } from "vitest";

import { clearStaleReloadAttempt, hasAttempted } from "./stale-reload-mark";
import {
  reloadIntoNewerCode,
  type StaleReloadEnv,
  WORKER_WAIT_MS,
} from "./stale-schema-reload";

class FakeWorker extends EventTarget {
  state: ServiceWorkerState;
  readonly postMessage = vi.fn((message: { type: string }) => {
    if (message.type === "SKIP_WAITING") this.moveTo("activated");
  });
  constructor(state: ServiceWorkerState) {
    super();
    this.state = state;
  }
  moveTo(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}

type FakeRegistration = {
  update: () => Promise<unknown>;
  waiting: FakeWorker | null;
  installing: FakeWorker | null;
};

const memoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
};

const envWith = (registration: FakeRegistration | undefined) => {
  const env = {
    serviceWorker: {
      getRegistration: async () =>
        registration as unknown as ServiceWorkerRegistration,
    },
    storage: memoryStorage(),
    reload: vi.fn(),
  } satisfies StaleReloadEnv;
  return env;
};

const registrationWith = (
  worker: Partial<Pick<FakeRegistration, "waiting" | "installing">>,
  update: () => Promise<unknown> = async () => undefined
): FakeRegistration => ({
  update,
  waiting: worker.waiting ?? null,
  installing: worker.installing ?? null,
});

// Each lookup finds a newly deployed worker, as after a fresh deploy.
const alwaysWaiting = (): FakeRegistration => ({
  update: async () => undefined,
  get waiting() {
    return new FakeWorker("installed");
  },
  installing: null,
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reloadIntoNewerCode", () => {
  it("should show the dialog at boot without a registration and reload only on click", async () => {
    // Arrange
    const env = envWith(undefined);

    // Act
    const atBoot = await reloadIntoNewerCode({ auto: true }, env);
    const reloadsAtBoot = env.reload.mock.calls.length;
    const onClick = await reloadIntoNewerCode({ auto: false }, env);

    // Assert
    expect(atBoot).toBe("no-registration");
    expect(reloadsAtBoot).toBe(0);
    expect(onClick).toBe("reloading");
    expect(env.reload).toHaveBeenCalledTimes(1);
  });

  it("should offer a retry when the update rejects", async () => {
    // Arrange
    const waiting = new FakeWorker("installed");
    const env = envWith(
      registrationWith({ waiting }, () => Promise.reject(new Error("offline")))
    );

    // Act
    const outcome = await reloadIntoNewerCode({ auto: true }, env);

    // Assert
    expect(outcome).toBe("try-again");
    expect(waiting.postMessage).not.toHaveBeenCalled();
    expect(env.reload).not.toHaveBeenCalled();
  });

  it("should offer a retry when no newer worker is installing or waiting", async () => {
    // Arrange
    const env = envWith(registrationWith({}));

    // Act
    const outcome = await reloadIntoNewerCode({ auto: true }, env);

    // Assert
    expect(outcome).toBe("try-again");
    expect(env.reload).not.toHaveBeenCalled();
  });

  it("should skip waiting and reload once a waiting worker activates", async () => {
    // Arrange
    const waiting = new FakeWorker("installed");
    const env = envWith(registrationWith({ waiting }));

    // Act
    const outcome = await reloadIntoNewerCode({ auto: true }, env);

    // Assert
    expect(outcome).toBe("reloading");
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(env.reload).toHaveBeenCalledTimes(1);
    expect(hasAttempted(env.storage)).toBe(true);
  });

  it("should wait for an installing worker to finish installing", async () => {
    // Arrange
    const installing = new FakeWorker("installing");
    const env = envWith(registrationWith({ installing }));

    // Act
    const pending = reloadIntoNewerCode({ auto: true }, env);
    installing.moveTo("installed");
    const outcome = await pending;

    // Assert
    expect(outcome).toBe("reloading");
    expect(env.reload).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["turns redundant", (worker: FakeWorker) => worker.moveTo("redundant")],
    [
      "times out",
      () => vi.advanceTimersByTimeAsync(WORKER_WAIT_MS) as Promise<unknown>,
    ],
  ])(
    "should offer a retry when the installing worker %s",
    async (_how, finish) => {
      // Arrange
      vi.useFakeTimers();
      const installing = new FakeWorker("installing");
      const env = envWith(registrationWith({ installing }));

      // Act
      const pending = reloadIntoNewerCode({ auto: true }, env);
      await vi.advanceTimersByTimeAsync(0);
      await finish(installing);
      const outcome = await pending;

      // Assert
      expect(outcome).toBe("try-again");
      expect(installing.postMessage).not.toHaveBeenCalled();
      expect(env.reload).not.toHaveBeenCalled();
    }
  );

  it("should end at the dialog on a second stale boot even with a fresh worker", async () => {
    // Arrange
    const env = envWith(alwaysWaiting());
    await reloadIntoNewerCode({ auto: true }, env);

    // Act
    const second = await reloadIntoNewerCode({ auto: true }, env);
    const clicked = await reloadIntoNewerCode({ auto: false }, env);

    // Assert
    expect(second).toBe("try-again");
    expect(clicked).toBe("reloading");
    expect(env.reload).toHaveBeenCalledTimes(2);
  });

  it("should give a later stale boot its own attempt after a current boot", async () => {
    // Arrange
    const env = envWith(alwaysWaiting());
    await reloadIntoNewerCode({ auto: true }, env);

    // Act
    clearStaleReloadAttempt(env.storage);
    const again = await reloadIntoNewerCode({ auto: true }, env);

    // Assert
    expect(again).toBe("reloading");
    expect(env.reload).toHaveBeenCalledTimes(2);
  });
});
