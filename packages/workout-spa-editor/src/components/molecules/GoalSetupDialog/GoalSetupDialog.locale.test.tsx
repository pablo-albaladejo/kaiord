import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { GoalPreview } from "./goal-preview";
import { GoalCapOverrideToggle } from "./GoalCapOverrideToggle";
import { GoalFormControls } from "./GoalFormControls";
import { GoalPreviewPanel } from "./GoalPreviewPanel";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const DEFICIT_KCAL = -500;
const TARGET_KCAL = 1800;
const START_KG = 72.4;

const fields = {
  goalType: "fat_loss" as const,
  startWeightKg: String(START_KG),
  targetWeightKg: "",
  targetDate: "",
  overrideCap: false,
};

describe("GoalSetupDialog in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label the goal fields and goal types in Spanish", () => {
    // Arrange

    // Act
    render(<GoalFormControls fields={fields} onChange={() => {}} />);

    // Assert
    expect(screen.getByLabelText("Peso inicial (kg)")).toHaveValue(START_KG);
    expect(screen.getByLabelText("Peso objetivo (kg)")).toBeTruthy();
    expect(screen.getByLabelText("Fecha objetivo")).toBeTruthy();
    const types = screen.getAllByRole("option").map((o) => o.textContent);
    expect(types).toEqual(["Perder grasa", "Ganar músculo", "Mantener"]);
  });

  it("should word the preview and the safety cap in Spanish", () => {
    // Arrange
    const preview: GoalPreview = {
      dailyDeltaKcal: DEFICIT_KCAL,
      targetKcal: TARGET_KCAL,
      macroTargets: { kcal: TARGET_KCAL, protein_g: 0, carb_g: 0, fat_g: 0 },
      capped: true,
      overridden: false,
    };

    // Act
    render(
      <>
        <GoalPreviewPanel preview={preview} />
        <GoalCapOverrideToggle checked={false} onChange={() => {}} />
      </>
    );

    // Assert
    expect(screen.getByText("Déficit de 500 kcal / día")).toBeInTheDocument();
    expect(screen.getByText("Objetivo 1800 kcal")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Este ritmo supera el límite seguro"
    );
    expect(
      screen.getByLabelText("Ignorar el límite de seguridad y usar mi ritmo")
    ).toBeTruthy();
  });
});
