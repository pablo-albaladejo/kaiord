import { describe, expect, it } from "vitest";

import {
  CoachingActivityNotFoundError,
  CrossProfileMatchError,
  ProfileNotFoundError,
  SessionAlreadyMatchedError,
  WorkoutNotFoundError,
} from "./session-match-errors";

describe("session-match error classes", () => {
  it.each<{
    Ctor: new (message: string) => Error;
    name: string;
    message: string;
  }>([
    {
      Ctor: SessionAlreadyMatchedError,
      name: "SessionAlreadyMatchedError",
      message: "activity already matched",
    },
    {
      Ctor: CrossProfileMatchError,
      name: "CrossProfileMatchError",
      message: "activity belongs to p1",
    },
    {
      Ctor: CoachingActivityNotFoundError,
      name: "CoachingActivityNotFoundError",
      message: "p1:train2go:9999",
    },
    {
      Ctor: WorkoutNotFoundError,
      name: "WorkoutNotFoundError",
      message: "w-deleted",
    },
    {
      Ctor: ProfileNotFoundError,
      name: "ProfileNotFoundError",
      message: "p-deleted",
    },
  ])("should carry name and message on $name", ({ Ctor, name, message }) => {
    // Arrange

    // Act
    const err = new Ctor(message);

    // Assert
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(Ctor);
    expect(err.name).toBe(name);
    expect(err.message).toBe(message);
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
