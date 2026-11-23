import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../types/profile";
import { ConnectionProfileLink } from "./ConnectionProfileLink";

const state = vi.hoisted(() => ({
  linkedSources: [] as string[],
  connected: true,
  loading: false,
  error: null as "outdated" | null,
  connect: vi.fn(async () => undefined),
  sourcesMounted: vi.fn(),
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: {
      id: "p1",
      linkedAccounts: state.linkedSources.map((source) => ({
        source,
        externalUserId: "28035",
        externalUserName: "Pablo",
        linkedAt: "2026-04-28T10:00:00.000Z",
      })),
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

const LINKED_PROFILE: Profile = {
  id: "p1",
  name: "Ana",
  sportZones: {},
  linkedAccounts: [
    {
      source: "train2go",
      externalUserId: "28035",
      externalUserName: "Pablo",
      linkedAt: "2026-04-28T10:00:00.000Z",
    },
  ],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const renderLink = (
  canLink = true,
  persistence = createInMemoryPersistence()
) =>
  renderWithProviders(
    <ConnectionProfileLink
      sourceId="train2go"
      name="Train2Go"
      canLink={canLink}
    />,
    { persistence }
  );

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
      screen.getByRole("button", { name: "Link to this athlete" })
    );

    // Assert
    expect(
      screen.getByTestId("connection-profile-link-train2go")
    ).toHaveTextContent("signed in on this browser but not linked");
    expect(state.connect).toHaveBeenCalledOnce();
  });

  it("should leave a source with no session to its card's Connection notice", () => {
    // Arrange
    state.connected = false;

    // Act
    renderLink();

    // Assert
    // The card already shows the one notice and fix; a second sign-in line
    // here would word the same Connection twice.
    expect(
      screen.queryByTestId("connection-profile-link-train2go")
    ).not.toBeInTheDocument();
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

  it("should not word an outdated extension a second time beside the card's notice", () => {
    // Arrange
    state.error = "outdated";

    // Act
    renderLink();

    // Assert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/update/i)).not.toBeInTheDocument();
  });

  // P-07: the link used to be shown, and undone, only in the Profile
  // Manager's "Linked Accounts" tab. Connections is now its one home.
  it("should state the link and its athlete-wide scope once the profile is linked", () => {
    // Arrange
    state.linkedSources = ["train2go"];

    // Act
    renderLink();

    // Assert
    const notice = screen.getByTestId("connection-profile-linked-train2go");
    expect(notice).toHaveTextContent("Linked to this athlete as Pablo");
    expect(notice).toHaveTextContent("saved with the athlete");
    expect(
      screen.queryByTestId("connection-profile-link-train2go")
    ).not.toBeInTheDocument();
    expect(state.sourcesMounted).not.toHaveBeenCalled();
  });

  it("should unlink the source from the athlete", async () => {
    // Arrange
    state.linkedSources = ["train2go"];
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(LINKED_PROFILE);
    const user = userEvent.setup();
    renderLink(true, persistence);

    // Act
    await user.click(screen.getByRole("button", { name: "Unlink" }));

    // Assert
    await waitFor(async () => {
      const stored = await persistence.profiles.getById("p1");
      expect(stored?.linkedAccounts).toEqual([]);
    });
  });

  // The link outlives the extension: a profile linked on another device
  // still has to be undoable here, where the card cannot offer a new link.
  it("should keep the link visible where the card cannot offer linking", () => {
    // Arrange
    state.linkedSources = ["train2go"];

    // Act
    renderLink(false);

    // Assert
    expect(
      screen.getByTestId("connection-profile-linked-train2go")
    ).toBeInTheDocument();
  });

  it("should say nothing about an unlinked source the card cannot link", () => {
    // Arrange

    // Act
    renderLink(false);

    // Assert
    expect(
      screen.queryByTestId("connection-profile-link-train2go")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("connection-profile-linked-train2go")
    ).not.toBeInTheDocument();
    expect(state.sourcesMounted).not.toHaveBeenCalled();
  });
});
