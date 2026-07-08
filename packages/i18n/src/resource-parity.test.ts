import { describe, expect, it } from "vitest";

import { findParityViolations } from "./resource-parity";
import type { LocaleNamespaces } from "./types";

describe("findParityViolations", () => {
  it("should report a key missing from the es catalog", () => {
    // Arrange
    const en: LocaleNamespaces = { labs: { glucose: "Glucose", hdl: "HDL" } };
    const es: LocaleNamespaces = { labs: { glucose: "Glucosa" } };

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([
      { namespace: "labs", keyPath: "hdl", missingIn: "es" },
    ]);
  });

  it("should report a key missing from the en catalog", () => {
    // Arrange
    const en: LocaleNamespaces = { nav: { home: "Home" } };
    const es: LocaleNamespaces = { nav: { home: "Inicio", extra: "Extra" } };

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([
      { namespace: "nav", keyPath: "extra", missingIn: "en" },
    ]);
  });

  it("should traverse nested namespaces to the leaf keys", () => {
    // Arrange
    const en: LocaleNamespaces = {
      editor: { step: { add: "Add", remove: "Remove" } },
    };
    const es: LocaleNamespaces = { editor: { step: { add: "Añadir" } } };

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([
      { namespace: "editor", keyPath: "step.remove", missingIn: "es" },
    ]);
  });

  it("should return no violations for identical key sets", () => {
    // Arrange
    const en: LocaleNamespaces = { common: { ok: "OK", cancel: "Cancel" } };
    const es: LocaleNamespaces = { common: { ok: "OK", cancel: "Cancelar" } };

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([]);
  });
});
