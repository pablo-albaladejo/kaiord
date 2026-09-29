import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionProfileLink } from "./ConnectionProfileLink";

const state = vi.hoisted(() => ({
  linked: false,
  connect: vi.fn(async () => undefined),
}));

vi.mock("../../../hooks/use-coaching-activities", () => ({
  useCoachingActivities: () => ({
    syncSources: [
      { id: "train2go", linked: state.linked, connect: state.connect },
    ],
  }),
}));

describe("ConnectionProfileLink", () => {
  beforeEach(() => {
    state.linked = false;
    vi.clearAllMocks();
  });

  it("should offer to link a signed-in source to the active profile", async () => {
    // Arrange
    render(<ConnectionProfileLink sourceId="train2go" name="Train2Go" />);

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Link to this profile" })
    );

    // Assert
    expect(
      screen.getByTestId("connection-profile-link-train2go")
    ).toHaveTextContent("not linked to this athlete profile");
    expect(state.connect).toHaveBeenCalledOnce();
  });

  it("should say nothing once the profile is linked", () => {
    // Arrange
    state.linked = true;

    // Act
    render(<ConnectionProfileLink sourceId="train2go" name="Train2Go" />);

    // Assert
    expect(
      screen.queryByTestId("connection-profile-link-train2go")
    ).not.toBeInTheDocument();
  });
});
