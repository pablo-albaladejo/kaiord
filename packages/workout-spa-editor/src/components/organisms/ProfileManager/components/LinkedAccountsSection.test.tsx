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
let mockSupportsZones = true;

vi.mock("../../../../hooks/use-train2go-supports-zones", () => ({
  useTrain2GoSupportsZones: () => mockSupportsZones,
}));

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
    expand: vi.fn(async () => undefined),
    connect: mockConnect,
    zonesSync: {
      pending: null,
      runSync: vi.fn(async () => undefined),
      confirmDecisions: vi.fn(async () => undefined),
      cancel: vi.fn(),
    },
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
    render(wrap(<LinkedAccountsSection profile={makeProfile()} />));

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByText(/Connect Train2Go/)).toBeInTheDocument();
    expect(screen.queryByText("Disconnect")).not.toBeInTheDocument();
  });

  it("should show Disconnect button + externalUserName when source is linked", () => {
    render(
      wrap(
        <LinkedAccountsSection
          profile={makeProfile({ linkedAccounts: [T2G_LINK] })}
        />
      )
    );

    expect(screen.getByText("Pablo")).toBeInTheDocument();
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
    expect(screen.queryByText(/Connect Train2Go/)).not.toBeInTheDocument();
  });

  it("invokes useTrain2GoSource.connect with the row's profileId on click", async () => {
    render(wrap(<LinkedAccountsSection profile={makeProfile()} />));

    await userEvent.click(screen.getByText(/Connect Train2Go/));

    expect(mockConnect).toHaveBeenCalledWith("p1");
  });

  it("should hide the Sync zones toggle when bridge does NOT advertise read:training-zones", () => {
    mockSupportsZones = false;
    render(
      wrap(
        <LinkedAccountsSection
          profile={makeProfile({ linkedAccounts: [T2G_LINK] })}
        />
      )
    );

    expect(
      screen.queryByTestId("sync-zones-toggle-train2go")
    ).not.toBeInTheDocument();
    mockSupportsZones = true;
  });

  it("should render the Sync zones toggle when linked AND bridge advertises capability", () => {
    render(
      wrap(
        <LinkedAccountsSection
          profile={makeProfile({ linkedAccounts: [T2G_LINK] })}
        />
      )
    );

    expect(
      screen.getByTestId("sync-zones-toggle-train2go")
    ).toBeInTheDocument();
  });

  it("should persist the toggle state to the profile when clicked", async () => {
    const persistence = createInMemoryPersistence();
    const profile = {
      ...makeProfile({ linkedAccounts: [T2G_LINK] }),
    };
    await persistence.profiles.put(profile);

    render(
      <PersistenceProvider persistence={persistence}>
        <ToastContextProvider>
          <LinkedAccountsSection profile={profile} />
        </ToastContextProvider>
      </PersistenceProvider>
    );

    const toggle = screen.getByTestId(
      "sync-zones-toggle-train2go"
    ) as HTMLLabelElement;
    const checkbox = toggle.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    await userEvent.click(checkbox);

    const after = await persistence.profiles.getById("p1");
    expect(
      after?.linkedAccounts.find((a) => a.source === "train2go")?.syncZones
    ).toBe(true);
  });
});
