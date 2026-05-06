/**
 * CardThumbnail tests.
 *
 * Renders the workout's thumbnail image when one is provided; renders
 * nothing when thumbnailData is absent. Alt text is derived from the
 * workout name.
 */

import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils";
import { CardThumbnail } from "./CardThumbnail";

describe("CardThumbnail", () => {
  it("should render nothing when thumbnailData is undefined", () => {
    // Arrange

    // Act
    const { container } = render(<CardThumbnail workoutName="Ride" />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should render an img with the provided thumbnail data and a derived alt", () => {
    // Arrange
    const dataUri = "data:image/png;base64,AAAA";

    // Act
    render(<CardThumbnail workoutName="Tempo Ride" thumbnailData={dataUri} />);

    // Assert
    const img = screen.getByRole("img", { name: "Tempo Ride preview" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", dataUri);
  });

  it("should render nothing when thumbnailData is an empty string", () => {
    // Arrange

    // Act
    const { container } = render(
      <CardThumbnail workoutName="Ride" thumbnailData="" />
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
