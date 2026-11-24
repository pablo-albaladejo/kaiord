import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { modelChoiceGroups } from "./model-choice";
import { ModelChoiceOptions } from "./ModelChoiceOptions";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const google: LlmProviderConfig = {
  id: "google",
  type: "google",
  apiKey: "k",
  label: "Mi Gemini",
  isDefault: true,
  createdAt: 1,
};

describe("ModelChoiceOptions evaluation label in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label Google's default not evaluated in Spanish", () => {
    // Arrange
    const groups = modelChoiceGroups([google], null);

    // Act
    render(
      <select aria-label="Modelo">
        <ModelChoiceOptions groups={groups} />
      </select>
    );

    // Assert
    expect(
      screen.getByRole("option", {
        name: "Gemini 2.5 Flash (no evaluado) · Mi Gemini",
      })
    ).toBeInTheDocument();
  });
});
