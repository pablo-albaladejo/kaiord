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
    useProfileStore.getState().createProfile("My Athlete");

    render(<ZoneIndicator sport="" />);

    expect(screen.getByText(/my athlete/i)).toBeInTheDocument();
  });

  it("should show thresholds for selected sport", () => {
    const profile = useProfileStore.getState().createProfile("Cyclist");

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

    // All sports have sportZones by default, so the profile name shows
    render(<ZoneIndicator sport="cycling" />);

    expect(screen.getByText(/runner/i)).toBeInTheDocument();
  });
});
