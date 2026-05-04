import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StorageAvailabilityBanner } from "./StorageAvailabilityBanner";

const STORAGE_UNAVAILABLE_MESSAGE =
  "Storage unavailable — changes in this session won't be saved";

describe("StorageAvailabilityBanner", () => {
  it("should render the spec-exact message when status is 'failed'", () => {
    // Arrange

    // Act

    render(<StorageAvailabilityBanner status="failed" />);

    // Assert

    expect(screen.getByText(STORAGE_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
  });

  it("should use role='alert' so assistive tech announces it", () => {
    // Arrange

    // Act

    render(<StorageAvailabilityBanner status="failed" />);

    // Assert

    expect(screen.getByRole("alert")).toHaveTextContent(
      STORAGE_UNAVAILABLE_MESSAGE
    );
  });

  it("should render nothing when status is 'checking'", () => {
    // Arrange

    // Act

    const { container } = render(
      <StorageAvailabilityBanner status="checking" />
    );

    // Assert

    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when status is 'ok'", () => {
    // Arrange

    // Act

    const { container } = render(<StorageAvailabilityBanner status="ok" />);

    // Assert

    expect(container.firstChild).toBeNull();
  });
});
