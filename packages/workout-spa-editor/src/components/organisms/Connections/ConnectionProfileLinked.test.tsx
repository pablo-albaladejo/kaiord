import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../types/profile";
import { ConnectionProfileLinked } from "./ConnectionProfileLinked";

const toasts = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));

vi.mock("../../../contexts/ToastContext", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useToastContext: () => ({ ...toasts, toasts: [], dismiss: vi.fn() }),
}));

const link = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const profile: Profile = {
  id: "p1",
  name: "Ana",
  sportZones: {},
  linkedAccounts: [link],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

describe("ConnectionProfileLinked", () => {
  it("should report a failed unlink and keep the button usable", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    vi.spyOn(persistence.profiles, "put").mockRejectedValue(new Error("disk"));
    const user = userEvent.setup();
    renderWithProviders(
      <ConnectionProfileLinked profile={profile} link={link} />,
      { persistence }
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Unlink" }));

    // Assert
    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        "Could not unlink from this athlete"
      );
    });
    expect(toasts.info).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Unlink" })).toBeEnabled();
  });
});
