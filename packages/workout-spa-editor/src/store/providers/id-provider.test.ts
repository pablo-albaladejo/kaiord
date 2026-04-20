import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultIdProvider } from "./id-provider";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("defaultIdProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a UUID v4 string", () => {
    const id = defaultIdProvider();

    expect(id).toMatch(UUID_V4_REGEX);
  });

  it("is unique over 10k calls", () => {
    const ids = new Set<string>();

    for (let i = 0; i < 10_000; i++) {
      ids.add(defaultIdProvider());
    }

    expect(ids.size).toBe(10_000);
  });

  it("falls back to crypto.getRandomValues when randomUUID is undefined", () => {
    const realGetRandomValues = crypto.getRandomValues.bind(crypto);

    vi.stubGlobal("crypto", {
      getRandomValues: (buf: Uint8Array) => realGetRandomValues(buf),
    });

    const id = defaultIdProvider();

    expect(id).toMatch(UUID_V4_REGEX);
  });

  it("throws when no secure random source is available", () => {
    vi.stubGlobal("crypto", {});

    expect(() => defaultIdProvider()).toThrow(/No secure random source/);
  });
});
