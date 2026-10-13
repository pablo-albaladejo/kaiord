import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import { BRIDGE_DOCS_URL } from "../../../molecules/CalendarEmptyStates/first-run-steps";

const mockConnect = vi.fn(async () => undefined);
const errorSpy = vi.fn();

vi.mock("../../../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: errorSpy, success: vi.fn(), info: vi.fn() }),
}));

vi.mock("../../../../adapters/train2go/use-train2go-source", () => ({
  useTrain2GoSource: () => ({ connect: mockConnect }),
}));
vi.mock("../../../../hooks/use-discovered-bridges", () => ({
  useDiscoveredBridges: () => [],
}));

import { LinkedAccountsSection } from "./LinkedAccountsSection";

const profile: Profile = {
  id: "p1",
  name: "Test",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("LinkedAccountsSection without the Kaiord extension", () => {
  it("should say the extension is required and offer to install it", () => {
    // Arrange
    mockConnect.mockClear();

    // Act
    render(wrap(<LinkedAccountsSection profile={profile} />));

    // Assert
    expect(screen.getByText(/Requires the Kaiord extension/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Install Kaiord extension" })
    ).toHaveAttribute("href", BRIDGE_DOCS_URL);
  });

  it("should explain the failure instead of pretending to connect", async () => {
    // Arrange
    mockConnect.mockClear();
    errorSpy.mockClear();
    render(wrap(<LinkedAccountsSection profile={profile} />));

    // Act
    await userEvent.click(screen.getByText(/Connect Train2Go/));

    // Assert
    expect(errorSpy).toHaveBeenCalledWith(
      "The Kaiord extension is not installed in this browser. Install it to connect Train2Go."
    );
    expect(mockConnect).not.toHaveBeenCalled();
    expect(screen.queryByText("Connecting…")).not.toBeInTheDocument();
  });

  it("should render Connect as a primary action, not a danger one", () => {
    // Arrange

    // Act
    render(wrap(<LinkedAccountsSection profile={profile} />));

    // Assert
    const button = screen.getByRole("button", { name: /Connect Train2Go/ });
    expect(button.className).not.toContain("danger");
  });
});
