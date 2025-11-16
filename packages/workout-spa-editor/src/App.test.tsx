import { describe, expect, it } from "vitest";
import App from "./App";
import { renderWithProviders } from "./test-utils";

describe("App", () => {
  it("should render without crashing", () => {
    const { container } = renderWithProviders(<App />);
    expect(container).toBeInTheDocument();
  });

  it("should render the welcome section when no workout is loaded", () => {
    const { container } = renderWithProviders(<App />);
    expect(container.querySelector(".space-y-6")).toBeInTheDocument();
  });
});
