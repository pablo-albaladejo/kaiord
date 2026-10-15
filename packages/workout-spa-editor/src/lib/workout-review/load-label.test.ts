import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { loadLabel } from "./load-label";
import { reviewCopyFor } from "./review-copy";

const ENGLISH_WORDS = /\b(recovery|moderate|hard|very)\b/i;
const RECOVERY_TSS = 10;
const MODERATE_TSS = 60;
const HARD_TSS = 100;
const VERY_HARD_TSS = 200;
const TSS_SAMPLES = [RECOVERY_TSS, MODERATE_TSS, HARD_TSS, VERY_HARD_TSS];

describe("loadLabel", () => {
  beforeAll(async () => {
    await setActiveLocale("es");
  });
  afterAll(async () => {
    await appI18n.changeLanguage("en");
  });

  it("should keep the English wording when no copy is given", () => {
    // Arrange

    // Act
    const labels = TSS_SAMPLES.map((tss) => loadLabel(tss));

    // Assert
    expect(labels).toEqual(["Recovery", "Moderate", "Hard", "Very Hard"]);
  });

  it("should word every band in Spanish with no English words", () => {
    // Arrange
    const copy = reviewCopyFor("es");

    // Act
    const labels = TSS_SAMPLES.map((tss) => loadLabel(tss, copy));

    // Assert
    expect(labels).toEqual(["Recuperación", "Moderada", "Dura", "Muy dura"]);
    for (const label of labels) expect(label).not.toMatch(ENGLISH_WORDS);
  });
});
