import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { WorkoutStep } from "../../../types/krd";
import { PasteButton } from "../../molecules/PasteButton/PasteButton";
import { StepCard } from "../../molecules/StepCard/StepCard";
import { StepEditor } from "./StepEditor";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const ENGLISH =
  /\b(Step|Duration|Notes|Coaching|characters|Time|Distance|Paste|warmup|active|open|pace|Intensity)\b/;

/** Every text node on its own, so adjacent nodes cannot fuse into one word. */
const words = (root: HTMLElement): string => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? "");
  return parts.join(" | ");
};

const STEP: WorkoutStep = {
  stepIndex: 0,
  intensity: "warmup",
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "open",
  target: { type: "open" },
};

const inSpanish = async () => {
  await setActiveLocale("es");
  locale.active = "es";
};

describe("step editing in Spanish", () => {
  afterEach(async () => {
    locale.active = "en";
    await appI18n.changeLanguage("en");
  });

  it("should leave no English in the step form", async () => {
    // Arrange
    await inSpanish();

    // Act
    const { container } = render(
      <StepEditor step={STEP} onSave={vi.fn()} onCancel={vi.fn()} />
    );

    // Assert
    expect(screen.getByLabelText("Duración (mm:ss)")).toHaveValue("10:00");
    expect(words(container)).not.toMatch(ENGLISH);
  });

  it("should leave no English on the step card", async () => {
    // Arrange
    await inSpanish();

    // Act
    const { container } = render(
      <StepCard
        step={{
          ...STEP,
          targetType: "pace",
          target: { type: "pace", value: { unit: "mps", value: 3.704 } },
        }}
      />
    );

    // Assert
    expect(screen.getByText("Paso 1")).toBeInTheDocument();
    expect(screen.getByText("Calentamiento")).toBeInTheDocument();
    expect(words(container)).not.toMatch(ENGLISH);
  });

  it("should offer to paste a step in Spanish", async () => {
    // Arrange
    await inSpanish();

    // Act
    render(<PasteButton onPaste={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("button", { name: "Pegar paso del portapapeles" })
    ).toHaveTextContent("Pegar paso");
  });
});
