import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AvatarRing } from "./AvatarRing";

describe("AvatarRing", () => {
  it("should render the initials", () => {
    // Arrange

    // Act

    render(<AvatarRing initials="JD" />);

    // Assert

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should apply default size 64 via style", () => {
    // Arrange

    const { container } = render(<AvatarRing initials="AB" />);

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    expect(root.style.width).toBe("64px");
    expect(root.style.height).toBe("64px");
  });

  it("should apply a custom size", () => {
    // Arrange

    const { container } = render(<AvatarRing initials="XY" size={96} />);

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    expect(root.style.width).toBe("96px");
    expect(root.style.height).toBe("96px");
  });

  it("should apply custom className", () => {
    // Arrange

    const { container } = render(
      <AvatarRing initials="TT" className="extra-class" />
    );

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    expect(root.classList.contains("extra-class")).toBe(true);
  });
});
