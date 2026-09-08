import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { TrainingPeaksSentButton } from "./TrainingPeaksSentButton";

vi.mock("../../../i18n/use-translate", () => ({
  useTranslate: () => (key: string) => key,
}));

describe("TrainingPeaksSentButton", () => {
  it("should render under the shared send-to-trainingpeaks test id", () => {
    // Arrange
    render(<TrainingPeaksSentButton size="md" className="" />);

    // Act
    const button = screen.getByTestId("send-to-trainingpeaks-button");

    // Assert
    expect(button).toBeInTheDocument();
  });

  it("should be disabled, since the workout has already gone", () => {
    // Arrange
    render(<TrainingPeaksSentButton size="md" className="" />);

    // Act
    const button = screen.getByTestId("send-to-trainingpeaks-button");

    // Assert
    expect(button).toBeDisabled();
  });

  it("should state done in words rather than borrow a zone hue", () => {
    // Arrange
    render(<TrainingPeaksSentButton size="lg" className="" />);

    // Act
    const button = screen.getByTestId("send-to-trainingpeaks-button");

    // Assert
    expect(button).toHaveTextContent("footer.sentToTrainingPeaks");
  });

  it("should apply the className it was handed", () => {
    // Arrange
    render(<TrainingPeaksSentButton size="md" className="w-full" />);

    // Act
    const button = screen.getByTestId("send-to-trainingpeaks-button");

    // Assert
    expect(button).toHaveClass("w-full");
  });

  it("should forward its ref to the underlying button", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();

    // Act
    render(<TrainingPeaksSentButton ref={ref} size="md" className="" />);

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
