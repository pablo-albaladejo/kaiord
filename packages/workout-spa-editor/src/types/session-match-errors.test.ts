import { describe, expect, it } from "vitest";

import {
  CoachingActivityNotFoundError,
  CrossProfileMatchError,
  ProfileNotFoundError,
  SessionAlreadyMatchedError,
  WorkoutNotFoundError,
} from "./session-match-errors";

describe("session-match error classes", () => {
  it("should carry name and message on SessionAlreadyMatchedError", () => {
    // Arrange

    // Act

    const err = new SessionAlreadyMatchedError("activity already matched");

    // Assert

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SessionAlreadyMatchedError);
    expect(err.name).toBe("SessionAlreadyMatchedError");
    expect(err.message).toBe("activity already matched");
  });

  it("should carry name and message on CrossProfileMatchError", () => {
    // Arrange

    // Act

    const err = new CrossProfileMatchError("activity belongs to p1");

    // Assert

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("CrossProfileMatchError");
    expect(err.message).toBe("activity belongs to p1");
  });

  it("should carry name and message on CoachingActivityNotFoundError", () => {
    // Arrange

    // Act

    const err = new CoachingActivityNotFoundError("p1:train2go:9999");

    // Assert

    expect(err.name).toBe("CoachingActivityNotFoundError");
    expect(err.message).toBe("p1:train2go:9999");
  });

  it("should carry name and message on WorkoutNotFoundError", () => {
    // Arrange

    // Act

    const err = new WorkoutNotFoundError("w-deleted");

    // Assert

    expect(err.name).toBe("WorkoutNotFoundError");
    expect(err.message).toBe("w-deleted");
  });

  it("should carry name and message on ProfileNotFoundError", () => {
    // Arrange

    // Act

    const err = new ProfileNotFoundError("p-deleted");

    // Assert

    expect(err.name).toBe("ProfileNotFoundError");
    expect(err.message).toBe("p-deleted");
  });

  it("should give each error its own constructor for instanceof discrimination", () => {
    // Arrange

    const a = new SessionAlreadyMatchedError("x");

    // Act

    const b = new CrossProfileMatchError("x");

    // Assert

    expect(a).toBeInstanceOf(SessionAlreadyMatchedError);
    expect(a).not.toBeInstanceOf(CrossProfileMatchError);
    expect(b).toBeInstanceOf(CrossProfileMatchError);
    expect(b).not.toBeInstanceOf(SessionAlreadyMatchedError);
  });
});
