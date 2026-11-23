import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createDexiePersistence } from "../../../../adapters/dexie/dexie-persistence-adapter";
import { renderWithProviders } from "../../../../test-utils";
import { sharedKaiordDatabase } from "../../../../test-utils/shared-kaiord-database";
import { buildTrace } from "../../../../test-utils/trace-fixture";
import { TracesSection } from "./TracesSection";

const download = vi.hoisted(() => vi.fn());
vi.mock("../../../../utils/save-workout.helpers", () => ({
  triggerDownload: download,
}));

const TRACE = buildTrace({
  id: "t-1",
  tools: [
    { name: "create_workout", confirmation: "athlete", result: "refused" },
  ],
  units: [{ promptVersion: "chat-4" }],
  sent: [{ to: "anthropic", kinds: ["messages", "workouts"] }],
});

describe("TracesSection", () => {
  const db = sharedKaiordDatabase("traces-section");

  const renderWith = async (traces = [TRACE]) => {
    const persistence = createDexiePersistence(db);
    for (const trace of traces) await persistence.traces.put(trace);
    renderWithProviders(<TracesSection />, { persistence });
    return persistence;
  };

  it("should say there is no Trace yet on a fresh device", async () => {
    // Arrange
    await renderWith([]);

    // Act
    const empty = await screen.findByText(
      "No Traces yet. Each run of the assistant leaves one here."
    );

    // Assert
    expect(empty).toBeInTheDocument();
  });

  it("should open one Trace and show its Tools, unit and what was sent", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderWith();

    // Act
    await user.click(
      await screen.findByText(/^Chat · .* · Finished · unknown$/)
    );

    // Assert
    const details = screen.getByTestId("trace-details");
    expect(details).toHaveTextContent(
      "create_workout: confirmed by you, refused"
    );
    expect(details).toHaveTextContent("chat-4");
    expect(details).toHaveTextContent(
      "To Anthropic: your messages and workouts"
    );
  });

  it("should set apart the kinds a run may have carried but could not count", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderWith([
      buildTrace({
        id: "t-2",
        sent: [
          { to: "openai", kinds: ["workoutDescription"], declared: ["hrv"] },
        ],
      }),
    ]);

    // Act
    await user.click(await screen.findByText(/^Chat · /));

    // Assert
    expect(screen.getByTestId("trace-details")).toHaveTextContent(
      "To OpenAI: the workout you describe; it may also have carried HRV, which Kaiord cannot count"
    );
  });

  it("should export every Trace as one JSON file", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderWith();

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Export all (JSON)" })
    );

    // Assert
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
    const [text, filename] = download.mock.calls[0] as [string, string];
    expect(filename).toMatch(/^kaiord-traces-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(text).traces[0].id).toBe("t-1");
  });

  it("should delete every Trace once the athlete confirms", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = await renderWith();

    // Act
    await user.click(await screen.findByRole("button", { name: "Delete all" }));
    await user.click(screen.getByRole("button", { name: "Delete Traces" }));

    // Assert
    await screen.findByText(/No Traces yet/);
    expect(await persistence.traces.list()).toEqual([]);
  });
});
