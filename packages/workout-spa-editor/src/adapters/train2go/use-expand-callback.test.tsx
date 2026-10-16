import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { useExpandCallback } from "./use-expand-callback";

vi.mock("../../application/coaching/expand-day", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const transport = { source: "train2go" } as CoachingTransport;
const analytics = { event: vi.fn() } as unknown as Analytics;

describe("useExpandCallback with a failed import", () => {
  it("should answer a retryable transport failure instead of rejecting", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useExpandCallback(persistence, transport, analytics)
    );

    // Act
    const outcome = await result.current("p1", "2026-10-16");

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "transport-error" });
  });
});
