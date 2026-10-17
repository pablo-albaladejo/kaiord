/**
 * The converter's GCN download goes through the editor's export pipeline
 * with no owning record, so a %FTP workout resolves against the active
 * profile's FTP, and without one it is refused, never written as watts.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { profileWith } from "../../../lib/athlete/test-profile";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import type * as ExportWorkoutModule from "../../../utils/export-workout";
import { downloadWorkout } from "../../../utils/export-workout";
import { ConvertExport } from "./ConvertExport";

vi.mock("../../../utils/export-workout", async (importOriginal) => ({
  ...(await importOriginal<typeof ExportWorkoutModule>()),
  downloadWorkout: vi.fn(),
}));

const FTP_W = 250;
const SWEET_SPOT_W = 213;

const PERCENT_FTP_RIDE = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Sweet spot",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: { type: "power", value: { unit: "percent_ftp", value: 85 } },
        },
      ],
    },
  },
} as unknown as KRD;

type GcnStep = { targetValueOne: number; targetValueTwo: number };
const downloadedStep = (): GcnStep => {
  const bytes = vi.mocked(downloadWorkout).mock.calls[0]?.[0] as Uint8Array;
  const gcn = JSON.parse(new TextDecoder().decode(bytes)) as {
    workoutSegments: [{ workoutSteps: [GcnStep] }];
  };
  return gcn.workoutSegments[0].workoutSteps[0];
};

const clear = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

const download = async () => {
  renderWithProviders(
    <ConvertExport workout={PERCENT_FTP_RIDE} format="gcn" />
  );
  await userEvent.setup().click(screen.getByTestId("convert-download"));
};

describe("ConvertExport with %FTP power targets", () => {
  beforeEach(clear);
  afterEach(async () => {
    vi.mocked(downloadWorkout).mockClear();
    await clear();
  });

  it("should download the watts from the active profile's FTP", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const active = profileWith("cycling", { ftp: FTP_W });
    await persistence.profiles.put(active);
    await persistence.profiles.setActiveId(active.id);

    // Act
    await download();

    // Assert
    await vi.waitFor(() => expect(downloadWorkout).toHaveBeenCalled());
    expect(downloadedStep()).toMatchObject({
      targetValueOne: SWEET_SPOT_W,
      targetValueTwo: SWEET_SPOT_W,
    });
  });

  it("should refuse the download and say to set the FTP when there is none", async () => {
    // Arrange

    // Act
    await download();

    // Assert
    expect(
      await screen.findByText(
        "This workout has %FTP power targets. Set your FTP in Athlete to export it as GCN.",
        { exact: false }
      )
    ).toBeInTheDocument();
    expect(downloadWorkout).not.toHaveBeenCalled();
  });
});
