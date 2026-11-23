/**
 * The Tanita Connector at the message contract with the extension
 * (docs/adr/0004-thin-bridge-smart-connector.md). The current extension
 * (protocol 2) answers `request` with MyTANITA's raw answer, and telling the
 * export from a login page served in its place is read here; an extension
 * one protocol behind (1) answers the legacy `read-export-csv` itself. The
 * login-page cases are the extension's former ones.
 */
import { afterEach, describe, expect, it } from "vitest";

import { closedListOf, isListed } from "../../test-utils/bridge-closed-list";
import {
  currentExtension,
  previousExtension,
  uninstallFakeExtension,
} from "../../test-utils/fake-bridge-extension";
import { TANITA_EXPORT_PATH } from "./connector/tanita-paths";
import { readTanitaExportCsv, TanitaBridgeError } from "./tanita-transport";

const EXT = "tanita-ext";
const CSV = '"Date","Weight (kg)"\n"2026-07-01","70.5"';
const HTML_PAGE = "<!doctype html><html><body>please sign in</body></html>";
const EXPORT = `GET ${TANITA_EXPORT_PATH}`;

afterEach(() => uninstallFakeExtension());

describe("Tanita Connector, current extension (protocol 2)", () => {
  it("should read the export exactly as MyTANITA sent it", async () => {
    // Arrange
    const sent = currentExtension({
      [EXPORT]: { contentType: "text/csv", body: CSV },
    });

    // Act
    const csv = await readTanitaExportCsv(EXT);

    // Assert
    expect(sent).toEqual([
      { action: "request", method: "GET", path: TANITA_EXPORT_PATH },
    ]);
    expect(csv).toBe(CSV);
  });

  // MyTANITA's verified sign-out is a redirect to /en/user/login
  // (docs/connectors-research/tanita.md), which the extension reports; a 200
  // HTML page in place of the export is no evidence of one.
  it.each([
    ["an html content type", { contentType: "text/html", body: HTML_PAGE }],
    ["a body that is an html page", { contentType: "", body: HTML_PAGE }],
  ])(
    "should say MyTANITA is not answering, not signed out, when it serves a page by %s in place of the export",
    async (_label, reply) => {
      // Arrange
      currentExtension({ [EXPORT]: reply });

      // Act
      const error = await readTanitaExportCsv(EXT).catch((e: unknown) => e);

      // Assert
      expect(error).toBeInstanceOf(TanitaBridgeError);
      expect((error as TanitaBridgeError).needsReauth).toBe(false);
    }
  );

  it("should say MyTANITA is not answering, not signed out, when the extension refuses with a bare 403", async () => {
    // Arrange
    currentExtension({
      [EXPORT]: { refuse: { error: "Request failed: 403", status: 403 } },
    });

    // Act
    const error = await readTanitaExportCsv(EXT).catch((e: unknown) => e);

    // Assert
    expect((error as TanitaBridgeError).needsReauth).toBe(false);
  });

  it("should ask the athlete to sign in when the extension saw the Session bounce", async () => {
    // Arrange
    currentExtension({
      [EXPORT]: { refuse: { error: "Session expired", needsReauth: true } },
    });

    // Act
    const error = await readTanitaExportCsv(EXT).catch((e: unknown) => e);

    // Assert
    expect((error as TanitaBridgeError).needsReauth).toBe(true);
  });

  it("should not call a MyTANITA failure a signed-out Session", async () => {
    // Arrange
    currentExtension({
      [EXPORT]: { refuse: { error: "Request failed: 503", status: 503 } },
    });

    // Act
    const error = await readTanitaExportCsv(EXT).catch((e: unknown) => e);

    // Assert
    expect((error as TanitaBridgeError).needsReauth).toBe(false);
  });
});

describe("Tanita Connector, extension one protocol behind (protocol 1)", () => {
  it("should read the export through the legacy action after the extension refuses the request", async () => {
    // Arrange
    const sent = previousExtension({ "read-export-csv": { csv: CSV } });

    // Act
    const csv = await readTanitaExportCsv(EXT);

    // Assert
    expect(sent.map((m) => m.action)).toEqual(["request", "read-export-csv"]);
    expect(csv).toBe(CSV);
  });
});

describe("Tanita Connector asks only for what the extension's closed list admits", () => {
  it("should build the export request so that the extension's list admits it", () => {
    // Arrange
    const list = closedListOf("tanita-bridge");

    // Act
    const admitted = isListed(list, "GET", TANITA_EXPORT_PATH);

    // Assert
    expect(admitted).toBe(true);
  });
});
