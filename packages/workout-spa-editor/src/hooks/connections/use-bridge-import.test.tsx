import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { bridgeImporterFor } from "../bridge-import/bridge-importers";
import { resetImportCooldowns } from "./import-cooldown";
import { useBridgeImport } from "./use-bridge-import";

vi.mock("../../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: vi.fn() },
}));
vi.mock("../bridge-import/bridge-importers", () => ({
  bridgeImporterFor: vi.fn(),
}));

const PROFILE_ID = "p1";
const persistence = createInMemoryPersistence();
const wrapper = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={persistence}>
    {children}
  </PersistenceProvider>
);

const mountFor = (bridgeId: string | null) =>
  renderHook(() => useBridgeImport(bridgeId, PROFILE_ID), { wrapper });

describe("useBridgeImport", () => {
  beforeEach(() => {
    vi.mocked(bridgeDiscovery.getExtensionId).mockReturnValue("ext-1");
    vi.mocked(bridgeImporterFor).mockReset();
    resetImportCooldowns();
  });

  it("should report a bridge with no importer as unsupported", () => {
    // Arrange
    // train2go's import is week-scoped, so it has no entry and its card must
    // render no button at all.
    vi.mocked(bridgeImporterFor).mockReturnValue(undefined);

    // Act
    const { result } = mountFor("train2go-bridge");

    // Assert
    expect(result.current.supported).toBe(false);
  });

  it("should run the importer once and report completion", async () => {
    // Arrange
    const importer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    const { result } = mountFor("garmin-bridge");

    // Act
    act(() => result.current.run());

    // Assert
    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(importer).toHaveBeenCalledWith(persistence, "ext-1", PROFILE_ID);
  });

  it("should refuse a second pull inside the cooldown window", async () => {
    // Arrange
    // Probes and imports bypass BRIDGE_QUEUE, so nothing downstream throttles
    // a held button.
    const importer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    const { result } = mountFor("garmin-bridge");
    act(() => result.current.run());
    await waitFor(() => expect(result.current.status).toBe("done"));

    // Act
    act(() => result.current.run());

    // Assert
    expect(result.current.status).toBe("cooldown");
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("should report a failed pull without leaving the button stuck", async () => {
    // Arrange
    const importer = vi.fn().mockRejectedValue(new Error("offline"));
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    const { result } = mountFor("garmin-bridge");

    // Act
    act(() => result.current.run());

    // Assert
    await waitFor(() => expect(result.current.status).toBe("failed"));
  });

  it("should not call the importer when the extension has vanished", () => {
    // Arrange
    const importer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    vi.mocked(bridgeDiscovery.getExtensionId).mockReturnValue(null);
    const { result } = mountFor("garmin-bridge");

    // Act
    act(() => result.current.run());

    // Assert
    expect(importer).not.toHaveBeenCalled();
    expect(result.current.status).toBe("failed");
  });
  it("should keep the cooldown when the card is unmounted and mounted again", async () => {
    // Arrange
    // The panel holding the button collapses on close, so a ref inside it
    // would put "no cooldown" one click away.
    const importer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    const first = mountFor("garmin-bridge");
    act(() => first.result.current.run());
    await waitFor(() => expect(first.result.current.status).toBe("done"));
    first.unmount();

    // Act
    const second = mountFor("garmin-bridge");
    act(() => second.result.current.run());

    // Assert
    expect(second.result.current.status).toBe("cooldown");
    expect(importer).toHaveBeenCalledTimes(1);
  });
  it("should not start a second import while the first is still in flight", async () => {
    // Arrange
    // The panel holding the button unmounts when the card collapses, so a
    // guard living in hook state is gone before the first pull resolves —
    // and the cooldown is only stamped on settle, so it is not stamped yet.
    let release: (() => void) | undefined;
    const importer = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      })
    );
    vi.mocked(bridgeImporterFor).mockReturnValue(importer);
    const first = mountFor("tanita-bridge");
    act(() => first.result.current.run());
    first.unmount();

    // Act
    const second = mountFor("tanita-bridge");
    act(() => second.result.current.run());

    // Assert
    expect(importer).toHaveBeenCalledTimes(1);
    expect(second.result.current.status).toBe("running");
    await act(async () => {
      release?.();
    });
    await waitFor(() => expect(second.result.current.status).toBe("done"));
  });
});
