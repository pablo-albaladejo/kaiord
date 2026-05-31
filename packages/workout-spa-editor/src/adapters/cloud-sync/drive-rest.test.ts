import { afterEach, describe, expect, it, vi } from "vitest";

import type { Snapshot } from "../../types/snapshot";
import { createDriveRest } from "./drive-rest";

function snapshot(): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "dev",
      exportedAt: "2026-01-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: [{ id: "w1" }] },
    tombstones: [],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createDriveRest.download", () => {
  it("should return null when the snapshot file is absent", async () => {
    // Arrange
    const fetchMock = vi.fn(async () => jsonResponse({ files: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const rest = createDriveRest(() => "tok");

    // Act
    const result = await rest.download();

    // Assert
    expect(result).toBeNull();
  });

  it("should return snapshot and revision when the file exists", async () => {
    // Arrange
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("files?")) {
        return jsonResponse({
          files: [{ id: "file-1", headRevisionId: "rev-7" }],
        });
      }
      return jsonResponse(snapshot());
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const rest = createDriveRest(() => "tok");

    // Act
    const result = await rest.download();

    // Assert
    expect(result?.headRevisionId).toBe("rev-7");
    expect(result?.snapshot.tables.workouts).toEqual([{ id: "w1" }]);
  });
});

describe("createDriveRest.upload", () => {
  it("should multipart-create the file when none exists and return its revision", async () => {
    // Arrange
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (!url.includes("/upload/")) return jsonResponse({ files: [] });
      return jsonResponse({ id: "new-file", headRevisionId: "rev-1" });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const rest = createDriveRest(() => "tok");

    // Act
    const revision = await rest.upload(snapshot());

    // Assert
    expect(revision).toBe("rev-1");
    expect(calls.some((c) => c.includes("uploadType=multipart"))).toBe(true);
  });

  it("should media-PATCH the existing file rather than create a second", async () => {
    // Arrange
    const calls: { method: string; url: string }[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ method: init?.method ?? "GET", url });
      if (url.includes("files?")) {
        return jsonResponse({
          files: [{ id: "file-9", headRevisionId: "rev-3" }],
        });
      }
      return jsonResponse({ id: "file-9", headRevisionId: "rev-4" });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const rest = createDriveRest(() => "tok");

    // Act
    const revision = await rest.upload(snapshot());

    // Assert
    expect(revision).toBe("rev-4");
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.url).toContain("file-9");
    expect(patch?.url).toContain("uploadType=media");
  });
});
