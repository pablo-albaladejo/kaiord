import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { setActiveProfile } from "../../../application/profile/set-active-profile";
import { setZoneMethod } from "../../../application/profile/zones/set-zone-method";
import { updateSportThresholds } from "../../../application/profile/zones/update-sport-thresholds";
import type { Target } from "../../../types/krd";
import { TargetPicker } from "./TargetPicker";

const POWER_WATTS_250 = 250;

const HR_ZONE_3 = 3;

describe("TargetPicker", () => {
  beforeEach(async () => {
    await Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);
  });

  it("should render with open target by default", () => {
    // Arrange

    const onChange = vi.fn();

    // Act

    render(<TargetPicker value={null} onChange={onChange} />);

    // Assert

    expect(screen.getByLabelText("Select target type")).toBeInTheDocument();
    expect(
      screen.getByText("Open target (no specific intensity goal)")
    ).toBeInTheDocument();
  });

  it("should render power target with watts unit", () => {
    // Arrange

    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    // Act

    render(<TargetPicker value={value} onChange={onChange} />);

    // Assert

    expect(screen.getByLabelText("Select target type")).toHaveValue("power");
    expect(screen.getByLabelText("Select target unit")).toHaveValue("watts");
    expect(screen.getByLabelText("Power (watts)")).toHaveValue(POWER_WATTS_250);
  });

  it("should render heart rate target with zone unit", () => {
    // Arrange

    const onChange = vi.fn();
    const value: Target = {
      type: "heart_rate",
      value: { unit: "zone", value: 3 },
    };

    // Act

    render(<TargetPicker value={value} onChange={onChange} />);

    // Assert

    expect(screen.getByLabelText("Select target type")).toHaveValue(
      "heart_rate"
    );
    expect(screen.getByLabelText("Select target unit")).toHaveValue("zone");
    expect(screen.getByLabelText("HR Zone (1-5)")).toHaveValue(HR_ZONE_3);
  });

  it("should render range inputs for range unit", () => {
    // Arrange

    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "range", min: 200, max: 250 },
    };

    // Act

    render(<TargetPicker value={value} onChange={onChange} />);

    // Assert

    expect(screen.getByLabelText("Minimum value")).toHaveValue(200);
    expect(screen.getByLabelText("Maximum value")).toHaveValue(POWER_WATTS_250);
  });

  it("should call onChange when target type changes", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TargetPicker value={null} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");

    // Act

    await user.selectOptions(typeSelect, "power");

    // Assert

    expect(onChange).toHaveBeenCalled();
  });

  it("should validate power zone range (1-7)", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "zone", value: 1 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("Power Zone (1-7)");
    await user.clear(input);

    // Act

    await user.type(input, "8");

    // Assert

    expect(
      screen.getByText("Power zone must be between 1 and 7")
    ).toBeInTheDocument();
  });

  it("should validate heart rate zone range (1-5)", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "heart_rate",
      value: { unit: "zone", value: 1 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("HR Zone (1-5)");
    await user.clear(input);

    // Act

    await user.type(input, "6");

    // Assert

    expect(
      screen.getByText("Heart rate zone must be between 1 and 5")
    ).toBeInTheDocument();
  });

  it("should validate negative values", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("Power (watts)");
    await user.clear(input);

    // Act

    await user.type(input, "-10");

    // Assert

    expect(screen.getByText("Must be greater than 0")).toBeInTheDocument();
  });

  it("should validate range min < max", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "range", min: 200, max: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const minInput = screen.getByLabelText("Minimum value");
    await user.clear(minInput);

    // Act

    await user.type(minInput, "300");

    // Assert

    expect(
      screen.getByText("Minimum must be less than maximum")
    ).toBeInTheDocument();
  });

  it("should display external error message", () => {
    // Arrange

    const onChange = vi.fn();

    // Act

    render(
      <TargetPicker
        value={null}
        onChange={onChange}
        error="External error message"
      />
    );

    // Assert

    expect(screen.getByText("External error message")).toBeInTheDocument();
  });

  it("should disable all inputs when disabled prop is true", () => {
    // Arrange

    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    // Act

    render(<TargetPicker value={value} onChange={onChange} disabled={true} />);

    // Assert

    expect(screen.getByLabelText("Select target type")).toBeDisabled();
    expect(screen.getByLabelText("Select target unit")).toBeDisabled();
    expect(screen.getByLabelText("Power (watts)")).toBeDisabled();
  });

  it("should show appropriate unit options for each target type", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TargetPicker value={null} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");

    // Power
    await user.selectOptions(typeSelect, "power");

    // Act

    const unitSelect = screen.getByLabelText("Select target unit");

    // Assert

    expect(unitSelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Watts" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "% FTP" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Power Zone (no profile)" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Range" })).toBeInTheDocument();
  });

  it("should clear values when changing target type", async () => {
    // Arrange

    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");
    await user.selectOptions(typeSelect, "heart_rate");

    // Value should be cleared

    // Act

    const input = screen.getByLabelText("Heart Rate (BPM)");

    // Assert

    expect(input).toHaveValue(null);
  });

  describe("Profile Integration", () => {
    it("should show zone name when profile is active and zone is selected", async () => {
      // Arrange
      // Arrange

      const persistence = createDexiePersistence(db);
      const profile = await createProfile(persistence, "Test Profile");
      await updateSportThresholds(persistence, profile.id, "cycling", {
        ftp: 250,
        lthr: 180,
      });

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      // Act

      // Act

      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert

      // Assert

      expect(await screen.findByText(/Tempo/)).toBeInTheDocument();
      expect(await screen.findByText(/190-225W/)).toBeInTheDocument();
    });

    it("should show heart rate zone name when profile is active", async () => {
      // Arrange
      // Arrange

      const persistence = createDexiePersistence(db);
      const profile = await createProfile(persistence, "Test Profile");
      await setZoneMethod(
        persistence,
        profile.id,
        "cycling",
        "heartRateZones",
        "karvonen-5",
        []
      );
      await updateSportThresholds(persistence, profile.id, "cycling", {
        lthr: 180,
      });

      const onChange = vi.fn();
      const value: Target = {
        type: "heart_rate",
        value: { unit: "zone", value: 2 },
      };

      // Act

      // Act

      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert - Karvonen zone 2: contiguous from Z1.max+1 to round(89%*180)

      // Assert

      expect(await screen.findByText(/Aerobic/)).toBeInTheDocument();
      expect(await screen.findByText(/149-160 BPM/)).toBeInTheDocument();
    });

    it("should not show zone info when no profile is active", () => {
      // Arrange
      // Arrange

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      // Act

      // Act

      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert

      // Assert

      expect(screen.queryByText(/Tempo/)).not.toBeInTheDocument();
    });

    it("should update zone info when profile changes", async () => {
      // Arrange — first profile is auto-set active by createProfile (I1).
      // Arrange

      const persistence = createDexiePersistence(db);
      const profile1 = await createProfile(persistence, "Profile 1");
      await updateSportThresholds(persistence, profile1.id, "cycling", {
        ftp: 250,
      });

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      // Act

      const { rerender } = render(
        <TargetPicker value={value} onChange={onChange} />
      );

      // Assert initial zone info

      // Assert

      expect(await screen.findByText(/190-225W/)).toBeInTheDocument();

      // Act — second profile does not auto-set active; switch explicitly.
      const profile2 = await createProfile(persistence, "Profile 2");
      await updateSportThresholds(persistence, profile2.id, "cycling", {
        ftp: 300,
      });
      await setActiveProfile(persistence, profile2.id);

      rerender(<TargetPicker value={value} onChange={onChange} />);

      // Assert updated zone info
      expect(await screen.findByText(/228-270W/)).toBeInTheDocument();
    });

    it("should show zone label with no profile indicator when no profile", () => {
      // Arrange
      // Arrange

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 1 },
      };

      // Act
      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert
      const unitSelect = screen.getByLabelText("Select target unit");

      // Act

      const zoneOption = Array.from(unitSelect.querySelectorAll("option")).find(
        (opt) => opt.value === "zone"
      );

      // Assert

      expect(zoneOption?.textContent).toBe("Power Zone (no profile)");
    });

    it("should calculate absolute power values from zone and FTP", async () => {
      // Arrange
      // Arrange

      const persistence = createDexiePersistence(db);
      const profile = await createProfile(persistence, "Test Profile");
      await updateSportThresholds(persistence, profile.id, "cycling", {
        ftp: 200,
      });

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 4 },
      };

      // Act

      // Act

      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert - Zone 4 is 91-105% of FTP

      // Assert

      expect(await screen.findByText(/182-210W/)).toBeInTheDocument();
    });

    it("should not show power range when FTP is not set", async () => {
      // Arrange — createProfile sets active automatically (I1).
      // Arrange

      const persistence = createDexiePersistence(db);
      await createProfile(persistence, "Test Profile");

      const onChange = vi.fn();
      const value: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      // Act

      // Act

      render(<TargetPicker value={value} onChange={onChange} />);

      // Assert - Should show zone name but not power range

      // Assert

      expect(await screen.findByText(/Tempo/)).toBeInTheDocument();
      // Should not show power range in watts (e.g., "190-225W")
      expect(screen.queryByText(/\d+-\d+W/)).not.toBeInTheDocument();
    });
  });
});
