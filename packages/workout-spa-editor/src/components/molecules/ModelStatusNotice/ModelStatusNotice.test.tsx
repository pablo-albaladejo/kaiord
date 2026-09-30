import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModelStatusNotice } from "./ModelStatusNotice";

vi.mock("@kaiord/ai/providers", () => ({
  retiredSuccessor: () => undefined,
  deprecationOf: (_type: string, id: string) =>
    id === "claude-dated"
      ? { successor: "claude-next", retiresOn: "2027-01-15" }
      : undefined,
}));

describe("ModelStatusNotice", () => {
  it("should include the retirement date when the provider has dated it", () => {
    // Arrange
    const modelId = "claude-dated";

    // Act
    render(
      <ModelStatusNotice type="anthropic" modelId={modelId} testIdPrefix="x" />
    );

    // Assert
    expect(screen.getByTestId("x-deprecated")).toHaveTextContent(
      "claude-dated is deprecated and will be retired on 2027-01-15 — consider claude-next."
    );
  });

  it("should render nothing for a model with no lifecycle notice", () => {
    // Arrange
    const modelId = "claude-current";

    // Act
    const { container } = render(
      <ModelStatusNotice type="anthropic" modelId={modelId} testIdPrefix="x" />
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
