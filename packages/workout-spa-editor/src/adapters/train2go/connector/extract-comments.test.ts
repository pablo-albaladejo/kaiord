import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { extractComments } from "./extract-comments";

const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

const WELL_FORMED_COMMENT_COUNT = 3;

describe("extractComments", () => {
  it("should parse a coach comment with author, timestamp and body", () => {
    // Arrange
    const html = fixture("daily-with-comments.html");

    // Act
    const comments = extractComments(html);

    // Assert
    expect(comments[0]).toEqual({
      author: "Daniel Blanco Galindo",
      isOwn: false,
      timestamp: "2026-06-01 17:26:22",
      text: "Notas recordatorio para el día de la prueba:\nNos hidratamos con agua nada más despertar.",
    });
  });

  it("should mark a comment with a delete button as own and linkify its body", () => {
    // Arrange
    const html = fixture("daily-with-comments.html");

    // Act
    const comments = extractComments(html);
    const own = comments.find((c) => c.isOwn);

    // Assert
    expect(own).toMatchObject({
      author: "Pablo Albaladejo",
      isOwn: true,
      timestamp: "2026-06-07 22:55:38",
      text: "[connect.garmin.com](https://connect.garmin.com/app/activity/23160614260)",
    });
  });

  it("should preserve DOM order and skip malformed entries without a timestamp", () => {
    // Arrange
    const html = fixture("daily-with-comments.html");

    // Act
    const comments = extractComments(html);

    // Assert
    // 4 comment divs in the fixture; the one without <time> is skipped.
    expect(comments).toHaveLength(WELL_FORMED_COMMENT_COUNT);
    expect(comments.map((c) => c.author)).toEqual([
      "Daniel Blanco Galindo",
      "Pablo Albaladejo",
      "Daniel Blanco Galindo",
    ]);
    expect(comments.some((c) => c.text.includes("no timestamp"))).toBe(false);
  });

  it("should never include avatar image URLs in the output", () => {
    // Arrange
    const html = fixture("daily-with-comments.html");

    // Act
    const comments = extractComments(html);

    // Assert
    const serialized = JSON.stringify(comments);
    expect(serialized).not.toContain("avatars");
    expect(serialized).not.toContain("cloudfront");
    expect(serialized).not.toContain(".png");
    expect(serialized).not.toContain(".jpg");
  });

  it("should return an empty array when there is no comments block", () => {
    // Arrange
    const html = fixture("daily.html");

    // Act
    const comments = extractComments(html);

    // Assert
    expect(comments).toEqual([]);
  });

  it("should return an empty array for null or empty input", () => {
    // Arrange
    const inputs = [null, undefined, ""];

    // Act
    const results = inputs.map((i) => extractComments(i));

    // Assert
    expect(results).toEqual([[], [], []]);
  });
});
