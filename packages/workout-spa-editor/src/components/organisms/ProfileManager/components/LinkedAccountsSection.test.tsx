import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../../../../types/coaching-account";
import type { Profile } from "../../../../types/profile";

const mockConnect = vi.fn(async () => undefined);

vi.mock("../../../../adapters/train2go/use-train2go-source", () => ({
  useTrain2GoSource: () => ({
    id: "train2go",
    label: "Train2Go",
    badge: "T2G",
    available: true,
    connected: false,
    loading: false,
    error: null,
    activities: [],
    sync: vi.fn(async () => undefined),
    expand: vi.fn(async () => ({ ok: true as const, activityCount: 0 })),
    connect: mockConnect,
  }),
}));

import { LinkedAccountsSection } from "./LinkedAccountsSection";

const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "p1",
  name: "Test Profile",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
  ...overrides,
});

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    <ToastContextProvider>{children}</ToastContextProvider>
  </PersistenceProvider>
);

describe("LinkedAccountsSection", () => {
  it("should show Connect button when source is not linked", () => {
    // Arrange

    // Act

    render(wrap(<LinkedAccountsSection profile={makeProfile()} />));

    // Assert

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByText(/Connect Train2Go/)).toBeInTheDocument();
    expect(screen.queryByText("Disconnect")).not.toBeInTheDocument();
  });

  it("should show Disconnect button + externalUserName when source is linked", () => {
    // Arrange

    // Act

    render(
      wrap(
        <LinkedAccountsSection
          profile={makeProfile({ linkedAccounts: [T2G_LINK] })}
        />
      )
    );

    // Assert

    expect(screen.getByText("Pablo")).toBeInTheDocument();
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
    expect(screen.queryByText(/Connect Train2Go/)).not.toBeInTheDocument();
  });

  it("should invoke useTrain2GoSource.connect with the row's profileId on click", async () => {
    // Arrange

    render(wrap(<LinkedAccountsSection profile={makeProfile()} />));

    // Act

    await userEvent.click(screen.getByText(/Connect Train2Go/));

    // Assert

    expect(mockConnect).toHaveBeenCalledWith("p1");
  });
});
