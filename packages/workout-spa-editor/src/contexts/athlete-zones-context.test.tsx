import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Profile } from "../types/profile";
import { AthleteZonesProvider, useAthleteZones } from "./athlete-zones-context";

const FTP_WATTS = 268;

const PROFILE = {
  id: "p1",
  sportZones: { cycling: { thresholds: { ftp: FTP_WATTS } } },
} as unknown as Profile;

function Probe() {
  const profile = useAthleteZones();
  return (
    <span data-testid="probe">
      {profile?.sportZones.cycling?.thresholds.ftp ?? "none"}
    </span>
  );
}

describe("AthleteZonesProvider", () => {
  it("should hand the active profile down to a consumer", () => {
    // Arrange

    // Act
    render(
      <AthleteZonesProvider profile={PROFILE}>
        <Probe />
      </AthleteZonesProvider>
    );

    // Assert
    expect(screen.getByTestId("probe")).toHaveTextContent(String(FTP_WATTS));
  });

  it("should answer null outside a provider rather than throwing", () => {
    // Arrange

    // Act
    render(<Probe />);

    // Assert
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
  });

  it("should answer null when there is no active profile", () => {
    // Arrange

    // Act
    render(
      <AthleteZonesProvider profile={null}>
        <Probe />
      </AthleteZonesProvider>
    );

    // Assert
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
  });
});
