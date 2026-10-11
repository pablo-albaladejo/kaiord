import { describe, expect, it } from "vitest";

import {
  buildNewSessionHref,
  type NewSessionContext,
  type NewSessionMode,
  sheetCloseHref,
} from "./new-session-href";

const FULL: NewSessionContext = {
  date: "2026-10-05",
  week: "2026-W41",
  from: "calendar-day",
  sport: "running",
};

const queryOf = (href: string) =>
  Object.fromEntries(new URLSearchParams(href.split("?")[1] ?? ""));

describe("buildNewSessionHref", () => {
  const MODES: { mode: NewSessionMode; path: string; marker: object }[] = [
    { mode: "sheet", path: "/workout/new", marker: {} },
    { mode: "blank", path: "/workout/new", marker: { source: "scratch" } },
    { mode: "import", path: "/workout/new", marker: { action: "import" } },
    {
      mode: "template",
      path: "/library",
      marker: { source: "template-picker" },
    },
  ];

  it.each(MODES)(
    "should carry date, week and origin into the $mode href",
    ({ mode, path, marker }) => {
      // Arrange
      const context = FULL;

      // Act
      const href = buildNewSessionHref(mode, context);

      // Assert
      expect(href.split("?")[0]).toBe(path);
      expect(queryOf(href)).toMatchObject({
        ...marker,
        date: "2026-10-05",
        week: "2026-W41",
        from: "calendar-day",
      });
    }
  );

  it("should carry the chosen sport only into the blank editor", () => {
    // Arrange
    const context = FULL;

    // Act
    const blank = queryOf(buildNewSessionHref("blank", context));
    const others = (["sheet", "import", "template"] as const).map((m) =>
      queryOf(buildNewSessionHref(m, context))
    );

    // Assert
    expect(blank.sport).toBe("running");
    for (const query of others) expect(query.sport).toBeUndefined();
  });

  it.each(MODES)(
    "should omit absent context from the $mode href",
    ({ mode, path, marker }) => {
      // Arrange
      const context: NewSessionContext = {
        date: null,
        week: null,
        from: null,
      };

      // Act
      const href = buildNewSessionHref(mode, context);

      // Assert
      expect(href.split("?")[0]).toBe(path);
      expect(queryOf(href)).toStrictEqual(marker);
    }
  );

  it("should keep a date-only context date-only", () => {
    // Arrange
    const context: NewSessionContext = { date: "2026-10-05" };

    // Act
    const href = buildNewSessionHref("import", context);

    // Assert
    expect(href).toBe("/workout/new?action=import&date=2026-10-05");
  });
});

describe("sheetCloseHref", () => {
  const CASES: { label: string; input: NewSessionContext; expected: string }[] =
    [
      {
        label: "a dated sheet to the week of that date",
        input: { date: "2026-10-05", from: "calendar-day" },
        expected: "/calendar/2026-W41",
      },
      {
        label: "a dated sheet with no origin to the week of that date",
        input: { date: "2026-10-05" },
        expected: "/calendar/2026-W41",
      },
      {
        label: "a weeked calendar sheet to that week",
        input: { week: "2026-W38", from: "calendar" },
        expected: "/calendar/2026-W38",
      },
      {
        label: "a daily sheet back to the daily page",
        input: { from: "daily" },
        expected: "/daily",
      },
      {
        label: "an impossible date to the calendar home",
        input: { date: "2026-02-31", from: "calendar-day" },
        expected: "/calendar",
      },
      {
        label: "a bare sheet to the calendar home",
        input: {},
        expected: "/calendar",
      },
    ];

  it.each(CASES)("should close $label", ({ input, expected }) => {
    // Arrange
    const context = input;

    // Act
    const href = sheetCloseHref(context);

    // Assert
    expect(href).toBe(expected);
  });

  it("should never close a dated sheet onto the sheet itself", () => {
    // Arrange
    const context: NewSessionContext = {
      date: "2026-10-05",
      from: "calendar-day",
    };

    // Act
    const href = sheetCloseHref(context);

    // Assert
    expect(href.startsWith("/workout/new")).toBe(false);
  });
});
