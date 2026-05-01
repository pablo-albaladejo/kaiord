import { describe, expect, it } from "vitest";

import {
  CoachingActivityNotFoundError,
  CrossProfileMatchError,
  ProfileNotFoundError,
  SessionAlreadyMatchedError,
  WorkoutNotFoundError,
} from "./session-match-errors";

describe("session-match error classes", () => {
  it("SessionAlreadyMatchedError carries name and message", () => {
    const err = new SessionAlreadyMatchedError("activity already matched");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SessionAlreadyMatchedError);
    expect(err.name).toBe("SessionAlreadyMatchedError");
    expect(err.message).toBe("activity already matched");
  });

  it("CrossProfileMatchError carries name and message", () => {
    const err = new CrossProfileMatchError("activity belongs to p1");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("CrossProfileMatchError");
    expect(err.message).toBe("activity belongs to p1");
  });

  it("CoachingActivityNotFoundError carries name and message", () => {
    const err = new CoachingActivityNotFoundError("p1:train2go:9999");

    expect(err.name).toBe("CoachingActivityNotFoundError");
    expect(err.message).toBe("p1:train2go:9999");
  });

  it("WorkoutNotFoundError carries name and message", () => {
    const err = new WorkoutNotFoundError("w-deleted");

    expect(err.name).toBe("WorkoutNotFoundError");
    expect(err.message).toBe("w-deleted");
  });

  it("ProfileNotFoundError carries name and message", () => {
    const err = new ProfileNotFoundError("p-deleted");

    expect(err.name).toBe("ProfileNotFoundError");
    expect(err.message).toBe("p-deleted");
  });

  it("each error has its own constructor for instanceof discrimination", () => {
    const a = new SessionAlreadyMatchedError("x");
    const b = new CrossProfileMatchError("x");

    expect(a).toBeInstanceOf(SessionAlreadyMatchedError);
    expect(a).not.toBeInstanceOf(CrossProfileMatchError);
    expect(b).toBeInstanceOf(CrossProfileMatchError);
    expect(b).not.toBeInstanceOf(SessionAlreadyMatchedError);
  });
});
