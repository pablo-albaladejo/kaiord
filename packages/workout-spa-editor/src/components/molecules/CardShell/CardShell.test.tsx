import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardShell } from "./CardShell";

describe("CardShell", () => {
  it("should render title and metadata slots", () => {
    // Arrange

    // Act

    render(
      <CardShell
        borderClass="border-zone-4"
        titleRow={<span>Z2/Z3 técnica</span>}
        metadataRow={<span>45 min</span>}
        testId="shell-1"
      />
    );

    // Assert

    expect(screen.getByTestId("shell-1")).toBeInTheDocument();
    expect(screen.getByText("Z2/Z3 técnica")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("should apply the lateral border class", () => {
    // Arrange

    render(
      <CardShell
        borderClass="border-zone-2"
        titleRow={<span>x</span>}
        metadataRow={<span>y</span>}
        testId="shell-2"
      />
    );

    // Act

    const button = screen.getByTestId("shell-2");

    // Assert

    expect(button.className).toContain("border-l-4");
    expect(button.className).toContain("border-zone-2");
  });

  it("should keep the title row clamp-free so flex survives the cascade", () => {
    // Arrange
    // line-clamp-* sets display:-webkit-box, which collides with this row's
    // display:flex — only one wins the cascade. The clamp belongs on the
    // title span each variant passes in, never on the row itself.
    render(
      <CardShell
        borderClass="border-zone-4"
        titleRow={<span>title</span>}
        metadataRow={<span>m</span>}
        testId="shell-3"
      />
    );

    const button = screen.getByTestId("shell-3");

    // Act

    const titleContainer = button.querySelector("div");

    // Assert

    expect(titleContainer?.className).toContain("flex");
    expect(titleContainer?.className).not.toContain("line-clamp");
  });

  it("should render origin chip when provided", () => {
    // Arrange

    // Act

    render(
      <CardShell
        borderClass="border-zone-4"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        originChip="T2G"
        testId="shell-4"
      />
    );

    // Assert

    expect(screen.getByText("· T2G")).toBeInTheDocument();
  });

  it("should not render origin chip when omitted", () => {
    // Arrange

    // Act

    render(
      <CardShell
        borderClass="border-zone-4"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        testId="shell-5"
      />
    );

    // Assert

    expect(screen.queryByText(/^·/)).not.toBeInTheDocument();
  });

  it("should attach aria-label to the button root", () => {
    // Arrange

    // Act

    render(
      <CardShell
        borderClass="border-zone-4"
        ariaLabel="Matched session: 92% compliance"
        titleRow={<span>x</span>}
        metadataRow={<span>m</span>}
        testId="shell-6"
      />
    );

    // Assert

    expect(
      screen.getByRole("button", { name: /matched session/i })
    ).toBeInTheDocument();
  });

  it("should render secondary row when provided (matched-card pattern)", () => {
    // Arrange

    // Act

    render(
      <CardShell
        borderClass="border-zone-2"
        titleRow={<span>x</span>}
        metadataRow={<span>Plan · 45 min</span>}
        secondaryRow={<span>Actual · 42 min</span>}
        testId="shell-7"
      />
    );

    // Assert

    expect(screen.getByText("Plan · 45 min")).toBeInTheDocument();
    expect(screen.getByText("Actual · 42 min")).toBeInTheDocument();
  });
});
