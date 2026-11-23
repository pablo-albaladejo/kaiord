import { FitParsingError } from "@kaiord/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { getTranslate } from "../../../i18n/use-translate";
import { transformError } from "../../../utils/import-workout-errors";
import { createParseError } from "./file-parser";
import { MAX_FILE_SIZE_BYTES, validateFileSize } from "./file-upload-constants";

describe("import error copy in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should word a converter failure in Spanish around the converter's detail", () => {
    // Arrange
    const error = transformError(new FitParsingError("bad header"), "fit");
    const t = getTranslate("import", "es");

    // Act
    const state = createParseError(error, t);

    // Assert
    expect(state.title).toBe("Error al importar");
    expect(state.message).toBe("No se pudo leer el archivo FIT: bad header");
  });

  it("should word a JSON position failure in Spanish", () => {
    // Arrange
    const error = {
      name: "FileParsingError",
      message: "at position 12",
      line: 3,
      column: 4,
    };
    const t = getTranslate("import", "es");

    // Act
    const state = createParseError(error, t);

    // Assert
    expect(state.title).toBe("Formato de archivo no válido");
    expect(state.message).toBe(
      "No se pudo leer el JSON en la posición 12 (línea 3, columna 4)"
    );
  });

  it("should word a file that is too large in Spanish", () => {
    // Arrange
    const file = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], "big.fit");
    const t = getTranslate("import", "es");

    // Act
    const state = validateFileSize(file, t);

    // Assert
    expect(state?.title).toBe("Archivo demasiado grande");
    expect(state?.message).toBe(
      "El archivo ocupa 10.00 MB y supera el límite de 10 MB. Usa un archivo más pequeño."
    );
  });
});
