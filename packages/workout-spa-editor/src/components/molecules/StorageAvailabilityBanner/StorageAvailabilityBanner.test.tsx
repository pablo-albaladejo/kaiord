import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StorageAvailabilityBanner } from "./StorageAvailabilityBanner";

const STORAGE_UNAVAILABLE_MESSAGE =
  "Storage unavailable — changes in this session won't be saved";

describe("StorageAvailabilityBanner", () => {
  it("renders the spec-exact message when status is 'failed'", () => {
    render(<StorageAvailabilityBanner status="failed" />);

    expect(screen.getByText(STORAGE_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
  });

  it("uses role='alert' so assistive tech announces it", () => {
    render(<StorageAvailabilityBanner status="failed" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      STORAGE_UNAVAILABLE_MESSAGE
    );
  });

  it("renders nothing when status is 'checking'", () => {
    const { container } = render(
      <StorageAvailabilityBanner status="checking" />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when status is 'ok'", () => {
    const { container } = render(<StorageAvailabilityBanner status="ok" />);

    expect(container.firstChild).toBeNull();
  });
});
