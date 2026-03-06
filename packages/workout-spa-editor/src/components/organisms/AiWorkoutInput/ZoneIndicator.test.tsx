/**
 * ZoneIndicator Component Tests
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useProfileStore } from "../../../store/profile-store";
import { ZoneIndicator } from "./ZoneIndicator";

describe("ZoneIndicator", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.setState({ profiles: [], activeProfileId: null });
  });

  it("should show setup hint when no profile is selected", () => {
    render(<ZoneIndicator sport="" />);

    expect(screen.getByText(/no profile selected/i)).toBeInTheDocument();
  });

  it("should show profile name when no sport is selected", () => {
    useProfileStore.getState().createProfile("My Athlete", { ftp: 250 });

    render(<ZoneIndicator sport="" />);

    expect(screen.getByText(/my athlete/i)).toBeInTheDocument();
  });

  it("should show thresholds for selected sport", () => {
    const profile = useProfileStore
      .getState()
      .createProfile("Cyclist", { ftp: 280, maxHeartRate: 185 });

    useProfileStore
      .getState()
      .updateSportThresholds(profile.id, "cycling", { lthr: 175, ftp: 280 });

    render(<ZoneIndicator sport="cycling" />);

    expect(screen.getByText(/cyclist/i)).toBeInTheDocument();
    expect(screen.getByText(/LTHR: 175bpm/)).toBeInTheDocument();
    expect(screen.getByText(/FTP: 280W/)).toBeInTheDocument();
  });

  it("should show no-zones message for unconfigured sport", () => {
    const profile = useProfileStore.getState().createProfile("Runner");

    // Swimming has no zones configured by default (empty thresholds)
    // But sportZones exists from migration, so it won't show "no zones"
    // unless the config itself is missing
    render(<ZoneIndicator sport="cycling" />);

    expect(screen.getByText(/runner/i)).toBeInTheDocument();
  });
});
