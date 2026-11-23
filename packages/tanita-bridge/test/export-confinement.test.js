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
// the body was actually read off the wire; a HEAD answer has no body.
const fakeMyTanita = () => {
  const reads = { count: 0 };
  fetch.mockImplementation(async (_url, init) => ({
    ok: true,
    status: 200,
    type: "basic",
    redirected: false,
    headers: { get: () => "application/csvm+json" },
    text: async () => {
      reads.count += 1;
      return init.method === "HEAD" ? "" : EXPORT_BODY;
    },
  }));
  return reads;
};

// MyTANITA with no session: the export bounces to the login page.
const signedOutMyTanita = () => {
  fetch.mockImplementation(async () => ({
    ok: false,
    status: 0,
    type: "opaqueredirect",
    redirected: false,
    headers: { get: () => "" },
    text: async () => "",
  }));
};

const CHECK_KEYS = [
  "authenticated",
  "capabilities",
  "id",
  "name",
  "protocolVersion",
  "session",
  "version",
];

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

  it("should send every request to the MyTANITA export as a GET or a HEAD, and nothing anywhere else", async () => {
    // Arrange
    fakeMyTanita();

    // Act
    await answersToEveryAction();
    const requests = fetch.mock.calls.map(([url, init]) => [url, init.method]);

    // Assert
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.filter(([url]) => url !== EXPORT_URL)).toEqual([]);
    expect(
      requests.filter(([, method]) => method !== "GET" && method !== "HEAD")
    ).toEqual([]);
  });

  it("should check a session with one HEAD of the export, reading no body and answering only yes or no", async () => {
    // Arrange
    const reads = fakeMyTanita();

    // Act
    const answer = await send({ action: "checkSession" });

    // Assert
    expect(fetch.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      [EXPORT_URL, "HEAD"],
    ]);
    expect(reads.count).toBe(0);
    expect(Object.keys(answer.data).sort()).toEqual(CHECK_KEYS);
    expect(answer.data.session).toBe("signed-in");
    expect(answer.data.authenticated).toBe(true);
  });

  it("should report signed out only when MyTANITA bounced the check to its login page", async () => {
    // Arrange
    signedOutMyTanita();

    // Act
    const answer = await send({ action: "checkSession" });

    // Assert
    expect(answer.data.session).toBe("signed-out");
    expect(answer.data.authenticated).toBe(false);
  });

  it("should report that MyTANITA is not answering, never signed out, when the check fails", async () => {
    // Arrange
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    // Act
    const answer = await send({ action: "checkSession" });

    // Assert
    expect(answer.data.session).toBe("not-answering");
    expect(answer.data.authenticated).toBe(false);
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
