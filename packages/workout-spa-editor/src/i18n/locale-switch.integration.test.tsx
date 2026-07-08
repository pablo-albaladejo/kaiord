import { render, screen, waitFor } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appI18n } from "./i18n";
import { LocaleProvider, useActiveLocale } from "./LocaleProvider";

const prefsMock = vi.hoisted(() => ({ locale: "en" as string | undefined }));

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

const Probe = () => {
  const { t } = useTranslation("common");
  return (
    <div>
      <span data-testid="t">{t("language.label")}</span>
      <span data-testid="loc">{useActiveLocale()}</span>
    </div>
  );
};

afterEach(async () => {
  await appI18n.changeLanguage("en");
});

describe("locale switch propagation", () => {
  it("should flip t() copy and the active locale when the preference becomes es", async () => {
    // Arrange
    prefsMock.locale = "en";
    const { rerender } = render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("t")).toHaveTextContent("Language");
      expect(screen.getByTestId("loc")).toHaveTextContent("en");
    });

    // Act
    prefsMock.locale = "es";
    rerender(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("t")).toHaveTextContent("Idioma");
      expect(screen.getByTestId("loc")).toHaveTextContent("es");
    });
  });
});
