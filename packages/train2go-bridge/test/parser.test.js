const { readFileSync } = require("fs");
const { join } = require("path");
const {
  parseWeeklyHtml,
  parseDailyHtml,
  parsePingJson,
  decodeEntities,
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
        sport: "gym",
        title: "CORE FASE 3 P1 GYM",
        duration: "15 min",
        workload: 1,
        status: 1,
      });
      expect(activities[1]).toMatchObject({
        id: 17722598,
        date: "2026-04-08",
        sport: "swimming",
        title: "Prog Z2-Z3 (1.200m) + Z5 (200m)",
        duration: "2.40 km",
        workload: 3,
        status: 0,
      });
      expect(activities[2]).toMatchObject({
        id: 17722582,
        date: "2026-04-13",
        sport: "cycling",
        duration: "1:30 h",
        workload: 2,
      });
    });

    it("decodes HTML entities in titles", () => {
      const html = fixture("weekly.html");
      const activities = parseWeeklyHtml(html);
      const cycling = activities.find((a) => a.id === 17722582);
      expect(cycling.title).toBe("15' Z5 INTERVALOS CORTOS");
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

  describe("parseDailyHtml", () => {
    it("extracts activity with full description", () => {
      const html = fixture("daily.html");
      const activities = parseDailyHtml(html);

      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        id: 17722582,
        sport: "cycling",
        title: "15' Z5 INTERVALOS CORTOS",
        duration: "1:30 h",
        workload: 2,
        status: 0,
        completion: 0,
      });
    });

    it("parses rich description with bold markers", () => {
      const html = fixture("daily.html");
      const activities = parseDailyHtml(html);
      const desc = activities[0].description;

      expect(desc).toContain("**Calentamiento:**");
      expect(desc).toContain("**Parte Principal (intervalos cortos):**");
      expect(desc).toContain('6x(30" Z5 a 315w + 30" Z1).');
      expect(desc).toContain("Resto soltando en Z1");
    });

    it("returns empty description for empty activities", () => {
      const html = `<div class="activity activity-default" data-status="0" data-id="123">
        <figure class="icon icon-sportsgym"></figure>
        <span class="measured">15 min</span>
        <div class="workload workload-default" data-value="1"></div>
        <div class="activity-title"><strong>Test</strong></div>
        <div class="activity-description activity-description-empty"></div>
      </div>`;
      const activities = parseDailyHtml(html);
      expect(activities[0]?.description).toBe("");
    });

    it("returns empty array on null input", () => {
      expect(parseDailyHtml(null)).toEqual([]);
    });
  });

  describe("parsePingJson", () => {
    it("parses active session", () => {
      const json = JSON.parse(fixture("ping-active.json"));
      const result = parsePingJson(json);

      expect(result).toEqual({
        userId: 28035,
        userName: "Pablo",
        sessionActive: true,
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
  });
});
