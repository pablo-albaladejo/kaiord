import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Message = { type: string; entry?: string };

class FakeWorker extends EventTarget {
  state: ServiceWorkerState = "installing";
  readonly messages: Message[] = [];
  constructor(private readonly onMessage?: (message: Message) => void) {
    super();
  }
  postMessage(message: Message) {
    this.messages.push(message);
    this.onMessage?.(message);
  }
  moveTo(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  readonly update = vi.fn(async () => undefined);
}

class FakeContainer extends EventTarget {
  controller: FakeWorker | null = null;
  registration = new FakeRegistration();
  windows = 1;
  readonly register = vi.fn(
    async (url: string, options: RegistrationOptions) => {
      this.registeredWith = { url, scope: options.scope };
      return this.registration;
    }
  );
  registeredWith?: { url: string; scope?: string };
  readonly startMessages = vi.fn();
  activeWorker = new FakeWorker();
  get ready() {
    return Promise.resolve({ active: this.activeWorker });
  }
  /** A controller that answers CLIENT_COUNT as the real worker does. */
  control() {
    this.controller = new FakeWorker((message) => {
      if (message.type !== "CLIENT_COUNT") return;
      queueMicrotask(() => {
        const event = new MessageEvent("message", {
          data: { type: "CLIENT_COUNT", count: this.windows },
        });
        this.dispatchEvent(event);
      });
    });
    return this.controller;
  }
  /** A new worker that finished installing while this page is controlled. */
  installNewWorker() {
    const worker = new FakeWorker();
    this.registration.installing = worker;
    this.registration.dispatchEvent(new Event("updatefound"));
    this.registration.installing = null;
    this.registration.waiting = worker;
    worker.moveTo("installed");
    return worker;
  }
}

const EARLY_MS = 1_000;
const HOUR_MS = 3_600_000;
const ENTRY = "http://localhost/app/assets/index-AAAA1111.js";

const load = async () => {
  vi.resetModules();
  const start = await import("./start-service-worker");
  const store = await import("./update-store");
  const apply = await import("./apply-update");
  const unsaved = await import("../unsaved-edits");
  const flushes = await import("../pending-flushes");
  return { ...start, ...store, ...apply, ...unsaved, ...flushes };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

type Options = {
  prod?: boolean;
  saveData?: boolean;
  sinceLoadMs?: number;
};

const boot = async (container: FakeContainer, options: Options = {}) => {
  const mod = await load();
  const reload = vi.fn();
  mod.startServiceWorker({
    prod: options.prod ?? true,
    base: "/app/",
    container: container as unknown as ServiceWorkerContainer,
    saveData: options.saveData ?? false,
    reload,
    whenReady: (run) => run(),
    sinceLoadMs: () => options.sinceLoadMs ?? EARLY_MS,
  });
  await settle();
  return { mod, reload };
};

describe("startServiceWorker", () => {
  beforeEach(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = ENTRY;
    document.head.appendChild(script);
  });

  afterEach(() => {
    document.head.innerHTML = "";
    vi.useRealTimers();
  });

  it("should not register outside a production build", async () => {
    // Arrange
    const container = new FakeContainer();

    // Act
    await boot(container, { prod: false });

    // Assert
    expect(container.register).not.toHaveBeenCalled();
  });

  it("should not register when the browser asks to save data", async () => {
    // Arrange
    const container = new FakeContainer();

    // Act
    await boot(container, { saveData: true });

    // Assert
    expect(container.register).not.toHaveBeenCalled();
  });

  it("should register <base>sw.js scoped to the base", async () => {
    // Arrange
    const container = new FakeContainer();

    // Act
    await boot(container);

    // Assert
    expect(container.registeredWith).toEqual({
      url: "/app/sw.js",
      scope: "/app/",
    });
  });

  it("should ignore a failed registration", async () => {
    // Arrange
    const container = new FakeContainer();
    container.register.mockRejectedValueOnce(new Error("404"));

    // Act
    const { mod } = await boot(container);

    // Assert
    expect(mod.getUpdateState()).toBe("idle");
  });

  it("should wait for the page to be ready before registering", async () => {
    // Arrange
    const container = new FakeContainer();
    const mod = await load();
    let ready: () => void = () => undefined;

    // Act
    mod.startServiceWorker({
      prod: true,
      base: "/app/",
      container: container as unknown as ServiceWorkerContainer,
      saveData: false,
      reload: vi.fn(),
      whenReady: (run) => {
        ready = run;
      },
      sinceLoadMs: () => 0,
    });
    await settle();
    const before = container.register.mock.calls.length;
    ready();
    await settle();

    // Assert
    expect(before).toBe(0);
    expect(container.register).toHaveBeenCalledTimes(1);
  });

  it("should report its entry module to the controller at boot and again on every controllerchange", async () => {
    // Arrange
    const container = new FakeContainer();
    const first = container.control();
    await boot(container);
    const second = container.control();

    // Act
    container.dispatchEvent(new Event("controllerchange"));
    await settle();

    // Assert
    expect(first.messages).toContainEqual({ type: "HELLO", entry: ENTRY });
    expect(second.messages).toContainEqual({ type: "HELLO", entry: ENTRY });
  });

  it("should report its entry module to the active worker when the page has no controller", async () => {
    // Arrange
    const container = new FakeContainer();

    // Act
    await boot(container);

    // Assert
    expect(container.activeWorker.messages).toContainEqual({
      type: "HELLO",
      entry: ENTRY,
    });
  });

  it("should offer the update, not apply it, when a worker is already waiting late after load", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const waiting = new FakeWorker();
    waiting.state = "installed";
    container.registration.waiting = waiting;

    // Act
    const { mod, reload } = await boot(container, { sinceLoadMs: 20_000 });

    // Assert
    expect(mod.getUpdateState()).toBe("available");
    expect(waiting.messages).toEqual([]);
    expect(reload).not.toHaveBeenCalled();
  });

  it("should apply silently a worker found within 10 s, with no input, nothing unsaved and one window", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { mod, reload } = await boot(container);

    // Act
    const worker = container.installNewWorker();
    await settle();
    container.dispatchEvent(new Event("controllerchange"));

    // Assert
    expect(worker.messages).toContainEqual({ type: "SKIP_WAITING" });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(mod.getUpdateState()).toBe("applying");
  });

