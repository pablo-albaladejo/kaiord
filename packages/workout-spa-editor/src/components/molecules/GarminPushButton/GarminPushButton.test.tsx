import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../types/integration-policy";
import { GarminPushButton } from "./GarminPushButton";

const mockState = {
  extensionInstalled: false,
  sessionActive: false,
  pushing: { status: "idle" as const },
  lastError: null as string | null,
  detectExtension: vi.fn(),
  pushWorkout: vi.fn(),
  listWorkouts: vi.fn(),
  setPushing: vi.fn(),
};

let mockPolicies: IntegrationPolicy[] = [];

vi.mock("../../../contexts", () => ({
  useGarminBridge: () => ({ ...mockState }),
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
}));

vi.mock("dexie-react-hooks", () => ({
  // Synchronous useLiveQuery test double — unwraps thenables that have already
  // resolved by attaching a microtask-immediate .then handler. For sync-mocked
  // use cases (see resolveExportPolicies mock below) this returns the resolved
  // value; for pending promises it returns undefined, matching the real hook's
  // initial render state.
  useLiveQuery: (fn: () => unknown) => {
    let resolved: unknown;
    try {
      const value = fn();
      if (value !== null && typeof value === "object" && "then" in value) {
        (value as Promise<unknown>).then((v) => {
          resolved = v;
        });
        return resolved;
      }
      return value;
    } catch {
      return undefined;
    }
  },
}));

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: { table: () => ({ get: async () => undefined }) },
}));

vi.mock("../../../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));

vi.mock(
  "../../../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    // Synchronous return so the useLiveQuery mock sees a plain array (not a
    // Promise) and renders the policy-gated UI on the first pass.
    resolveExportPolicies: () => mockPolicies,
  })
);

vi.mock("wouter", () => ({
  useParams: () => ({ id: "workout-1" }),
}));

const ENABLED_POLICY: IntegrationPolicy = {
  id: "00000000-0000-0000-0000-000000000001",
  profileId: "p1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
};

const DISABLED_POLICY: IntegrationPolicy = {
  ...ENABLED_POLICY,
  enabled: false,
};

describe("GarminPushButton", () => {
  beforeEach(() => {
    mockState.extensionInstalled = false;
    mockState.sessionActive = false;
    mockState.pushing = { status: "idle" };
    mockState.lastError = null;
    mockPolicies = [];
  });

  it("should render nothing when extension is not installed", () => {
    // Arrange

    // Act

    const { container } = render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(container.innerHTML).toBe("");
  });

  it("should render the push button when bridge is installed AND a workout export policy is enabled", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [ENABLED_POLICY];

    // Act

    render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(screen.getByText("Send to Garmin")).toBeInTheDocument();
  });

  it("should NOT render when bridge is installed but no workout export policy exists", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [];

    // Act

    const { container } = render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(container.innerHTML).toBe("");
  });

  it("should NOT render when policy exists but bridge is not installed", () => {
    // Arrange

    mockState.extensionInstalled = false;
    mockPolicies = [ENABLED_POLICY];

    // Act

    const { container } = render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(container.innerHTML).toBe("");
  });

  it("should NOT render when policy exists but is disabled", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [DISABLED_POLICY];

    // Act

    const { container } = render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(container.innerHTML).toBe("");
  });

  it("should show disabled button when no session", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = false;
    mockPolicies = [ENABLED_POLICY];

    render(<GarminPushButton profileId="p1" />);

    // Act

    const button = screen.getByRole("button");

    // Assert

    expect(button).toBeDisabled();
    expect(button.textContent).toContain("Garmin (no session)");
  });

  it("should show send button when session active", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [ENABLED_POLICY];

    render(<GarminPushButton profileId="p1" />);

    // Act

    const button = screen.getByRole("button");

    // Assert

    expect(button).not.toBeDisabled();
    expect(button.textContent).toContain("Send to Garmin");
  });

  it("should show success feedback", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "success" };
    mockPolicies = [ENABLED_POLICY];

    // Act

    render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(screen.getByText("Sent to Garmin")).toBeInTheDocument();
  });

  it("should show error feedback", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "error", message: "Push failed" };
    mockPolicies = [ENABLED_POLICY];

    // Act

    render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(screen.getByText("Push failed")).toBeInTheDocument();
  });

  it("should show the push error cause even when a 401/403 redetect flipped the session to inactive (not a silent failure)", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = false;
    mockState.pushing = { status: "error", message: "Push failed: 403" };
    mockPolicies = [ENABLED_POLICY];

    // Act

    render(<GarminPushButton profileId="p1" />);

    // Assert

    expect(screen.getByText("Push failed: 403")).toBeInTheDocument();
    expect(screen.getByText("Garmin (no session)")).toBeInTheDocument();
  });
});
