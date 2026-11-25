/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseDailyHtml } from "./parse-daily-html";

const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

describe("parseDailyHtml", () => {
  it("should extract activity with full description", () => {
    // Arrange
    const html = fixture("daily.html");

    // Act
    const activities = parseDailyHtml(html);

    // Assert
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

  it("should parse rich description with bold markers", () => {
    // Arrange
    const html = fixture("daily.html");

    // Act
    const activities = parseDailyHtml(html);

    // Assert
    const desc = activities[0]?.description;
    expect(desc).toContain("**Calentamiento:**");
    expect(desc).toContain("**Parte Principal (intervalos cortos):**");
    expect(desc).toContain('6x(30" Z5 a 315w + 30" Z1).');
    expect(desc).toContain("Resto soltando en Z1");
  });

  it("should return empty description for empty activities", () => {
    // Arrange
    const html = `<div class="activity activity-default" data-status="0" data-id="123">
        <figure class="icon icon-sportsgym"></figure>
        <span class="measured">15 min</span>
        <div class="workload workload-default" data-value="1"></div>
        <div class="activity-title"><strong>Test</strong></div>
        <div class="activity-description activity-description-empty"></div>
      </div>`;

    // Act
    const activities = parseDailyHtml(html);

    // Assert
    expect(activities[0]?.description).toBe("");
  });

  it("should return empty array on null input", () => {
    // Arrange
    const input = null;

    // Act
    const result = parseDailyHtml(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should extract description for activity intensities other than default (regression: -medium/-low/-high)", () => {
    // Arrange
    // Live T2G wraps each activity as `activity activity-{level}`; a
    // split anchored on `-default` left non-default descriptions empty.
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
    expect(activities[0]?.description).toContain(
      "Avituallamiento intraentreno"
    );
    expect(activities[0]?.description).toContain("**Calentamiento:**");
    expect(activities[0]?.description).toContain("3x15' Z3 d/5' Z1");
  });

  it("should preserve <li> bullet line breaks in description (regression: <ul><li> concatenation)", () => {
    // Arrange
    // Live T2G ships single-line HTML; `</li><li>` must not concatenate.
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
    const description = activities[0]?.description ?? "";
    const lines = description.split("\n");
    expect(lines).toContain("3 progresiones de 1' en Z3 → Z4:");
    expect(lines).toContain("1' @ 200–220w");
    expect(lines).toContain("1' @ 220–240w");
    expect(lines).toContain("1' @ 240–260w");
    expect(lines).toContain("(Recuperación 1' fácil entre cada una)");
    expect(description).not.toMatch(/220w1'/);
    expect(description).not.toMatch(/240w1'/);
    expect(description).not.toMatch(/260w\(Recup/);
    expect(description).not.toMatch(/Z4:1'/);
  });

  it('should not leak the opening tag of the next sibling block into the description (regression: <div class=" trailing fragment)', () => {
    // Arrange
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
    expect(activities[0]?.description).not.toContain("<div");
    expect(activities[0]?.description).not.toContain("class=");
    expect(activities[0]?.description).toContain("Avituallamiento");
    expect(activities[0]?.description).toContain("Soltar Z2-1");
  });

  it("should preserve description hyperlinks as markdown links (links change)", () => {
    // Arrange
    const html = fixture("daily-with-links.html");

    // Act
    const activities = parseDailyHtml(html);

    // Assert
    expect(activities).toHaveLength(1);
    const desc = activities[0]?.description;
    expect(desc).toContain("[vídeo técnica](https://youtu.be/abc123)");
    expect(desc).toContain("[Dropbox](https://www.dropbox.com/s/xyz)");
    expect(desc).not.toContain("<a");
    expect(desc).not.toContain("href");
  });

  it("should degrade an anchor without href to plain text (links change)", () => {
    // Arrange
    const html = fixture("daily-with-links.html");

    // Act
    const activities = parseDailyHtml(html);

    // Assert
    const desc = activities[0]?.description;
    expect(desc).toContain("Ver vídeo sin enlace");
    expect(desc).not.toContain("[vídeo]");
  });

  it("should decode entity-encoded hrefs in markdown links (links change)", () => {
    // Arrange
    const html =
      `<aside><div class="activity activity-default" data-status="0" data-id="7">` +
      `<div class="activity-title"><strong>X</strong></div>` +
      `<div class="activity-description">` +
      `<p>Vídeo <a href="https://youtu.be/x?t=1&amp;list=ab">aquí</a></p>` +
      `</div></div></aside>`;

    // Act
    const activities = parseDailyHtml(html);

    // Assert
    expect(activities[0]?.description).toContain(
      "[aquí](https://youtu.be/x?t=1&list=ab)"
    );
  });

  it("should carry the session's structured steps next to its description", () => {
    // Arrange
    const html = fixture("daily-with-steps.html");

    // Act
    const [activity] = parseDailyHtml(html);

    // Assert
    expect(activity?.description).toBe(
      'Rodaje de prueba siguiendo las zonas de potencia.\nIncluye 3 x 30" de pedalada a una pierna.'
    );
    expect(activity?.steps).toHaveLength(19);
    expect(activity?.steps?.[1]).toMatchObject({ repeat: 5 });
  });

  it("should carry no steps for a session without a steps grid", () => {
    // Arrange
    const html = fixture("daily.html");

    // Act
    const [activity] = parseDailyHtml(html);

    // Assert
    expect(activity).not.toHaveProperty("steps");
  });
});
