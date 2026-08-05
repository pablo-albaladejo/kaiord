import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ZONE_BG_CLASSES } from "../../../lib/zone-colors";
import { AvatarRing } from "./AvatarRing";

const ZONE_TOKEN = /var\(--zone-\d\)/g;

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

  it("should paint the ring with the zone ramp and no literal colour", () => {
    // Arrange

    const { container } = render(<AvatarRing initials="ZR" />);

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    const referenced = new Set(root.style.background.match(ZONE_TOKEN) ?? []);
    expect(referenced.size).toBe(ZONE_BG_CLASSES.length);
    expect(root.style.background).not.toMatch(/#[0-9a-fA-F]{3,6}/);
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
