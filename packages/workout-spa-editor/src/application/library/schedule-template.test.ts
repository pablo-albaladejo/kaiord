import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addTemplate } from "./add-template";
import { scheduleTemplate } from "./schedule-template";
import { makeKrd } from "./test-fixtures";

describe("scheduleTemplate", () => {
  it("creates a workout record from the template on the given date", async () => {
    const persistence = createInMemoryPersistence();
    const template = await addTemplate(
      persistence,
      "Tempo Ride",
      "cycling",
      makeKrd(),
      { tags: ["tempo", "z3"] }
    );

    const record = await scheduleTemplate(persistence, {
      templateId: template.id,
      date: "2026-05-04",
    });

    expect(record.date).toBe("2026-05-04");
    expect(record.sport).toBe("cycling");
    expect(record.source).toBe("kaiord");
    expect(record.state).toBe("structured");
    expect(record.krd).toEqual(template.krd);
    expect(record.tags).toEqual(["tempo", "z3"]);
  });

  it("persists the workout via PersistencePort.workouts.put", async () => {
    const persistence = createInMemoryPersistence();
    const template = await addTemplate(
      persistence,
      "Easy Spin",
      "cycling",
      makeKrd()
    );

    const record = await scheduleTemplate(persistence, {
      templateId: template.id,
      date: "2026-05-05",
    });

    const stored = await persistence.workouts.getById(record.id);
    expect(stored).toEqual(record);
  });

  it("throws when the template id is unknown", async () => {
    const persistence = createInMemoryPersistence();

    await expect(
      scheduleTemplate(persistence, {
        templateId: "missing",
        date: "2026-05-04",
      })
    ).rejects.toThrow(/Template not found/);
  });

  it("propagates rejections from persistence", async () => {
    const persistence = createInMemoryPersistence();
    const template = await addTemplate(persistence, "Z2", "running", makeKrd());
    persistence.workouts.put = () => Promise.reject(new Error("simulated"));

    await expect(
      scheduleTemplate(persistence, {
        templateId: template.id,
        date: "2026-05-04",
      })
    ).rejects.toThrow("simulated");
  });
});
