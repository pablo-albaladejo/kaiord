import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileChoice } from "../../../application/sync/reconcile-auto-profile";
import { ProfileChoiceBanner } from "./ProfileChoiceBanner";

const sync = vi.hoisted(() => ({
  profileChoice: null as ProfileChoice[] | null,
  chooseProfile: vi.fn(),
}));

vi.mock("../../../contexts/sync-context", () => ({
  useSync: () => sync,
}));

describe("ProfileChoiceBanner", () => {
  beforeEach(() => {
    sync.profileChoice = null;
    sync.chooseProfile.mockReset().mockResolvedValue("synced");
  });

  it("should render nothing when sync needs no choice", () => {
    // Arrange
    sync.profileChoice = null;

    // Act
    render(<ProfileChoiceBanner />);

    // Assert
    expect(screen.queryByTestId("profile-choice-banner")).toBeNull();
  });

  it("should offer one button per remote profile and pass the picked id to chooseProfile", async () => {
    // Arrange
    sync.profileChoice = [
      { id: "r-1", name: "Road" },
      { id: "r-2", name: "Trail" },
    ];
    render(<ProfileChoiceBanner />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Trail" }));

    // Assert
    expect(screen.getByRole("button", { name: "Road" })).toBeInTheDocument();
    expect(sync.chooseProfile).toHaveBeenCalledWith("r-2");
  });
});
