import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// A write carries only what the App's Garmin Connector builds, refused with
// nothing sent otherwise:
// - `fit-file`: the body-composition upload @kaiord/fit encodes
//   (encodeBodyCompositionFit: a `file_id` of file type 9, "weight", and one
//   `weight_scale` message). test/fixtures/body-composition-upload.fit is
//   that encoder's output; test-fixtures/fit holds Garmin SDK samples.
// - `workout`: the GCN @kaiord/garmin's writer builds (writeGcn in the App).
//   test/fixtures/*.gcn.json are that writer's output.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const UPLOAD = "/upload-service/upload/.fit";
const WORKOUT_PATH = "/workout-service/workout";
const HERE = import.meta.dirname;
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const bytesOf = (path) => Array.from(readFileSync(path));
const BODY_FIT = () =>
  bytesOf(join(HERE, "fixtures/body-composition-upload.fit"));
const SDK_FIT = (name) =>
  bytesOf(join(HERE, "../../../test-fixtures/fit", name));
const gcn = (name) =>
  JSON.parse(readFileSync(join(HERE, "fixtures", name), "utf8"));

const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const ok = () => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json" },
  text: () => Promise.resolve("{}"),
});

const post = (path, body) =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "POST", path, body }, APP, resolve);
  });

const REFUSED = {
  ok: false,
  protocolVersion: 2,
  error: "Request not allowed",
  retryable: false,
};

describe("Garmin fit-file: only the body-composition upload", () => {
  beforeEach(async () => {
    __resetChromeMock();
    await seedTokens();
    fetch.mockResolvedValue(ok());
  });
  afterEach(() => vi.restoreAllMocks());

  it("should send the FIT file the App's body-composition encoder builds", async () => {
    // Arrange
    const body = BODY_FIT();

    // Act
    const res = await post(UPLOAD, body);

    // Assert
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a large activity file", () => SDK_FIT("Activity.fit")],
    ["a settings file", () => SDK_FIT("Settings.fit")],
    ["a workout file", () => SDK_FIT("WorkoutIndividualSteps.fit")],
    ["a truncated activity file", () => SDK_FIT("activity_truncated.fit")],
    [
      "a weight file with a user profile in it",
      () => SDK_FIT("WeightScaleSingleUser.fit"),
    ],
  ])("should refuse %s with nothing sent", async (_case, body) => {
    // Arrange
    const bytes = body();

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse an activity FIT file with nothing sent", async () => {
    // Arrange
    const bytes = SDK_FIT("activity_poolswim.fit");

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse the upload cut short by one byte", async () => {
    // Arrange
    const bytes = BODY_FIT().slice(0, -1);

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse the upload with one data byte changed", async () => {
    // Arrange
    const bytes = BODY_FIT();
    bytes[bytes.length - 4] ^= 0xff;

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse a header that only spells .FIT", async () => {
    // Arrange
    const bytes = new Array(16).fill(0);
    bytes[0] = 14;
    [..."FIT"].forEach((c, i) => (bytes[9 + i] = c.charCodeAt(0)));
    bytes[8] = ".".charCodeAt(0);

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse a body larger than one measurement could be", async () => {
    // Arrange
    const bytes = BODY_FIT().concat(new Array(8192).fill(0));

    // Act
    const res = await post(UPLOAD, bytes);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Garmin workout: only the GCN the App's writer builds", () => {
  beforeEach(async () => {
    __resetChromeMock();
    await seedTokens();
    fetch.mockResolvedValue(ok());
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["workout-repeat-steps.gcn.json"],
    ["workout-custom-targets.gcn.json"],
    ["workout-swim-strokes.gcn.json"],
  ])("should send the writer's %s", async (name) => {
    // Arrange
    const body = gcn(name);

    // Act
    const res = await post(WORKOUT_PATH, body);

    // Assert
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should send a workout that carries the coach's text as its description", async () => {
    // Arrange
    const body = gcn("workout-repeat-steps.gcn.json");
    body.description = "Easy spin, then three hard efforts. Stay seated.";

    // Act
    const res = await post(WORKOUT_PATH, body);

    // Assert
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  const firstStep = (w) => w.workoutSegments[0].workoutSteps[0];
  const repeat = (w) =>
    w.workoutSegments[0].workoutSteps.find((s) => s.type === "RepeatGroupDTO");

  it.each([
    ["an unknown key on the workout", (w) => (w.ownerId = 1)],
    ["an unknown key on a step", (w) => (firstStep(w).stepId = 9)],
    ["an unknown step type", (w) => (firstStep(w).type = "OtherDTO")],
    [
      "a string where a number goes",
      (w) => (firstStep(w).endConditionValue = "60"),
    ],
    [
      "a step type key Garmin has not",
      (w) => (firstStep(w).stepType.stepTypeKey = "sprint"),
    ],
    ["a name over 255 characters", (w) => (w.workoutName = "x".repeat(256))],
    [
      "a step description over 256 characters",
      (w) => (firstStep(w).description = "x".repeat(257)),
    ],
    [
      "a description over 1024 characters",
      (w) => (w.description = "x".repeat(1025)),
    ],
    ["a second segment", (w) => w.workoutSegments.push(w.workoutSegments[0])],
    [
      "a repeat inside a repeat",
      (w) => repeat(w).workoutSteps.push(JSON.parse(JSON.stringify(repeat(w)))),
    ],
    [
      "more steps than a workout holds",
      (w) => {
        const steps = w.workoutSegments[0].workoutSteps;
        while (steps.length <= 100) steps.push(firstStep(w));
      },
    ],
  ])(
    "should refuse a workout with %s, with nothing sent",
    async (_case, edit) => {
      // Arrange
      const body = gcn("workout-repeat-steps.gcn.json");
      edit(body);

      // Act
      const res = await post(WORKOUT_PATH, body);

      // Assert
      expect(res).toEqual(REFUSED);
      expect(fetch).not.toHaveBeenCalled();
    }
  );
});
