import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import ConvertPage from "./ConvertPage";

const selectValue = (label: string) =>
  (screen.getByLabelText(label) as HTMLSelectElement).value;

describe("ConvertPage picker reset", () => {
  it("should reseed the picker when the query changes without leaving /convert", () => {
    // Arrange
    const { hook, searchHook, navigate } = memoryLocation({
      path: "/convert?from=bogus&to=fit",
    });
    renderWithProviders(
      <Router hook={hook} searchHook={searchHook}>
        <ConvertPage />
      </Router>
    );

    // Act
    act(() => navigate("/convert?from=tcx&to=bogus"));

    // Assert
    expect(selectValue("From")).toBe("tcx");
  });
});
