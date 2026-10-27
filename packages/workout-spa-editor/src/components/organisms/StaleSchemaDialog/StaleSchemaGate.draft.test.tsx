import { afterEach, describe, expect, it, vi } from "vitest";

import { useWorkoutStore } from "../../../store/workout-store";
import { render, screen, userEvent } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { parseFile } from "../../molecules/FileUpload/file-parser";
import { StaleSchemaGate } from "./StaleSchemaGate";

vi.mock("../../../hooks/use-stale-schema", () => ({
  useStaleSchema: () => true,
}));

const WARMUP_SECONDS = 300;

// An editor draft: its steps carry the UI ids that a file must not keep.
const editorDraft = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-27T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Unsaved draft",
      sport: "cycling",
      steps: [
        {
          id: "ui-step-1",
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: WARMUP_SECONDS },
          targetType: "open",
          target: { type: "open" },
          intensity: "warmup",
        },
      ],
    },
  },
} as unknown as KRD;

const captureDownload = () => {
  const saved: { blob?: Blob; name?: string } = {};
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      saved.blob = blob;
      return "blob:draft";
    },
    revokeObjectURL: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    saved.name = this.download;
  });
  return saved;
};

describe("StaleSchemaGate draft download", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useWorkoutStore.setState({ currentWorkout: null });
  });

  it("should save a .krd file that the editor's import reads back", async () => {
    // Arrange
    const user = userEvent.setup();
    const saved = captureDownload();
    useWorkoutStore.setState({ currentWorkout: editorDraft });
    render(<StaleSchemaGate />);

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Download draft" })
    );
    const file = new File([await saved.blob!.text()], saved.name!);
    const imported = await parseFile(file);

    // Assert
    expect(saved.name).toMatch(/\.krd$/);
    const steps = imported.extensions?.structured_workout?.steps ?? [];
    expect(steps).toHaveLength(1);
    expect(steps[0]).not.toHaveProperty("id");
    expect(imported.extensions?.structured_workout?.name).toBe("Unsaved draft");
  });
});
