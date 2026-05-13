import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addTemplate } from "./add-template";
import { scheduleTemplate } from "./schedule-template";
import { makeKrd } from "./test-fixtures";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000aa";

describe("scheduleTemplate", () => {
  it("should create a workout record from the template on the given date", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const template = await addTemplate(
      persistence,
      "Tempo Ride",
      "cycling",
      makeKrd(),
      { tags: ["tempo", "z3"] }
    );

    // Act
    const record = await scheduleTemplate(persistence, {
      templateId: template.id,
      date: "2026-05-04",
      profileId: PROFILE_ID,
    });

    // Assert
    expect(record.date).toBe("2026-05-04");
    expect(record.sport).toBe("cycling");
    expect(record.source).toBe("kaiord");
    expect(record.state).toBe("structured");
    expect(record.krd).toEqual(template.krd);
    expect(record.tags).toEqual(["tempo", "z3"]);
    expect(record.profileId).toBe(PROFILE_ID);
  });

  it("should persist the workout via PersistencePort.workouts.put", async () => {
    // Arrange
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
      profileId: PROFILE_ID,
    });

    // Act
    const stored = await persistence.workouts.getById(record.id);

    // Assert
    expect(stored).toEqual(record);
    expect(stored?.profileId).toBe(PROFILE_ID);
  });

  it("should throw when the template id is unknown", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      scheduleTemplate(persistence, {
        templateId: "missing",
        date: "2026-05-04",
        profileId: PROFILE_ID,
      })
    ).rejects.toThrow(/Template not found/);
  });

  it("should propagate rejections from persistence", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const template = await addTemplate(persistence, "Z2", "running", makeKrd());

    // Act
    persistence.workouts.put = () => Promise.reject(new Error("simulated"));

    // Assert
    await expect(
      scheduleTemplate(persistence, {
        templateId: template.id,
        date: "2026-05-04",
        profileId: PROFILE_ID,
      })
    ).rejects.toThrow("simulated");
  });
});
