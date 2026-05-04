/**
 * Co-located test for `useAiCustomPromptLive`.
 *
 * Distinguishes the three lifecycle states callers depend on:
 *   - `undefined` while resolving
 *   - `null` when no row has been written yet
 *   - the persisted string (including the deliberate empty-string case)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { useAiCustomPromptLive } from "./use-ai-custom-prompt-live";

const clearMeta = () => db.table("meta").clear();

describe("useAiCustomPromptLive", () => {
  beforeEach(clearMeta);
  afterEach(clearMeta);

  it("should resolve to null when no row exists in the meta table", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useAiCustomPromptLive());

    // Assert
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it("should resolve to the stored string and re-fires on update", async () => {
    // Arrange
    const { result } = renderHook(() => useAiCustomPromptLive());
    await waitFor(() => {
      expect(result.current).toBeNull();
    });

    // Act
    await db
      .table("meta")
      .put({ key: "ai_custom_prompt", value: "knee injury context" });

    // Assert
    await waitFor(() => {
      expect(result.current).toBe("knee injury context");
    });
  });

  it("should resolve to an empty string when the user clears the prompt", async () => {
    // Arrange
    await db.table("meta").put({ key: "ai_custom_prompt", value: "" });

    // Act
    const { result } = renderHook(() => useAiCustomPromptLive());

    // Assert
    await waitFor(() => {
      expect(result.current).toBe("");
    });
  });
});
