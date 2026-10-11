import { describe, expect, it, vi } from "vitest";

import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../test-utils";
import { createInMemorySnapshotPort } from "../../../test-utils/in-memory-snapshot-port";
import { PrivacyTab } from "./PrivacyTab";

const download = vi.hoisted(() => vi.fn());

vi.mock("../../../utils/save-workout.helpers", () => ({
  triggerDownload: download,
}));

const snapshotPort = () =>
  createInMemorySnapshotPort({
    schemaVersion: 40,
    tables: {
      profiles: [{ id: "p-1", name: "Mi perfil", origin: "auto" }],
      workouts: [{ id: "w-1", profileId: "p-1" }],
      aiProviders: [{ id: "ai-1", apiKey: "ciphertext" }],
    },
    tombstones: [],
  });

describe("PrivacyTab", () => {
  it("should download every record as a kaiord-backup file without secrets", async () => {
    // Arrange
    download.mockClear();
    renderWithProviders(<PrivacyTab />, { snapshotPort: snapshotPort() });

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Export my data" })
    );

    // Assert
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [content, filename] = download.mock.calls[0] as [string, string];
    const backup = JSON.parse(content);
    expect(backup.format).toBe("kaiord-backup");
    expect(backup.tables.workouts).toEqual([{ id: "w-1", profileId: "p-1" }]);
    expect(content).not.toContain("apiKey");
    expect(content).not.toContain('"origin":"auto"');
    expect(filename).toMatch(/^kaiord-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
