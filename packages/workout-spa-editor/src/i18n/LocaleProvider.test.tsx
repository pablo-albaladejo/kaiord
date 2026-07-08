import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider, useActiveLocale } from "./LocaleProvider";

const prefsMock = vi.hoisted(() => ({
  locale: undefined as string | undefined,
}));

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

const Probe = () => <span data-testid="loc">{useActiveLocale()}</span>;

describe("LocaleProvider", () => {
  it("should resolve an explicit es preference and set the document language", () => {
    // Arrange
    prefsMock.locale = "es";

    // Act
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );

    // Assert
    expect(screen.getByTestId("loc")).toHaveTextContent("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("should default useActiveLocale to en outside a provider", () => {
    // Arrange

    // Act
    render(<Probe />);

    // Assert
    expect(screen.getByTestId("loc")).toHaveTextContent("en");
  });
});
