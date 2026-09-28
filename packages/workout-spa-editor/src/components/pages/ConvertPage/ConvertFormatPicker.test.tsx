import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { ConvertPair } from "../../../routing/convert-params";
import { renderWithProviders } from "../../../test-utils";
import { ConvertFormatPicker } from "./ConvertFormatPicker";

function renderPicker(initial?: Partial<ConvertPair>) {
  const { hook, searchHook } = memoryLocation({ path: "/convert" });
  return renderWithProviders(
    <Router hook={hook} searchHook={searchHook}>
      <ConvertFormatPicker initial={initial} />
    </Router>
  );
}

const selectValue = (label: RegExp) =>
  (screen.getByLabelText(label) as HTMLSelectElement).value;

describe("ConvertFormatPicker", () => {
  it("should keep the valid side of a partial link", () => {
    // Arrange
    const initial = { to: "gcn" } as const;

    // Act
    renderPicker(initial);

    // Assert
    expect(selectValue(/^from$/i)).toBe("zwo");
    expect(selectValue(/^to$/i)).toBe("gcn");
  });

  it("should pick a different target when only the source is known", () => {
    // Arrange
    const initial = { from: "fit" } as const;

    // Act
    renderPicker(initial);

    // Assert
    expect(selectValue(/^from$/i)).toBe("fit");
    expect(selectValue(/^to$/i)).not.toBe("fit");
    expect(screen.getByTestId("convert-continue")).toBeInTheDocument();
  });

  it("should explain why it cannot continue when both formats match", async () => {
    // Arrange
    renderPicker({ from: "zwo", to: "fit" });

    // Act
    await userEvent.selectOptions(screen.getByLabelText(/^to$/i), "zwo");

    // Assert
    expect(screen.getByTestId("convert-same-format")).toHaveTextContent(
      "Pick two different formats."
    );
    expect(screen.queryByTestId("convert-continue")).toBeNull();
  });
});
