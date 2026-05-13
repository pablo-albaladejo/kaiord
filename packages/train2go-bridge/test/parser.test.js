const { readFileSync } = require("fs");
const { join } = require("path");
const {
  parseWeeklyHtml,
  parseDailyHtml,
  parsePingJson,
  parseDetailsHtml,
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

    it("should extract description for activity intensities other than default (regression: -medium/-low/-high)", () => {
      // Arrange
      // Real T2G daily HTML labels each activity wrapper with
      // `activity activity-{level}` where {level} matches the
      // workload intensity. The previous split regex anchored on
      // `activity-default` only, so any non-default intensity left
      // `extractDescription` running on an empty slice and returning
      // "". This fixture mirrors the live response Pablo captured for
      // a `-medium` activity.
      const html = `<aside><div class="activity activity-medium  activity-expanded  " data-status="0" data-id="18012835">
        <figure class="icon icon-sportscycling"></figure>
        <span class="measured">1:55 h</span>
        <div class="workload workload-default" data-value="2"></div>
        <div class="activity-title"><strong>Arrancadas</strong></div>
        <div class="activity-description  activity-description-empty ">
          <p>Avituallamiento intraentreno con 60grHC.</p>
          <p><strong>Calentamiento:</strong> 20 Z1 + 15' Z2.</p>
          <p>3x15' Z3 d/5' Z1</p>
        </div>
      </div></aside>`;

      // Act
      const activities = parseDailyHtml(html);

      // Assert
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toContain(
        "Avituallamiento intraentreno"
      );
      expect(activities[0].description).toContain("**Calentamiento:**");
      expect(activities[0].description).toContain("3x15' Z3 d/5' Z1");
    });

    it("should preserve <li> bullet line breaks in description (regression: <ul><li> concatenation)", () => {
      // Arrange
      // Real-world Train2Go HTML ships single-line (no whitespace
      // between tags): `<p>title</p><ul><li>a</li><li>b</li></ul>`.
      // The previous extractDescription only converted `<br>` and the
      // OPENING `<p>` to "\n" before stripping remaining tags, so
      // `</li><li>` concatenated and the closing `</p>` did not break
      // the line ahead of `<ul>`. User-reported symptom:
      //   "3 progresiones de 1' en Z3 → Z4:1' @ 200–220w1' @ 220–240w..."
      const html =
        `<aside><div class="activity activity-medium" data-status="0" data-id="42">` +
        `<figure class="icon icon-sportscycling"></figure>` +
        `<span class="measured">1:55 h</span>` +
        `<div class="workload workload-default" data-value="2"></div>` +
        `<div class="activity-title"><strong>Progresiones</strong></div>` +
        `<div class="activity-description">` +
        `<p>3 progresiones de 1' en Z3 → Z4:</p>` +
        `<ul><li>1' @ 200–220w</li><li>1' @ 220–240w</li><li>1' @ 240–260w</li></ul>` +
        `<p>(Recuperación 1' fácil entre cada una)</p>` +
        `</div></div></aside>`;

      // Act
      const activities = parseDailyHtml(html);

      // Assert
      expect(activities).toHaveLength(1);
      const lines = activities[0].description.split("\n");
      expect(lines).toContain("3 progresiones de 1' en Z3 → Z4:");
      expect(lines).toContain("1' @ 200–220w");
      expect(lines).toContain("1' @ 220–240w");
      expect(lines).toContain("1' @ 240–260w");
      expect(lines).toContain("(Recuperación 1' fácil entre cada una)");
      // No bullet should be concatenated with another bullet or paragraph.
      expect(activities[0].description).not.toMatch(/220w1'/);
      expect(activities[0].description).not.toMatch(/240w1'/);
      expect(activities[0].description).not.toMatch(/260w\(Recup/);
      expect(activities[0].description).not.toMatch(/Z4:1'/);
    });

    it('should not leak the opening tag of the next sibling block into the description (regression: <div class=" trailing fragment)', () => {
      // Arrange
      // The live T2G response has the activity-description block followed
      // by an `activity-hint-ecos` div. The previous lookahead matched the
      // substring "activity-hint-ecos" but the captured chunk reached up
      // to (but not including) that substring — which means the opening
      // `<div class="` of the hint-ecos div leaked through. The strip-divs
      // regex below `extractDescription` only matches complete
      // `<div>...</div>` blocks, so the partial opening tag survived and
      // ended up in the rendered description as a literal `<div class="`.
      const html = `<aside><div class="activity activity-default  activity-expanded  " data-status="0" data-id="1">
        <figure class="icon icon-sportscycling"></figure>
        <span class="measured">1:55 h</span>
        <div class="workload workload-default" data-value="2"></div>
        <div class="activity-title"><strong>Test</strong></div>
        <div class="activity-description  activity-description-empty ">
          <p>Avituallamiento intraentreno con 60grHC</p>
          <p><strong>Calentamiento:</strong> 20 Z1 + 15' Z2.</p>
          <p>10' Soltar Z2-1.</p>
          <div class="activity-hint-ecos d-flex flex-row">
            <div class="activity-hint-ecos-count"><strong>0</strong></div>
          </div>
        </div>
      </div></aside>`;

      // Act
      const activities = parseDailyHtml(html);

      // Assert
      expect(activities).toHaveLength(1);
      expect(activities[0].description).not.toContain("<div");
      expect(activities[0].description).not.toContain("class=");
      expect(activities[0].description).toContain("Avituallamiento");
      expect(activities[0].description).toContain("Soltar Z2-1");
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

  describe("parseDetailsHtml", () => {
    // FORBIDDEN_KEYS — keys that MUST NOT appear at any depth in the
    // parsed output. `bpmRest` is REMOVED from this set in the
    // full-bands change (now allowlisted under physiological.bpmRest
    // per D-FB8). The DOM-level snake_case `bpm_rest` is still
    // forbidden — only the camelCased emit form is valid.
    const FORBIDDEN_KEYS = new Set([
      "gender",
      "birthday",
      "fat",
      "smoker",
      "imc",
      "bpm_rest",
      "user_notes",
      "userNotes",
      "notes",
      "coach",
      "email",
      "records",
      "tests",
      "height",
    ]);

    const walkAndCollectKeys = (node, acc = new Set()) => {
      if (node === null || typeof node !== "object") return acc;
      if (Array.isArray(node)) {
        for (const child of node) walkAndCollectKeys(child, acc);
        return acc;
      }
      for (const key of Object.keys(node)) {
        acc.add(key);
        walkAndCollectKeys(node[key], acc);
      }
      return acc;
    };

    it("should extract physiological / paces / hrZones from the live-shape fixture (full Z1-Z5 bands)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      // Physiological now includes bpmRest (D-FB8 allowlist).
      expect(result.physiological).toEqual({
        weight: 83,
        bpmMax: 187,
        bpmRest: 51,
      });

      // Cycling pace block carries WATTS (single integer per bound)
      // with full Z1-Z5 + the existing z4Upper/z5Lower convenience.
      expect(result.paces.cycling).toEqual({
        z1: { lower: 111, upper: 149 },
        z2: { lower: 150, upper: 203 },
        z3: { lower: 204, upper: 239 },
        z4: { lower: 240, upper: 268 },
        z5: { lower: 269, upper: 386 },
        z4Upper: 268,
        z5Lower: 269,
      });

      // Running pace: full Z1-Z5 with {min, sec} bounds + convenience
      // z4Upper.
      expect(result.paces.running.z4).toEqual({
        lower: { min: 4, sec: 44 },
        upper: { min: 4, sec: 10 },
      });
      expect(result.paces.running.z4Upper).toEqual({ min: 4, sec: 10 });

      // Swimming pace: full bands.
      expect(result.paces.swimming.z4).toEqual({
        lower: { min: 1, sec: 39 },
        upper: { min: 1, sec: 32 },
      });
      expect(result.paces.swimming.z4Upper).toEqual({ min: 1, sec: 32 });

      // HR zones: cycling (Specific) + running (Specific) + Generic.
      // Swimming HR is absent in this fixture (no per-sport block).
      expect(result.hrZones.generic.z4).toEqual({ lower: 161, upper: 174 });
      expect(result.hrZones.cycling.z4).toEqual({ lower: 161, upper: 174 });
      expect(result.hrZones.cycling.z4Upper).toBe(174);
      expect(result.hrZones.running.z4).toEqual({ lower: 158, upper: 168 });
      expect(result.hrZones.running.z4Upper).toBe(168);
      expect("swimming" in result.hrZones).toBe(false);
    });

    it("redacts forbidden fields recursively at any nesting depth", () => {
      const html = fixture("details-active.html");

      const result = parseDetailsHtml(html);

      const allKeys = walkAndCollectKeys(result);
      for (const forbidden of FORBIDDEN_KEYS) {
        expect(
          allKeys.has(forbidden),
          `forbidden key "${forbidden}" leaked`
        ).toBe(false);
      }
    });

    it("DOM 0-indexed name=z3_upper maps to payload key z4Upper", () => {
      const html = fixture("details-active.html");

      const result = parseDetailsHtml(html);

      expect(result.hrZones.cycling.z4Upper).toBe(174);
      expect(walkAndCollectKeys(result).has("z3Upper")).toBe(false);
    });

    it("returns an empty object for non-string / empty input", () => {
      expect(parseDetailsHtml(undefined)).toEqual({});
      expect(parseDetailsHtml(null)).toEqual({});
      expect(parseDetailsHtml("")).toEqual({});
    });

    it("should emit paces.cycling z4Upper convenience scalar even when only DOM z3_upper is present (backwards compat for partial forms)", () => {
      // Arrange
      const html = `<main><section class="details">
        <div id="paces-99999" class="details-paces">
          <form action="/api/v2/paces/1"><input name="sport_id" type="hidden" value="3">
            <input name="measurement[z3_upper][0]" type="number" value="268">
          </form>
        </div>
      </section></main>`;

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      // No complete band (z3_lower missing) → no `z4` key emitted,
      // but the convenience scalar `z4Upper` falls back to direct
      // DOM extraction so older fixtures and partial coach configs
      // still surface FTP for the threshold-scalar write path.
      expect(result.paces.cycling).toEqual({ z4Upper: 268 });
    });

    it("should NOT leak z3_upper across sport blocks when running is partially configured", () => {
      // Arrange
      // Regression for CodeRabbit finding 471: running has sport_id=1 but
      // no z3_upper saved yet; the next form (cycling, sport_id=3) has
      // a z3_upper. Without bounded form-slicing, running would silently
      // pick up cycling's value (a real data-corruption bug for triathletes).
      const html = `<main><section class="details">
        <div id="paces-99999" class="details-paces">
          <form action="/api/v2/paces/run"><input name="sport_id" type="hidden" value="1">
            <input name="measurement[z0_lower][0]" type="number" value="06">
            <input name="measurement[z0_lower][1]" type="number" value="34">
          </form>
          <form action="/api/v2/paces/cycle"><input name="sport_id" type="hidden" value="3">
            <input name="measurement[z3_upper][0]" type="number" value="268">
          </form>
        </div>
      </section></main>`;

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.paces.running).toBeUndefined();
      expect(result.paces.cycling).toEqual({ z4Upper: 268 });
    });

    // Tasks 1.3a-1.3h — full Z1-Z5 band coverage, Generic block,
    // swimming-absent-when-not-present, bpm_rest extraction, and an
    // expanded redaction key-walk that asserts the snake_case
    // `bpm_rest` form is never emitted (only camelCased `bpmRest`).

    it("should emit hrZones.generic with all five {lower, upper} bands when the upstream HTML has heart-rate-zone-generic", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.hrZones.generic).toEqual({
        z1: { lower: 107, upper: 133 },
        z2: { lower: 134, upper: 147 },
        z3: { lower: 148, upper: 160 },
        z4: { lower: 161, upper: 174 },
        z5: { lower: 175, upper: 187 },
        z4Upper: 174,
      });
    });

    it("should preserve the z4Upper convenience field on the cycling Specific block alongside the full bands (1.3b)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.hrZones.cycling.z3).toEqual({ lower: 148, upper: 160 });
      expect(result.hrZones.cycling.z4Upper).toBe(174);
    });

    it("should omit hrZones.swimming when no heart-rate-zone-swimming block is present in the upstream HTML (1.3c)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect("swimming" in result.hrZones).toBe(false);
    });

    it("should emit cycling pace bands as integer watts (single value per bound, not min:sec) (1.3d)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.paces.cycling.z1.lower).toBe(111);
      expect(result.paces.cycling.z4.upper).toBe(268);
      expect(result.paces.cycling.z4Upper).toBe(268);
    });

    it("should emit running pace bands as {min, sec} pairs per band (1.3e)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.paces.running.z4.upper).toEqual({ min: 4, sec: 10 });
      expect(result.paces.running.z4Upper).toEqual({ min: 4, sec: 10 });
    });

    it("should emit swimming pace bands as {min, sec} pairs per band (1.3f)", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.paces.swimming.z5.upper).toEqual({ min: 1, sec: 26 });
    });

    it("should extract bpm_rest from the physio block as camelCased bpmRest (1.3g) and never emit the snake_case form", () => {
      // Arrange
      const html = fixture("details-active.html");

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.physiological.bpmRest).toBe(51);
      // Snake_case `bpm_rest` MUST NOT surface at any nesting depth
      // — only the camelCased emit form is permitted (per spec
      // scenario "bpm_rest is allowlisted and emitted (camelCase
      // only)").
      expect(walkAndCollectKeys(result).has("bpm_rest")).toBe(false);
    });

    it("should emit hrZones.swimming as a full Z1-Z5 band object when the upstream HTML has heart-rate-zone-swimming", () => {
      // Arrange
      // Build a minimal HTML that includes a swimming HR Specific
      // block (NOT in the standard fixture — the shipped parser
      // didn't emit this; the full-bands change adds it).
      const html = `<main><section class="details">
        <div id="hrzones-99999" class="details-hrzones">
          <div class="heart-rate-zone heart-rate-zone-swimming">
            <form action="/api/v2/hrzones/swim" class="remote">
              <input name="z0_lower" type="number" value="120" />
              <input name="z0_upper" type="number" value="135" />
              <input name="z1_lower" type="number" value="136" />
              <input name="z1_upper" type="number" value="148" />
              <input name="z2_lower" type="number" value="149" />
              <input name="z2_upper" type="number" value="160" />
              <input name="z3_lower" type="number" value="161" />
              <input name="z3_upper" type="number" value="172" />
              <input name="z4_lower" type="number" value="173" />
              <input name="z4_upper" type="number" value="185" />
            </form>
          </div>
        </div>
      </section></main>`;

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.hrZones.swimming.z1).toEqual({ lower: 120, upper: 135 });
      expect(result.hrZones.swimming.z4).toEqual({ lower: 161, upper: 172 });
      expect(result.hrZones.swimming.z5).toEqual({ lower: 173, upper: 185 });
      expect(result.hrZones.swimming.z4Upper).toBe(172);
    });

    it("should still emit hrZones.generic when the generic block is a sibling of hrzones-{id} (outside the per-user container, as in production T2G)", () => {
      // Arrange
      // Mirrors real T2G: cycling Specific lives INSIDE
      // `<div id="hrzones-{id}">`, while the Generic Karvonen block
      // is rendered as a sibling under <section class="pupil-details">
      // — outside the slice the legacy parseHrZonesBlock used to
      // anchor on. The fix parses Generic from the full HTML.
      // Cycling and Generic use DISTINCT band values so the test
      // would fail if extraction bled across siblings (e.g. cycling
      // accidentally read the generic block or vice versa).
      const html = `<main><section class="pupil-details">
        <div id="hrzones-28035" class="details-hrzones">
          <div class="heart-rate-zone heart-rate-zone-cycling">
            <form action="/api/v2/hrzones/cyc" class="remote">
              <input name="z0_lower" type="number" value="110" />
              <input name="z0_upper" type="number" value="136" />
              <input name="z1_lower" type="number" value="137" />
              <input name="z1_upper" type="number" value="150" />
              <input name="z2_lower" type="number" value="151" />
              <input name="z2_upper" type="number" value="163" />
              <input name="z3_lower" type="number" value="164" />
              <input name="z3_upper" type="number" value="177" />
              <input name="z4_lower" type="number" value="178" />
              <input name="z4_upper" type="number" value="190" />
            </form>
          </div>
        </div>
        <div class="heart-rate-zone heart-rate-zone-generic">
          <form action="/api/v2/hrzones/gen" class="remote">
            <input name="z0_lower" type="number" value="107" />
            <input name="z0_upper" type="number" value="133" />
            <input name="z1_lower" type="number" value="134" />
            <input name="z1_upper" type="number" value="147" />
            <input name="z2_lower" type="number" value="148" />
            <input name="z2_upper" type="number" value="160" />
            <input name="z3_lower" type="number" value="161" />
            <input name="z3_upper" type="number" value="174" />
            <input name="z4_lower" type="number" value="175" />
            <input name="z4_upper" type="number" value="187" />
          </form>
        </div>
      </section></main>`;

      // Act
      const result = parseDetailsHtml(html);

      // Assert
      expect(result.hrZones.generic).toEqual({
        z1: { lower: 107, upper: 133 },
        z2: { lower: 134, upper: 147 },
        z3: { lower: 148, upper: 160 },
        z4: { lower: 161, upper: 174 },
        z5: { lower: 175, upper: 187 },
        z4Upper: 174,
      });
      expect(result.hrZones.cycling.z4).toEqual({ lower: 164, upper: 177 });
      expect(result.hrZones.cycling.z4Upper).toBe(177);
    });
  });
});
