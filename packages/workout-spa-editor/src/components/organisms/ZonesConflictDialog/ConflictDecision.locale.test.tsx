import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { ConflictGroupRadios } from "./ConflictGroupRadios";
import { ConflictRow } from "./ConflictRow";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("zones-sync conflict decisions in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label the group radios in Spanish", () => {
    // Arrange
    const onChange = vi.fn();

    // Act
    render(
      <ConflictGroupRadios
        groupKey="cycling.power"
        decision="reject"
        onChange={onChange}
      />
    );

    // Assert
    expect(screen.getByLabelText("Aceptar Train2Go")).toBeInTheDocument();
    expect(screen.getByLabelText("Mantener actual")).toBeChecked();
  });

  it("should label the scalar row radios in Spanish", () => {
    // Arrange
    const onChange = vi.fn();

    // Act
    render(
      <ConflictRow
        conflict={{
          field: "cycling.thresholds.ftp",
          current: 250,
          incoming: 260,
        }}
        decision="accept"
        onChange={onChange}
      />
    );

    // Assert
    expect(screen.getByLabelText("Aceptar Train2Go")).toBeChecked();
    expect(screen.getByLabelText("Mantener actual")).toBeInTheDocument();
  });
});
