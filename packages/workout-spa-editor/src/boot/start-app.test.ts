import "fake-indexeddb/auto";

import { describe, expect, it, vi } from "vitest";

import {
  DECLARED_VERNO,
  KaiordDatabase,
} from "../adapters/dexie/dexie-database";
import type { SchemaProbeResult } from "../adapters/dexie/schema-probe";
import { probeSchema } from "../adapters/dexie/schema-probe";
import { StaleSchemaError } from "../adapters/dexie/stale-schema-guard";
import { startApp, type StartAppDeps } from "./start-app";

const NATIVE_STALE = 380;
const NATIVE_FRESH = 370;

const depsFor = (
  probe: StartAppDeps["probe"],
  overrides: Partial<StartAppDeps> = {}
) => ({
  probe,
  openDb: vi.fn(async () => undefined),
  closeDb: vi.fn(),
  renderApp: vi.fn(),
  renderStale: vi.fn(async () => undefined),
  ...overrides,
});

type Settle = { resolve: () => void; reject: (error: Error) => void };

const resolved = (result: SchemaProbeResult) => async () => result;

describe("startApp", () => {
  it("should render only the stale screen and never open the database", async () => {
    // Arrange
    const deps = depsFor(
      resolved({ status: "stale", nativeVersion: NATIVE_STALE })
    );

    // Act
    await startApp(deps);

    // Assert
    expect(deps.renderStale).toHaveBeenCalledTimes(1);
    expect(deps.renderApp).not.toHaveBeenCalled();
    expect(deps.openDb).not.toHaveBeenCalled();
  });

  it("should hold a fresh probe until the open settles", async () => {
    // Arrange
    const order: string[] = [];
    const release = vi.fn(() => order.push("release"));
    const deps = depsFor(
      resolved({ status: "fresh", nativeVersion: NATIVE_FRESH, release }),
      {
        renderApp: vi.fn(() => order.push("render")),
        openDb: vi.fn(async () => order.push("open")),
      }
    );

    // Act
    await startApp(deps);

    // Assert
    expect(order).toEqual(["render", "open", "release"]);
  });

  it.each([
    ["resolves", (settle: Settle) => settle.resolve()],
    ["rejects", (settle: Settle) => settle.reject(new Error("quota"))],
  ])(
    "should not release a fresh probe until the open %s",
    async (_outcome, finish) => {
      // Arrange
      const release = vi.fn();
      let settle: Settle = {
        resolve: () => undefined,
        reject: () => undefined,
      };
      const pendingOpen = new Promise<void>((resolve, reject) => {
        settle = { resolve, reject };
      });
      const deps = depsFor(
        resolved({ status: "fresh", nativeVersion: NATIVE_FRESH, release }),
        { openDb: vi.fn(() => pendingOpen) }
      );

      // Act
      const booting = startApp(deps);
      await vi.waitFor(() => expect(deps.openDb).toHaveBeenCalledTimes(1));
      const releasedWhilePending = release.mock.calls.length;
      finish(settle);
      await booting;

      // Assert
      expect(releasedWhilePending).toBe(0);
      expect(release).toHaveBeenCalledTimes(1);
    }
  );

  it("should render normally when the probe throws or rejects", async () => {
    // Arrange
    const throwing = depsFor(() => {
      throw new Error("probe");
    });
    const rejecting = depsFor(() => Promise.reject(new Error("probe")));

    // Act
    await startApp(throwing);
    await startApp(rejecting);

    // Assert
    expect(throwing.renderApp).toHaveBeenCalledTimes(1);
    expect(rejecting.renderApp).toHaveBeenCalledTimes(1);
  });

  it("should render normally when the stale screen fails", async () => {
    // Arrange
    const deps = depsFor(
      resolved({ status: "stale", nativeVersion: NATIVE_STALE }),
      { renderStale: vi.fn(() => Promise.reject(new Error("render"))) }
    );

    // Act
    await startApp(deps);

    // Assert
    expect(deps.renderApp).toHaveBeenCalledTimes(1);
  });

  it("should close without auto-open when the open itself finds a newer schema", async () => {
    // Arrange
    const deps = depsFor(resolved({ status: "unknown" }), {
      openDb: vi.fn(() => Promise.reject(new StaleSchemaError(NATIVE_STALE))),
    });

    // Act
    await startApp(deps);

    // Assert
    expect(deps.renderApp).toHaveBeenCalledTimes(1);
    expect(deps.closeDb).toHaveBeenCalledTimes(1);
  });

  it("should keep the database closed for other open failures", async () => {
    // Arrange
    const deps = depsFor(resolved({ status: "absent" }), {
      openDb: vi.fn(() => Promise.reject(new Error("quota"))),
    });

    // Act
    await startApp(deps);

    // Assert
    expect(deps.renderApp).toHaveBeenCalledTimes(1);
    expect(deps.closeDb).not.toHaveBeenCalled();
  });
});

describe("startApp against a real newer database", () => {
  it("should never open the Kaiord database when the probe finds it stale", async () => {
    // Arrange
    const name = "start-app-stale";
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, NATIVE_STALE);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    const db = new KaiordDatabase(name);
    const open = vi.spyOn(db, "open");
    const renderStale = vi.fn(async () => undefined);

    // Act
    await startApp({
      probe: () => probeSchema(db.name, DECLARED_VERNO),
      openDb: () => db.open(),
      closeDb: () => db.close({ disableAutoOpen: true }),
      renderApp: vi.fn(),
      renderStale,
    });

    // Assert
    expect(renderStale).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    expect(db.isOpen()).toBe(false);
  });
});
