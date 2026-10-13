import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { SnapshotPort } from "../../../ports/snapshot-port";
import {
  render,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../test-utils";
import { createInMemorySnapshotPort } from "../../../test-utils/in-memory-snapshot-port";
import { WipeAllDataDialog } from "./WipeAllDataDialog";
import { WipeAllDataSection } from "./WipeAllDataSection";

const device = vi.hoisted(() => ({
  clearDeviceStorage: vi.fn(),
  reloadToFirstRun: vi.fn(),
}));

vi.mock("../../../lib/wipe-device", () => device);

const locale = vi.hoisted(() => ({ value: "en" }));

vi.mock("../../../i18n/LocaleProvider", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useActiveLocale: () => locale.value,
}));

const seeded = () => {
  const state = {
    schemaVersion: 37,
    tables: {
      profiles: [{ id: "p-1", name: "Pablo" }] as unknown[],
      workouts: [{ id: "w-1", profileId: "p-1" }] as unknown[],
    },
    tombstones: [],
  };
  return { state, port: createInMemorySnapshotPort(state) };
};

const openDialog = async (snapshotPort: SnapshotPort) => {
  const user = userEvent.setup();
  renderWithProviders(<WipeAllDataSection />, { snapshotPort });
  await user.click(screen.getByRole("button", { name: "Delete all my data" }));
  return user;
};

describe("WipeAllDataSection", () => {
  afterEach(() => {
    device.clearDeviceStorage.mockReset();
    device.reloadToFirstRun.mockReset();
  });

  it("should keep the delete button disabled until the confirmation word is typed", async () => {
    // Arrange
    const { port } = seeded();
    const user = await openDialog(port);

    // Act
    await user.type(screen.getByTestId("wipe-confirm-input"), "DELET");

    // Assert
    expect(screen.getByTestId("wipe-confirm")).toBeDisabled();
    await user.type(screen.getByTestId("wipe-confirm-input"), "E");
    expect(screen.getByTestId("wipe-confirm")).toBeEnabled();
  });

  it("should tell the reader the Drive copy is kept", async () => {
    // Arrange
    const { port } = seeded();

    // Act
    await openDialog(port);

    // Assert
    expect(screen.getByTestId("wipe-dialog")).toHaveTextContent(
      "Your copy in Google Drive is not deleted"
    );
  });

  it("should empty the database, clear device storage and reload into first run", async () => {
    // Arrange
    const { state, port } = seeded();
    const user = await openDialog(port);
    await user.type(screen.getByTestId("wipe-confirm-input"), "delete");

    // Act
    await user.click(screen.getByTestId("wipe-confirm"));

    // Assert
    await waitFor(() => expect(device.reloadToFirstRun).toHaveBeenCalled());
    expect(state.tables.profiles).toEqual([]);
    expect(state.tables.workouts).toEqual([]);
    expect(device.clearDeviceStorage).toHaveBeenCalledTimes(1);
  });

  it("should touch nothing when the dialog is cancelled", async () => {
    // Arrange
    const { state, port } = seeded();
    const user = await openDialog(port);
    await user.type(screen.getByTestId("wipe-confirm-input"), "DELETE");

    // Act
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(screen.queryByTestId("wipe-dialog")).not.toBeInTheDocument();
    expect(state.tables.workouts).toHaveLength(1);
    expect(device.clearDeviceStorage).not.toHaveBeenCalled();
    expect(device.reloadToFirstRun).not.toHaveBeenCalled();
  });

  it("should report a failed wipe and stay on the page", async () => {
    // Arrange
    const { port } = seeded();
    const failing = {
      ...port,
      clearAllTables: () => Promise.reject(new Error("quota")),
    };
    const user = await openDialog(failing);
    await user.type(screen.getByTestId("wipe-confirm-input"), "DELETE");

    // Act
    await user.click(screen.getByTestId("wipe-confirm"));

    // Assert
    expect(
      await screen.findByText(
        "Could not delete your data. Nothing was deleted; please retry."
      )
    ).toBeInTheDocument();
    expect(device.clearDeviceStorage).not.toHaveBeenCalled();
    expect(device.reloadToFirstRun).not.toHaveBeenCalled();
  });
});

describe("WipeAllDataDialog", () => {
  afterEach(async () => {
    locale.value = "en";
    await appI18n.changeLanguage("en");
  });

  it("should hold the delete while a sync is in flight", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <WipeAllDataDialog
        open
        syncing
        onConfirm={() => Promise.resolve()}
        onCancel={() => undefined}
      />
    );

    // Act
    await user.type(screen.getByTestId("wipe-confirm-input"), "DELETE");

    // Assert
    expect(screen.getByTestId("wipe-confirm")).toBeDisabled();
    expect(
      screen.getByText("Wait for the sync in progress to finish.")
    ).toBeInTheDocument();
  });

  it("should ask for the Spanish word in the Spanish UI", async () => {
    // Arrange
    locale.value = "es";
    await setActiveLocale("es");
    const user = userEvent.setup();
    render(
      <WipeAllDataDialog
        open
        syncing={false}
        onConfirm={() => Promise.resolve()}
        onCancel={() => undefined}
      />
    );

    // Act
    await user.type(screen.getByTestId("wipe-confirm-input"), "BORRAR");

    // Assert
    expect(screen.getByText("Escribe BORRAR para confirmar")).toBeVisible();
    expect(screen.getByTestId("wipe-confirm")).toBeEnabled();
  });
});
