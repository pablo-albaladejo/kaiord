import { act, renderHook } from "@testing-library/react";
import type Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { installStaleSchemaGuard } from "../adapters/dexie/stale-schema-guard";
import { useStaleSchema } from "./use-stale-schema";

const DECLARED = 37;
const CURRENT_NATIVE = 370;
const NEWER = 380;

type VersionChange = (event: { newVersion: number | null }) => unknown;

const guardedFakeDb = () => {
  let onVersionChange: VersionChange = () => undefined;
  const db = {
    verno: DECLARED,
    close: () => undefined,
    backendDB: () => ({ version: CURRENT_NATIVE }),
    on: (event: string, handler: VersionChange) => {
      if (event === "versionchange") onVersionChange = handler;
    },
  };
  installStaleSchemaGuard(db as unknown as Dexie);
  return (newVersion: number) => onVersionChange({ newVersion });
};

describe("useStaleSchema", () => {
  it("should turn stale live and stay stale for a later subscriber", () => {
    // Arrange
    const upgradeElsewhere = guardedFakeDb();
    const early = renderHook(() => useStaleSchema());
    const before = early.result.current;

    // Act
    act(() => {
      upgradeElsewhere(NEWER);
    });
    const late = renderHook(() => useStaleSchema());

    // Assert
    expect(before).toBe(false);
    expect(early.result.current).toBe(true);
    expect(late.result.current).toBe(true);
  });
});
