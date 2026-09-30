import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionProfileLink } from "./ConnectionProfileLink";

const state = vi.hoisted(() => ({
  linkedSources: [] as string[],
  connected: true,
  loading: false,
  error: null as string | null,
  connect: vi.fn(async () => undefined),
  sourcesMounted: vi.fn(),
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: {
      linkedAccounts: state.linkedSources.map((source) => ({ source })),
    },
  }),
}));
vi.mock("../../../hooks/use-coaching-activities", () => ({
  useCoachingActivities: () => {
    state.sourcesMounted();
    return {
      syncSources: [
        {
          id: "train2go",
          linked: false,
          connected: state.connected,
          loading: state.loading,
          error: state.error,
          connect: state.connect,
        },
      ],
    };
  },
}));

const renderLink = () =>
  render(<ConnectionProfileLink sourceId="train2go" name="Train2Go" />);

describe("ConnectionProfileLink", () => {
  beforeEach(() => {
    state.linkedSources = [];
    state.connected = true;
    state.loading = false;
    state.error = null;
    vi.clearAllMocks();
  });

  it("should offer to link a signed-in source to the active profile", async () => {
    // Arrange
    renderLink();

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Link to this profile" })
    );

    // Assert
    expect(
      screen.getByTestId("connection-profile-link-train2go")
    ).toHaveTextContent("signed in on this browser but not linked");
    expect(state.connect).toHaveBeenCalledOnce();
  });

  it("should ask for a sign-in first when the source has no session", () => {
    // Arrange
    state.connected = false;

    // Act
    renderLink();

    // Assert
    const notice = screen.getByTestId("connection-profile-link-train2go");
    expect(notice).toHaveTextContent("Sign in to Train2Go in this browser");
    expect(notice).not.toHaveTextContent("signed in on this browser");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should disable the link while it is in flight", () => {
    // Arrange
    state.loading = true;

    // Act
    renderLink();

    // Assert
    expect(screen.getByRole("button", { name: "Linking…" })).toBeDisabled();
  });

  it("should show the source's error", () => {
    // Arrange
    state.error = "Update your Kaiord Train2Go Bridge extension";

    // Act
    renderLink();

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Update your Kaiord Train2Go Bridge extension"
    );
  });

  it("should say nothing and mount no coaching source once the profile is linked", () => {
    // Arrange
    state.linkedSources = ["train2go"];

    // Act
    renderLink();

    // Assert
    expect(
      screen.queryByTestId("connection-profile-link-train2go")
    ).not.toBeInTheDocument();
    expect(state.sourcesMounted).not.toHaveBeenCalled();
  });
});
