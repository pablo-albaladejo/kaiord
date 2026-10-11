import { describe, expect, it } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import { createInMemorySnapshotPort } from "../../../test-utils/in-memory-snapshot-port";
import { BackupImportSection } from "./BackupImportSection";

type Row = Record<string, unknown>;

const freshDevice = () => {
  const state = {
    schemaVersion: 40,
    tables: {
      profiles: [{ id: "p-auto", name: "Mi perfil", origin: "auto" }],
      meta: [{ key: "activeProfileId", value: "p-auto" }],
    } as Record<string, unknown[]>,
    tombstones: [],
    deviceLocal: {},
  };
  return { state, port: createInMemorySnapshotPort(state) };
};

const backupFile = (profiles: Row[], extra: Row = {}) =>
  new File(
    [
      JSON.stringify({
        format: "kaiord-backup",
        version: 1,
        manifest: {
          schemaVersion: 40,
          deviceId: "dev-b",
          exportedAt: "2026-10-10T08:00:00.000Z",
          encrypted: false,
        },
        tables: {
          profiles,
          workouts: [
            {
              id: "w-1",
              profileId: "p-ana",
              updatedAt: "2026-10-10T08:00:00.000Z",
            },
          ],
        },
        tombstones: [],
        nutrition: { intakeEntries: [], intakePresets: [], energyTargets: [] },
        ...extra,
      }),
    ],
    "kaiord-backup-2026-10-10.json",
    { type: "application/json" }
  );

const ana = { id: "p-ana", name: "Ana", origin: "local" };
const bea = { id: "p-bea", name: "Bea", origin: "local" };

const upload = async (file: File) =>
  userEvent.upload(screen.getByLabelText("Backup file"), file);

describe("BackupImportSection", () => {
  it("should import a backup file and summarize what it restored", async () => {
    // Arrange
    const device = freshDevice();
    renderWithProviders(<BackupImportSection />, { snapshotPort: device.port });

    // Act
    await upload(backupFile([ana]));

    // Assert
    expect(
      await screen.findByText(
        "Backup imported: 2 added, 0 updated, 0 deleted after the backup (not restored)."
      )
    ).toBeInTheDocument();
    expect(device.state.tables.profiles).toEqual([ana]);
  });

  it("should say so when the file is not a Kaiord backup", async () => {
    // Arrange
    const device = freshDevice();
    renderWithProviders(<BackupImportSection />, { snapshotPort: device.port });

    // Act
    await upload(new File(["{}"], "notes.json", { type: "application/json" }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This file is not a Kaiord backup."
    );
  });

  it("should say so when the backup comes from a newer version of the app", async () => {
    // Arrange
    const device = freshDevice();
    renderWithProviders(<BackupImportSection />, { snapshotPort: device.port });

    // Act
    await upload(backupFile([ana], { version: 2 }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This backup was made by a newer version of Kaiord. Update the app and try again."
    );
  });

  it("should ask which profile to join and import into the one picked", async () => {
    // Arrange
    const device = freshDevice();
    renderWithProviders(<BackupImportSection />, { snapshotPort: device.port });
    await upload(backupFile([ana, bea]));

    // Act
    await userEvent.click(await screen.findByRole("radio", { name: "Bea" }));
    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    // Assert
    expect(await screen.findByText(/^Backup imported:/)).toBeInTheDocument();
    expect(device.state.tables.meta).toEqual([
      { key: "activeProfileId", value: "p-bea" },
    ]);
  });
});
