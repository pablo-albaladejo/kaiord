import { describe, it, expect, beforeEach } from "vitest";

// The promises behind the store listing, the permission justifications and
// the privacy policy, asserted at the message contract the Kaiord App sees:
// where every request goes, what a session check costs, what each answer
// carries, and what the service worker keeps in chrome.storage.local.

require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const EXPORT_URL = "https://mytanita.eu/en/user/export-csv";
const EXPORT_BODY = '"Date","Weight (kg)"\n"2026-11-01","70.5"\n';

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

// MyTANITA as the service worker meets it: a signed-in session that answers
// the export with the athlete's whole history. `reads` counts how many times
// the body was actually read off the wire.
const fakeMyTanita = () => {
  const reads = { count: 0 };
  fetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    type: "basic",
    redirected: false,
    headers: { get: () => "text/csv" },
    text: async () => {
      reads.count += 1;
      return EXPORT_BODY;
    },
  }));
  return reads;
};

const EXTERNAL_MESSAGES = [
  { action: "ping" },
  { action: "checkSession" },
  { action: "read-export-csv" },
  { action: "set-theme", theme: "dark" },
];

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const answersToEveryAction = async () => {
  const answers = [];
  for (const message of EXTERNAL_MESSAGES) answers.push(await send(message));
  return answers;
};

describe("export confinement", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should send every request to the MyTANITA export as a GET, and nothing anywhere else", async () => {
    // Arrange
    fakeMyTanita();

    // Act
    await answersToEveryAction();
    const requests = fetch.mock.calls.map(([url, init]) => [url, init.method]);

    // Assert
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.filter(([url]) => url !== EXPORT_URL)).toEqual([]);
    expect(requests.filter(([, method]) => method !== "GET")).toEqual([]);
  });

  it("should download the whole export to answer a session check, and answer only yes or no", async () => {
    // Arrange
    const reads = fakeMyTanita();

    // Act
    const answer = await send({ action: "checkSession" });

    // Assert
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([EXPORT_URL]);
    expect(reads.count).toBe(1);
    expect(answer.data.authenticated).toBe(true);
    expect(JSON.stringify(answer)).not.toContain("70.5");
  });

  it("should hand the export to the Kaiord App exactly as MyTANITA sent it", async () => {
    // Arrange
    fakeMyTanita();

    // Act
    const answer = await send({ action: "read-export-csv" });

    // Assert
    expect(answer.data).toEqual({ csv: EXPORT_BODY });
  });

  it("should keep only the theme preference in chrome.storage.local, never the export", async () => {
    // Arrange
    fakeMyTanita();

    // Act
    await answersToEveryAction();
    const writes = chrome.storage.local.set.mock.calls.map(([items]) => items);

    // Assert
    expect(writes).toEqual([{ kaiordTheme: "dark" }]);
  });
});
