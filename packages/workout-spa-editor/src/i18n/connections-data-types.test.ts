import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import en from "./locales/en/connections.json";
import es from "./locales/es/connections.json";

const CATALOGS = [
  ["en", en.dataTypes as Record<string, string>],
  ["es", es.dataTypes as Record<string, string>],
] as const;

describe("connections data-type labels", () => {
  it.each(CATALOGS)(
    "should name every managed data type in %s",
    (_locale, labels) => {
      // Arrange
      // A 14th managed type would otherwise render its raw key inside the
      // "Sends to Kaiord" list with nothing failing.
      const expected = [...managedDataTypes].sort();

      // Act
      const named = Object.keys(labels).sort();

      // Assert
      expect(named).toEqual(expected);
    }
  );
});
