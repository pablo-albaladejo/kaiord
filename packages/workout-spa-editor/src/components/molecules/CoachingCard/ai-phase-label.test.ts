import { beforeAll, describe, expect, it } from "vitest";

import { loadLocaleNamespaces } from "../../../i18n/resources";
import { getTranslate } from "../../../i18n/use-translate";
import { aiPhaseLabel } from "./ai-phase-label";
import type { AiRunProgress } from "./ai-run-progress";

const en = getTranslate("coaching", "en");
const es = getTranslate("coaching", "es");

const run = (update?: AiRunProgress["update"]): AiRunProgress => ({
  modelName: "Claude Sonnet 5",
  startedAt: 0,
  phaseStartedAt: 0,
  update,
});

describe("aiPhaseLabel", () => {
  beforeAll(async () => {
    await loadLocaleNamespaces("es");
  });

  it("should say the request is being prepared before it is sent", () => {
    // Arrange
    const progress = run();

    // Act
    const label = aiPhaseLabel(es, progress);

    // Assert
    expect(label).toBe("Preparando la petición…");
  });

  it("should name the attempt when a schema-repair retry is requested", () => {
    // Arrange
    const progress = run({ phase: "requesting", attempt: 2, maxAttempts: 3 });

    // Act
    const label = aiPhaseLabel(en, progress);

    // Assert
    expect(label).toContain("Asking Claude Sonnet 5 again (attempt 2 of 3)");
  });

  it("should not change while only the streamed count changes", () => {
    // Arrange
    const first = run({
      phase: "generating",
      attempt: 1,
      maxAttempts: 3,
      items: 1,
    });
    const later = run({
      phase: "generating",
      attempt: 1,
      maxAttempts: 3,
      items: 5,
    });

    // Act
    const labels = [aiPhaseLabel(es, first), aiPhaseLabel(es, later)];

    // Assert
    expect(labels).toEqual([
      "Claude Sonnet 5 está escribiendo los pasos…",
      "Claude Sonnet 5 está escribiendo los pasos…",
    ]);
  });

  it("should report validation once the output is complete", () => {
    // Arrange
    const progress = run({ phase: "validating", attempt: 1, maxAttempts: 3 });

    // Act
    const label = aiPhaseLabel(es, progress);

    // Assert
    expect(label).toBe("Comprobando el entreno…");
  });

  it("should say the model is reasoning before it writes", () => {
    // Arrange
    const progress = run({ phase: "reasoning", attempt: 1, maxAttempts: 3 });

    // Act
    const label = aiPhaseLabel(es, progress);

    // Assert
    expect(label).toBe(
      "Claude Sonnet 5 está analizando cómo se estructura la sesión…"
    );
  });

  it("should say a retry follows an output cut off for length", () => {
    // Arrange
    const progress = run({
      phase: "requesting",
      attempt: 2,
      maxAttempts: 3,
      retryReason: "truncated",
    });

    // Act
    const label = aiPhaseLabel(es, progress);

    // Assert
    expect(label).toBe(
      "La respuesta se cortó por longitud. Volviendo a pedírselo a Claude Sonnet 5 (intento 2 de 3)…"
    );
  });

  it("should say a retry follows a provider error", () => {
    // Arrange
    const progress = run({
      phase: "requesting",
      attempt: 3,
      maxAttempts: 3,
      retryReason: "provider",
    });

    // Act
    const label = aiPhaseLabel(en, progress);

    // Assert
    expect(label).toBe(
      "Claude Sonnet 5 returned an error. Trying again (attempt 3 of 3)…"
    );
  });
});