  for (const [name, setup] of [
    ["input came first", () => window.dispatchEvent(new Event("keydown"))],
    ["another window is open", (c: FakeContainer) => (c.windows = 2)],
  ] as const) {
    it(`should show the prompt instead of applying silently when ${name}`, async () => {
      // Arrange
      const container = new FakeContainer();
      container.control();
      const { mod, reload } = await boot(container);
      setup(container);

      // Act
      const worker = container.installNewWorker();
      await settle();

      // Assert
      expect(mod.getUpdateState()).toBe("available");
      expect(worker.messages).toEqual([]);
      expect(reload).not.toHaveBeenCalled();
    });
  }

  it("should show the prompt when the worker is found more than 10 s after load", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { mod } = await boot(container, { sinceLoadMs: 10_001 });

    // Act
    const worker = container.installNewWorker();
    await settle();

    // Assert
    expect(mod.getUpdateState()).toBe("available");
    expect(worker.messages).toEqual([]);
  });

  it("should show the prompt when edits are unsaved", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { mod } = await boot(container);
    const disarm = mod.armUnsavedEdits();

    // Act
    const worker = container.installNewWorker();
    await settle();

    // Assert
    expect(mod.getUpdateState()).toBe("available");
    expect(worker.messages).toEqual([]);
    disarm();
  });

  it("should not offer anything when the first worker installs on an uncontrolled page", async () => {
    // Arrange
    const container = new FakeContainer();
    const { mod } = await boot(container);

    // Act
    container.installNewWorker();
    await settle();

    // Assert
    expect(mod.getUpdateState()).toBe("idle");
  });

  it("should block the update while edits are unsaved, without messaging the worker", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { mod, reload } = await boot(container);
    window.dispatchEvent(new Event("pointerdown"));
    const worker = container.installNewWorker();
    await settle();
    const disarm = mod.armUnsavedEdits();

    // Act
    const outcome = await mod.applyUpdate();

    // Assert
    expect(outcome).toBe("blocked");
    expect(mod.getUpdateState()).toBe("blocked");
    expect(worker.messages).toEqual([]);
    expect(reload).not.toHaveBeenCalled();
    disarm();
  });

  it("should flush pending saves, then skip waiting, then reload this tab once on controllerchange", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { mod, reload } = await boot(container);
    window.dispatchEvent(new Event("pointerdown"));
    const order: string[] = [];
    const worker = container.installNewWorker();
    await settle();
    worker.postMessage = (message) => void order.push(message.type);
    const unregister = mod.registerPendingFlush(async () => {
      await settle();
      order.push("flushed");
    });

    // Act
    await mod.applyUpdate();
    container.dispatchEvent(new Event("controllerchange"));
    container.dispatchEvent(new Event("controllerchange"));

    // Assert
    expect(order).toEqual(["flushed", "SKIP_WAITING"]);
    expect(reload).toHaveBeenCalledTimes(1);
    unregister();
  });

  it("should not reload a tab that did not ask for the update when the controller changes", async () => {
    // Arrange
    const container = new FakeContainer();
    container.control();
    const { reload } = await boot(container);
    window.dispatchEvent(new Event("pointerdown"));
    container.installNewWorker();
    await settle();

    // Act
    container.dispatchEvent(new Event("controllerchange"));

    // Assert
    expect(reload).not.toHaveBeenCalled();
  });

  it("should check for an update when the page becomes visible and every hour, at most once an hour", async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ["setInterval", "Date"] });
    const container = new FakeContainer();
    await boot(container);
    const visible = () => document.dispatchEvent(new Event("visibilitychange"));

    // Act
    visible();
    const atOnce = container.registration.update.mock.calls.length;
    vi.advanceTimersByTime(HOUR_MS);
    const afterAnHour = container.registration.update.mock.calls.length;
    visible();
    const visibleRightAfter = container.registration.update.mock.calls.length;

    // Assert
    expect(atOnce).toBe(0);
    expect(afterAnHour).toBe(1);
    expect(visibleRightAfter).toBe(1);
  });
});
