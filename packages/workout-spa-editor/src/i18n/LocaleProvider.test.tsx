import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider, useActiveLocale } from "./LocaleProvider";

const prefsMock = vi.hoisted(() => ({
  locale: undefined as string | undefined,
}));

vi.mock("../hooks/use-device-preferences", () => ({
  useDevicePreferences: () => ({
    prefs: { locale: prefsMock.locale },
    ready: true,
    update: vi.fn(),
  }),
}));

const Probe = () => <span data-testid="loc">{useActiveLocale()}</span>;

describe("LocaleProvider", () => {
  it("should resolve an explicit es preference and set the document language", async () => {
    // Arrange
    prefsMock.locale = "es";

    // Act
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );

    // Assert
    // The es catalog is code-split and loaded on demand; the context holds at
    // en until it is live, then flips.
    await waitFor(() =>
      expect(screen.getByTestId("loc")).toHaveTextContent("es")
    );
    expect(document.documentElement.lang).toBe("es");
  });

  it("should follow the browser language when the device has no locale set", async () => {
    // Arrange
    prefsMock.locale = undefined;
    vi.spyOn(navigator, "language", "get").mockReturnValue("es-ES");

    // Act
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("loc")).toHaveTextContent("es")
    );
  });

  it("should default useActiveLocale to en outside a provider", () => {
    // Arrange

    // Act
    render(<Probe />);

    // Assert
    expect(screen.getByTestId("loc")).toHaveTextContent("en");
  });
});
