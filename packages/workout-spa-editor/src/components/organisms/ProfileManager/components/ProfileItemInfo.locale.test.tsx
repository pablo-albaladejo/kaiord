import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { makeProfile } from "../../../../application/profile/test-fixtures";
import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { ProfileItemInfo } from "./ProfileItemInfo";

vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("ProfileItemInfo in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should show the thresholds with Spanish labels", () => {
    // Arrange
    const profile = makeProfile({
      sportZones: { cycling: { thresholds: { ftp: 250, lthr: 170 } } },
    });

    // Act
    render(<ProfileItemInfo profile={profile} />);

    // Assert
    expect(screen.getByText(/FTP: 250W - FC umbral: 170 ppm/)).toBeVisible();
  });
});
