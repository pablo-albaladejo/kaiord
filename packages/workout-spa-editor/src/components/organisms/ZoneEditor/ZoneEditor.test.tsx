/**
 * ZoneEditor Component Tests
 *
 * Tests for the ZoneEditor component that manages power and heart rate zones.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Profile } from "../../../types/profile";
import {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../../../types/profile";
import { ZoneEditor } from "./ZoneEditor";

const POWER_MIN_PERCENT_10 = 10;

const HR_MIN_BPM_55 = 55;

// ============================================
// Test Fixtures
// ============================================

const hrZonesWithValues = [
  { zone: 1, name: "Recovery", minBpm: 50, maxBpm: 113 },
  { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 132 },
  { zone: 3, name: "Tempo", minBpm: 133, maxBpm: 151 },
  { zone: 4, name: "Threshold", minBpm: 152, maxBpm: 170 },
  { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 190 },
];

const mockProfile: Profile = {
  id: "test-profile-id",
  name: "Test Athlete",
  bodyWeight: 70,
  sportZones: {
    cycling: {
      thresholds: { ftp: 250, lthr: 190 },
      heartRateZones: { method: "custom", zones: hrZonesWithValues },
      powerZones: { method: "coggan-7", zones: DEFAULT_POWER_ZONES },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: DEFAULT_HEART_RATE_ZONES },
    },
  },
  linkedAccounts: [],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// ============================================
// Rendering Tests
// ============================================

describe("ZoneEditor - rendering", () => {
  it("should render the power zones editor with all zones and a value preview", () => {
    // Arrange

    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Act

    const previews = screen.getAllByText(/W -/);

    // Assert

    expect(screen.getByText("Power Zones")).toBeInTheDocument();
    expect(screen.getByText(/Configure 7 power zones/)).toBeInTheDocument();
    expect(screen.getByText(/250W/)).toBeInTheDocument();
    DEFAULT_POWER_ZONES.forEach((zone) => {
      expect(screen.getByDisplayValue(zone.name)).toBeInTheDocument();
    });
    expect(previews.length).toBeGreaterThan(0);
  });

  it("should render the heart rate zones editor with all zones", () => {
    // Arrange

    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Act

    // Assert

    expect(screen.getByText("Heart Rate Zones")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure 5 heart rate zones/)
    ).toBeInTheDocument();
    expect(screen.getByText(/190 bpm/)).toBeInTheDocument();
    hrZonesWithValues.forEach((zone) => {
      expect(screen.getByDisplayValue(zone.name)).toBeInTheDocument();
    });
  });

  it("should display calculated power values when FTP is set", () => {
    // Arrange

    // Act

    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Zone 1: 0-55% of 250W = 0-138W

    // Assert

    expect(screen.getByText(/0W - 138W/)).toBeInTheDocument();
  });
});

// ============================================
// Interaction Tests
// ============================================

describe("ZoneEditor - interactions", () => {
  it("should call onCancel when cancel button is clicked", async () => {
    // Arrange

    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={handleCancel}
      />
    );

    // Act

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Assert

    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("should call onSave with updated zones when save button is clicked", async () => {
    // Arrange

    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    // Act

    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert

    expect(handleSave).toHaveBeenCalledOnce();
    expect(handleSave).toHaveBeenCalledWith(DEFAULT_POWER_ZONES);
  });

  it("should update zone name when input changes", async () => {
    // Arrange

    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    const nameInput = screen.getByDisplayValue("Active Recovery");
    await user.clear(nameInput);
    await user.type(nameInput, "Easy Zone");

    // Act

    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert

    expect(handleSave).toHaveBeenCalledOnce();
    const savedZones = handleSave.mock.calls[0][0];
    expect(savedZones[0].name).toBe("Easy Zone");
  });

  it("should update zone percentage values", async () => {
    // Arrange

    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    const minInputs = screen.getAllByLabelText(/min %/i);
    await user.clear(minInputs[0]);
    await user.type(minInputs[0], "10");

    // Act

    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert

    expect(handleSave).toHaveBeenCalledOnce();
    const savedZones = handleSave.mock.calls[0][0];
    expect(savedZones[0].minPercent).toBe(POWER_MIN_PERCENT_10);
  });

  it("should update heart rate zone BPM values", async () => {
    // Arrange

    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="heartRate"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    const minInputs = screen.getAllByLabelText(/min bpm/i);
    await user.clear(minInputs[0]);
    await user.type(minInputs[0], "55");

    // Act

    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert

    expect(handleSave).toHaveBeenCalledOnce();
    const savedZones = handleSave.mock.calls[0][0];
    expect(savedZones[0].minBpm).toBe(HR_MIN_BPM_55);
  });
});

// ============================================
// Validation Tests
// ============================================

describe("ZoneEditor - validation", () => {
  it("should show validation error when min >= max", async () => {
    // Arrange

    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);

    // Act

    await user.type(maxInputs[0], "0");

    // Assert

    expect(screen.getByText("Validation Errors")).toBeInTheDocument();
    expect(screen.getByText(/Min must be less than max/)).toBeInTheDocument();
  });

  it("should show validation error when zones overlap", async () => {
    // Arrange

    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);

    // Act

    await user.type(maxInputs[0], "60");

    // Assert

    expect(screen.getByText("Validation Errors")).toBeInTheDocument();
    expect(screen.getByText(/Overlaps with next zone/)).toBeInTheDocument();
  });

  it("should disable save button when validation errors exist", async () => {
    // Arrange

    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
    await user.type(maxInputs[0], "0");

    // Act

    const saveButton = screen.getByRole("button", { name: /save zones/i });

    // Assert

    expect(saveButton).toBeDisabled();
  });

  it("should not call onSave when validation errors exist", async () => {
    // Arrange

    const handleSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
    await user.type(maxInputs[0], "0");

    // Act

    const saveButton = screen.getByRole("button", { name: /save zones/i });

    // Assert

    expect(saveButton).toBeDisabled();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("should validate heart rate zones correctly", async () => {
    // Arrange

    const user = userEvent.setup();
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const maxInputs = screen.getAllByLabelText(/max bpm/i);
    await user.clear(maxInputs[0]);

    // Act

    await user.type(maxInputs[0], "40");

    // Assert

    expect(screen.getByText("Validation Errors")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Min must be less than max/)[0]
    ).toBeInTheDocument();
  });
});

// ============================================
// Edge Cases
// ============================================

describe("ZoneEditor - edge cases", () => {
  it("should handle profile without FTP", () => {
    // Arrange

    const profileWithoutFtp: Profile = {
      ...mockProfile,
      sportZones: {
        ...mockProfile.sportZones,
        cycling: {
          ...mockProfile.sportZones.cycling!,
          thresholds: { lthr: 190 },
        },
      },
    };

    // Act

    render(
      <ZoneEditor
        profile={profileWithoutFtp}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByText(/Configure 7 power zones/)).toBeInTheDocument();
    expect(screen.queryByText(/250W/)).not.toBeInTheDocument();
  });

  it("should handle profile without LTHR", () => {
    // Arrange

    const profileWithoutLthr: Profile = {
      ...mockProfile,
      sportZones: {
        ...mockProfile.sportZones,
        cycling: {
          ...mockProfile.sportZones.cycling!,
          thresholds: { ftp: 250 },
        },
      },
    };

    // Act

    render(
      <ZoneEditor
        profile={profileWithoutLthr}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(
      screen.getByText(/Configure 5 heart rate zones/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/190 bpm/)).not.toBeInTheDocument();
  });
});
