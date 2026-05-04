import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardShell } from "./CardShell";

describe("CardShell", () => {
  it("should render title and metadata slots", () => {
    render(
      <CardShell
        borderClass="border-amber-600"
        titleRow={<span>Z2/Z3 técnica</span>}
        metadataRow={<span>45 min</span>}
        testId="shell-1"
      />
    );

    expect(screen.getByTestId("shell-1")).toBeInTheDocument();
    expect(screen.getByText("Z2/Z3 técnica")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("should apply the lateral border class", () => {
    render(
      <CardShell
        borderClass="border-emerald-600"
        titleRow={<span>x</span>}
        metadataRow={<span>y</span>}
        testId="shell-2"
      />
    );

    const button = screen.getByTestId("shell-2");
    expect(button.className).toContain("border-l-4");
    expect(button.className).toContain("border-emerald-600");
  });

  it("should use line-clamp-2 on the title row", () => {
    render(
      <CardShell
        borderClass="border-amber-600"
        titleRow={<span>title</span>}
        metadataRow={<span>m</span>}
        testId="shell-3"
      />
    );

    const button = screen.getByTestId("shell-3");
    const titleContainer = button.querySelector("div");
    expect(titleContainer?.className).toContain("line-clamp-2");
  });

  it("should render origin chip when provided", () => {
    render(
      <CardShell
        borderClass="border-amber-600"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        originChip="T2G"
        testId="shell-4"
      />
    );

    expect(screen.getByText("· T2G")).toBeInTheDocument();
  });

  it("should not render origin chip when omitted", () => {
    render(
      <CardShell
        borderClass="border-amber-600"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        testId="shell-5"
      />
    );

    expect(screen.queryByText(/^·/)).not.toBeInTheDocument();
  });

  it("should attach aria-label to the button root", () => {
    render(
      <CardShell
        borderClass="border-amber-600"
        ariaLabel="Matched session: 92% compliance"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        testId="shell-6"
      />
    );

    expect(
      screen.getByRole("button", { name: /matched session/i })
    ).toBeInTheDocument();
  });

  it("should render secondary row when provided (matched-card pattern)", () => {
    render(
      <CardShell
        borderClass="border-emerald-600"
        titleRow={<span>x</span>}
        metadataRow={<span>Plan · 45 min</span>}
        secondaryRow={<span>Actual · 42 min</span>}
        testId="shell-7"
      />
    );

    expect(screen.getByText("Plan · 45 min")).toBeInTheDocument();
    expect(screen.getByText("Actual · 42 min")).toBeInTheDocument();
  });
});
