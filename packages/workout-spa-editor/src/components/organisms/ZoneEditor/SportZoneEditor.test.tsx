/**
 * SportZoneEditor Component Tests
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useProfileStore } from "../../../store/profile-store";
import { SportZoneEditor } from "./SportZoneEditor";

describe("SportZoneEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.setState({ profiles: [], activeProfileId: null });
  });

  function createTestProfile() {
    const profile = useProfileStore.getState().createProfile("Test Athlete");
    useProfileStore
      .getState()
      .updateSportThresholds(profile.id, "cycling", { lthr: 180, ftp: 250 });
    return useProfileStore.getState().getProfile(profile.id)!;
  }

  describe("rendering", () => {
    it("should render sport tabs", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      expect(screen.getByRole("tab", { name: "Cycling" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Running" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Swimming" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Generic" })).toBeInTheDocument();
    });

    it("should default to cycling tab", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      expect(screen.getByRole("tab", { name: "Cycling" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("should show HR zones section", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      expect(screen.getByText("Heart Rate Zones")).toBeInTheDocument();
    });

    it("should show threshold inputs for cycling", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      expect(screen.getByLabelText("LTHR threshold")).toBeInTheDocument();
      expect(screen.getByLabelText("FTP threshold")).toBeInTheDocument();
    });

    it("should show zone method dropdown", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      expect(screen.getByLabelText("hr zone method")).toBeInTheDocument();
      expect(screen.getByLabelText("power zone method")).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("should switch to running tab and show pace input", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      await user.click(screen.getByRole("tab", { name: "Running" }));

      expect(screen.getByRole("tab", { name: "Running" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(
        screen.getByLabelText("Threshold Pace threshold")
      ).toBeInTheDocument();
    });

    it("should switch to generic tab showing only HR zones", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      await user.click(screen.getByRole("tab", { name: "Generic" }));

      expect(screen.getByText("Heart Rate Zones")).toBeInTheDocument();
      expect(screen.queryByText("Power Zones")).not.toBeInTheDocument();
      expect(screen.queryByText("Pace Zones")).not.toBeInTheDocument();
    });
  });

  describe("zone method selection", () => {
    it("should change power zone method", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      const methodSelect = screen.getByLabelText("power zone method");
      await user.selectOptions(methodSelect, "british-cycling-6");

      const updated = useProfileStore.getState().getProfile(profile.id);
      expect(updated?.sportZones?.cycling?.powerZones?.method).toBe(
        "british-cycling-6"
      );
    });
  });

  describe("inline editing", () => {
    it("should edit zone name inline", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      const nameButtons = screen.getAllByLabelText("HR Zone 1 name");
      await user.click(nameButtons[0]);

      const input = screen.getByRole("textbox", { name: "HR Zone 1 name" });
      await user.clear(input);
      await user.type(input, "Easy");
      await user.keyboard("{Enter}");

      const updated = useProfileStore.getState().getProfile(profile.id);
      const hrZones = updated?.sportZones?.cycling?.heartRateZones?.zones;
      expect(hrZones?.[0].name).toBe("Easy");
    });

    it("should render zone value buttons for editing", () => {
      const profile = createTestProfile();

      render(<SportZoneEditor profileId={profile.id} />);

      const minButtons = screen.getAllByLabelText("HR Zone 1 min");
      expect(minButtons.length).toBeGreaterThan(0);

      const maxButtons = screen.getAllByLabelText("HR Zone 1 max");
      expect(maxButtons.length).toBeGreaterThan(0);
    });

    it("should show add zone button when method is custom", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      const methodSelect = screen.getByLabelText("power zone method");
      await user.selectOptions(methodSelect, "custom");

      expect(screen.getAllByText("+ Add Zone").length).toBeGreaterThan(0);
    });

    it("should show remove buttons when method is custom", async () => {
      const profile = createTestProfile();
      const user = userEvent.setup();

      render(<SportZoneEditor profileId={profile.id} />);

      const methodSelect = screen.getByLabelText("power zone method");
      await user.selectOptions(methodSelect, "custom");

      const removeButtons = screen.getAllByLabelText(/Remove \w+ zone \d/);
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });
});
