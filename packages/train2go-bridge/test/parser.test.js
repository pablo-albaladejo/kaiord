const { readFileSync } = require("fs");
const { join } = require("path");
const {
  parseWeeklyHtml,
  parsePingJson,
  decodeEntities,
  htmlToPlainText,
} = require("../parser.js");

const fixture = (name) =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

describe("parser", () => {
  describe("decodeEntities", () => {
    it("decodes numeric entities", () => {
      expect(decodeEntities("15&#039; Z5")).toBe("15' Z5");
    });

    it("decodes hex entities", () => {
      expect(decodeEntities("alg&#xFA;n")).toBe("algún");
    });

    it("decodes named entities", () => {
      expect(decodeEntities("A &amp; B &lt; C")).toBe("A & B < C");
    });
  });

  describe("parseWeeklyHtml", () => {
    it("extracts activities from multiple days", () => {
      const html = fixture("weekly.html");
      const activities = parseWeeklyHtml(html);

      expect(activities).toHaveLength(3);
      expect(activities[0]).toMatchObject({
        id: 17722576,
        date: "2026-04-07",
        workload: 1,
        status: 1,
      });
      expect(activities[1]).toMatchObject({
        id: 17722598,
        date: "2026-04-08",
        workload: 3,
        status: 0,
      });
      expect(activities[2]).toMatchObject({
        id: 17722582,
        date: "2026-04-13",
        workload: 2,
      });
    });

    it("skips empty days", () => {
      const html = fixture("weekly.html");
      const activities = parseWeeklyHtml(html);
      const dates = activities.map((a) => a.date);
      expect(dates).not.toContain("2026-04-06");
      expect(dates).not.toContain("2026-04-14");
    });

    it("returns empty array on null input", () => {
      expect(parseWeeklyHtml(null)).toEqual([]);
    });

    it("returns empty array on empty string", () => {
      expect(parseWeeklyHtml("")).toEqual([]);
    });

    it("returns empty array on malformed HTML", () => {
      expect(parseWeeklyHtml("<div>no activities here</div>")).toEqual([]);
    });
  });

  describe("parsePingJson", () => {
    it("parses active session", () => {
      const json = JSON.parse(fixture("ping-active.json"));
      const result = parsePingJson(json);

      expect(result).toEqual({
        userId: 99999,
        userName: "Test",
        sessionActive: true,
        coachName: "Coach",
      });
    });

    it("parses expired session", () => {
      const json = JSON.parse(fixture("ping-expired.json"));
      const result = parsePingJson(json);

      expect(result).toEqual({ sessionActive: false });
    });

    it("handles null input gracefully", () => {
      expect(parsePingJson(null)).toEqual({ sessionActive: false });
    });

    it("extracts coachName from data.user.coach.name when present", () => {
      const json = {
        success: true,
        data: {
          user: { id: 1, name: "P", coach: { name: "Aritz Mardaras" } },
        },
      };
      expect(parsePingJson(json)).toMatchObject({
        userId: 1,
        userName: "P",
        sessionActive: true,
        coachName: "Aritz Mardaras",
      });
    });

    it("extracts coachName from data.user.trainer_name fallback", () => {
      const json = {
        success: true,
        data: { user: { id: 2, name: "Q", trainer_name: "Coach K" } },
      };
      expect(parsePingJson(json)).toMatchObject({ coachName: "Coach K" });
    });

    it("omits coachName when no shape is present", () => {
      const json = {
        success: true,
        data: { user: { id: 3, name: "R" } },
      };
      const result = parsePingJson(json);
      expect(result).not.toHaveProperty("coachName");
      expect(result.sessionActive).toBe(true);
    });

    it("omits coachName for empty string", () => {
      const json = {
        success: true,
        data: { user: { id: 4, name: "S", coach_name: "" } },
      };
      expect(parsePingJson(json)).not.toHaveProperty("coachName");
    });

    it("extracts notes from data.user.user_notes (HTML stripped to text)", () => {
      const json = {
        success: true,
        data: {
          user: {
            id: 5,
            name: "T",
            user_notes:
              "<p>Plan: pablo / pwd</p><p>Test: 200 W FTP</p><h3>Goals</h3><p>Sub-3 marathon</p>",
          },
        },
      };
      const result = parsePingJson(json);
      expect(result.notes).toBe(
        "Plan: pablo / pwd\nTest: 200 W FTP\nGoals\nSub-3 marathon"
      );
    });

    it("omits notes when user_notes is missing or empty", () => {
      const empty = parsePingJson({
        success: true,
        data: { user: { id: 6, name: "U" } },
      });
      const blank = parsePingJson({
        success: true,
        data: { user: { id: 7, name: "V", user_notes: "" } },
      });
      expect(empty).not.toHaveProperty("notes");
      expect(blank).not.toHaveProperty("notes");
    });
  });

  describe("htmlToPlainText", () => {
    it("strips tags and preserves paragraph breaks", () => {
      expect(htmlToPlainText("<p>One</p><p>Two</p>")).toBe("One\nTwo");
    });

    it("converts <br> to newlines", () => {
      expect(htmlToPlainText("a<br>b<br/>c")).toBe("a\nb\nc");
    });

    it("collapses runs of empty lines to a single blank line", () => {
      expect(htmlToPlainText("<p>a</p><p><br></p><p><br></p><p>b</p>")).toBe(
        "a\n\nb"
      );
    });

    it("decodes HTML entities", () => {
      expect(htmlToPlainText("<p>R&amp;D &amp; rest</p>")).toBe("R&D & rest");
    });

    it("strips <script>, <style> and any other arbitrary tags", () => {
      const dirty = "<p>safe</p><script>alert(1)</script><style>x{}</style>";
      const clean = htmlToPlainText(dirty);
      expect(clean).not.toContain("<");
      expect(clean).not.toContain("alert");
      expect(clean).toContain("safe");
    });

    it("returns empty string for non-strings", () => {
      expect(htmlToPlainText(undefined)).toBe("");
      expect(htmlToPlainText(null)).toBe("");
      expect(htmlToPlainText(0)).toBe("");
    });
  });
});
