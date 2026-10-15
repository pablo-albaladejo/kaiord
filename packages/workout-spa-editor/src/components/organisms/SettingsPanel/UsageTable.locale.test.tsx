import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { UsageTable } from "./UsageTable";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const ZERO: UsageTotals = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
};

const chat: UsageTotals = {
  inputTokens: 1215000,
  outputTokens: 455000,
  totalTokens: 1670000,
  totalCost: 0.802,
};

describe("UsageTable in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should write token counts the way the app's language does, like the cost", () => {
    // Arrange
    const rows = [
      {
        yearMonth: "2026-10",
        totals: chat,
        byPurpose: { chat, workout_generation: ZERO, lab_extraction: ZERO },
      },
    ];

    // Act
    render(<UsageTable rows={rows} monthsWindow={6} />);

    // Assert
    const month = screen.getByTestId("usage-row-2026-10");
    expect(screen.getByTestId("usage-input-2026-10")).toHaveTextContent(
      "1.215.000"
    );
    expect(month).toHaveTextContent("1.670.000");
    expect(month).toHaveTextContent("0,802 US$");
    expect(screen.getByTestId("usage-purpose-2026-10-chat")).toHaveTextContent(
      "1.670.000"
    );
  });
});
