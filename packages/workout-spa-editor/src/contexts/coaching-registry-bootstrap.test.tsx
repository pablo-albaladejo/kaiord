import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingSourceFactory } from "../types/coaching-source";

vi.mock("../adapters/train2go/use-train2go-source", () => ({
  useTrain2GoSource: vi.fn(() => ({
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
    connect: vi.fn(async () => undefined),
  })),
}));

vi.mock("./coaching-registry-context", () => ({
  CoachingRegistryProvider: ({
    children,
    factories,
  }: {
    children: ReactNode;
    factories: CoachingSourceFactory[];
  }) => (
    <div data-testid="provider" data-factories={factories.length}>
      {children}
    </div>
  ),
}));

import { CoachingRegistryBootstrap } from "./coaching-registry-bootstrap";

describe("CoachingRegistryBootstrap", () => {
  it("should wrap children in a provider wired with the source factories", () => {
    // Arrange

    // Act

    render(
      <CoachingRegistryBootstrap>
        <span>Child content</span>
      </CoachingRegistryBootstrap>
    );

    // Assert

    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(screen.getByTestId("provider")).toHaveAttribute(
      "data-factories",
      "1"
    );
  });
});
