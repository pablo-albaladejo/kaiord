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

// ============================================
// Test Fixtures
// ============================================

const mockProfile: Profile = {
  id: "test-profile-id",
  name: "Test Athlete",
  bodyWeight: 70,
  ftp: 250,
  maxHeartRate: 190,
  powerZones: DEFAULT_POWER_ZONES,
  heartRateZones: DEFAULT_HEART_RATE_ZONES,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

// ============================================
// Rendering Tests
// ============================================

describe("ZoneEditor - rendering", () => {
  it("should render power zones editor", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText("Power Zones")).toBeInTheDocument();
    expect(screen.getByText(/Configure 7 power zones/)).toBeInTheDocument();
    expect(screen.getByText(/250W/)).toBeInTheDocument();
  });

  it("should render heart rate zones editor", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText("Heart Rate Zones")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure 5 heart rate zones/)
    ).toBeInTheDocument();
    expect(screen.getByText(/190 bpm/)).toBeInTheDocument();
  });

  it("should render all power zones", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    DEFAULT_POWER_ZONES.forEach((zone) => {
      expect(screen.getByDisplayValue(zone.name)).toBeInTheDocument();
    });
  });

  it("should render all heart rate zones", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    DEFAULT_HEART_RATE_ZONES.forEach((zone) => {
      expect(screen.getByDisplayValue(zone.name)).toBeInTheDocument();
    });
  });

  it("should render zone preview chart", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText("Zone Preview")).toBeInTheDocument();
  });

  it("should display calculated power values when FTP is set", () => {
    // Arrange & Act
    render(
      <ZoneEditor
        profile={mockProfile}
        zoneType="power"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    // Zone 1: 0-55% of 250W = 0-138W
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

    // Act
    const nameInput = screen.getByDisplayValue("Active Recovery");
    await user.clear(nameInput);
    await user.type(nameInput, "Easy Zone");
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

    // Act
    const minInputs = screen.getAllByLabelText(/min %/i);
    await user.clear(minInputs[0]);
    await user.type(minInputs[0], "10");
    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert
    expect(handleSave).toHaveBeenCalledOnce();
    const savedZones = handleSave.mock.calls[0][0];
    expect(savedZones[0].minPercent).toBe(10);
  });

  it("should update heart rate zone BPM values", async () => {
    // Arrange
    const handleSave = vi.fn();
    const user = userEvent.setup();
    const profileWithHRZones: Profile = {
      ...mockProfile,
      heartRateZones: [
        { zone: 1, name: "Recovery", minBpm: 50, maxBpm: 113 },
        { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 133 },
        { zone: 3, name: "Tempo", minBpm: 134, maxBpm: 152 },
        { zone: 4, name: "Threshold", minBpm: 153, maxBpm: 171 },
        { zone: 5, name: "VO2 Max", minBpm: 172, maxBpm: 190 },
      ],
    };
    render(
      <ZoneEditor
        profile={profileWithHRZones}
        zoneType="heartRate"
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    // Act
    const minInputs = screen.getAllByLabelText(/min bpm/i);
    await user.clear(minInputs[0]);
    await user.type(minInputs[0], "55");
    await user.click(screen.getByRole("button", { name: /save zones/i }));

    // Assert
    expect(handleSave).toHaveBeenCalledOnce();
    const savedZones = handleSave.mock.calls[0][0];
    expect(savedZones[0].minBpm).toBe(55);
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

    // Act
    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
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

    // Act
    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
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

    // Act
    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
    await user.type(maxInputs[0], "0");

    // Assert
    const saveButton = screen.getByRole("button", { name: /save zones/i });
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

    // Act
    const maxInputs = screen.getAllByLabelText(/max %/i);
    await user.clear(maxInputs[0]);
    await user.type(maxInputs[0], "0");

    // Save button is disabled, so we can't click it
    // This test verifies the button is disabled

    // Assert
    const saveButton = screen.getByRole("button", { name: /save zones/i });
    expect(saveButton).toBeDisabled();
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("should validate heart rate zones correctly", async () => {
    // Arrange
    const user = userEvent.setup();
    const profileWithHRZones: Profile = {
      ...mockProfile,
      heartRateZones: [
        { zone: 1, name: "Recovery", minBpm: 50, maxBpm: 114 },
        { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 133 },
        { zone: 3, name: "Tempo", minBpm: 133, maxBpm: 152 },
        { zone: 4, name: "Threshold", minBpm: 152, maxBpm: 171 },
        { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 190 },
      ],
    };
    render(
      <ZoneEditor
        profile={profileWithHRZones}
        zoneType="heartRate"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Act
    const maxInputs = screen.getAllByLabelText(/max bpm/i);
    await user.clear(maxInputs[0]);
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
      ftp: undefined,
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

  it("should handle profile without max heart rate", () => {
    // Arrange
    const profileWithoutMaxHR: Profile = {
      ...mockProfile,
      maxHeartRate: undefined,
    };

    // Act
    render(
      <ZoneEditor
        profile={profileWithoutMaxHR}
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
