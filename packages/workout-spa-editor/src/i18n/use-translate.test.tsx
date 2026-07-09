import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "./LocaleProvider";
import { useTranslate } from "./use-translate";

const prefsMock = vi.hoisted(() => ({ locale: "es" as string | undefined }));

vi.mock("../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));

vi.mock("../hooks/use-user-preferences", () => ({
  useUserPreferences: () => ({
    profileId: "p1",
    calendarView: "grid",
    locale: prefsMock.locale,
  }),
}));

const Probe = ({ k }: { k: string }) => {
  const t = useTranslate("nav");
  return <span data-testid="out">{t(k)}</span>;
};

describe("useTranslate", () => {
  it("should default to the English value outside a provider", () => {
    // Arrange
    const key = "daily";

    // Act
    render(<Probe k={key} />);

    // Assert
    expect(screen.getByTestId("out")).toHaveTextContent("Daily");
  });

  it("should return the Spanish value under an es locale provider", async () => {
    // Arrange
    prefsMock.locale = "es";

    // Act
    render(
      <LocaleProvider>
        <Probe k="daily" />
      </LocaleProvider>
    );

    // Assert
    // The es catalog loads on demand; the seam falls back to en until it is
    // live, then resolves to the Spanish value.
    await waitFor(() =>
      expect(screen.getByTestId("out")).toHaveTextContent("Diario")
    );
  });

  it("should fall back to the key when it is missing", () => {
    // Arrange
    const key = "does.not.exist";

    // Act
    render(<Probe k={key} />);

    // Assert
    expect(screen.getByTestId("out")).toHaveTextContent("does.not.exist");
  });
});
