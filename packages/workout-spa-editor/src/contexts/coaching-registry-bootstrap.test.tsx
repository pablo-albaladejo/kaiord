import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingSource } from "../types/coaching-source";

const mockSource: CoachingSource = {
  id: "train2go",
  label: "Train2Go",
  badge: "T2G",
  available: true,
  connected: false,
  loading: false,
  error: null,
  activities: [],
  sync: vi.fn(),
  expand: vi.fn(),
  connect: vi.fn(),
};

vi.mock("../adapters/train2go/use-train2go-source", () => ({
  useTrain2GoSource: () => mockSource,
}));

vi.mock("./coaching-registry-context", () => ({
  CoachingRegistryProvider: ({
    children,
    sources,
  }: {
    children: React.ReactNode;
    sources: CoachingSource[];
  }) => (
    <div data-testid="provider" data-sources={sources.length}>
      {children}
    </div>
  ),
}));

import { CoachingRegistryBootstrap } from "./coaching-registry-bootstrap";

describe("CoachingRegistryBootstrap", () => {
  it("renders children inside the provider", () => {
    render(
      <CoachingRegistryBootstrap>
        <span>Child content</span>
      </CoachingRegistryBootstrap>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("passes sources to the provider", () => {
    render(
      <CoachingRegistryBootstrap>
        <span>Test</span>
      </CoachingRegistryBootstrap>
    );

    const provider = screen.getByTestId("provider");
    expect(provider).toHaveAttribute("data-sources", "1");
  });
});
