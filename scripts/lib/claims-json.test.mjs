import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jsonUnits } from "./claims-json.mjs";

describe("claims-json", () => {
  it("should read the message or string at each named key, dotted keys included", () => {
    // Arrange
    const src = JSON.stringify({ a: { message: "One" }, es: { title: "Dos" } });

    // Act
    const result = jsonUnits({ file: "m.json", keys: ["a", "es.title"] }, src);

    // Assert
    assert.deepEqual(result, { units: ["One", "Dos"] });
  });

  it("should read every string value of a keyless file, never its keys", () => {
    // Arrange
    const src = JSON.stringify({
      "Source text": "Texto",
      nested: { k: " Otro  texto " },
    });

    // Act
    const result = jsonUnits({ file: "es.json" }, src);

    // Assert
    assert.deepEqual(result, { units: ["Texto", "Otro texto"] });
  });

  it("should fail on invalid JSON and on a missing or empty key", () => {
    // Arrange
    const surface = { file: "m.json", keys: ["a", "b"] };

    // Act
    const results = [
      jsonUnits(surface, "{"),
      jsonUnits(surface, '{"a":"x","b":""}'),
    ];

    // Assert
    assert.deepEqual(results, [
      { error: "m.json: not valid JSON" },
      { error: "m.json: key(s) b missing" },
    ]);
  });
});
