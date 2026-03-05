import { describe, it, expect, beforeEach } from "vitest";
import { useGarminStore } from "./garmin-store";

const resetStore = () =>
  useGarminStore.setState({
    username: "",
    password: "",
    lambdaUrl: "https://api.kaiord.com/push",
    push: { status: "idle" },
  });

describe("garmin-store", () => {
  beforeEach(() => resetStore());

  it("should start with empty credentials", () => {
    const { username, password } = useGarminStore.getState();

    expect(username).toBe("");
    expect(password).toBe("");
  });

  it("should set credentials", () => {
    useGarminStore.getState().setCredentials("user@test.com", "pass");

    const { username, password } = useGarminStore.getState();
    expect(username).toBe("user@test.com");
    expect(password).toBe("pass");
  });

  it("should report hasCredentials correctly", () => {
    expect(useGarminStore.getState().hasCredentials()).toBe(false);

    useGarminStore.getState().setCredentials("u", "p");

    expect(useGarminStore.getState().hasCredentials()).toBe(true);
  });

  it("should clear credentials", () => {
    useGarminStore.getState().setCredentials("u", "p");
    useGarminStore.getState().clearCredentials();

    expect(useGarminStore.getState().hasCredentials()).toBe(false);
  });

  it("should have default Lambda URL", () => {
    expect(useGarminStore.getState().lambdaUrl).toBe(
      "https://api.kaiord.com/push"
    );
  });

  it("should set custom Lambda URL", () => {
    useGarminStore.getState().setLambdaUrl("https://my.server.com/push");

    expect(useGarminStore.getState().lambdaUrl).toBe(
      "https://my.server.com/push"
    );
  });

  it("should reset Lambda URL to default", () => {
    useGarminStore.getState().setLambdaUrl("https://custom.com");
    useGarminStore.getState().resetLambdaUrl();

    expect(useGarminStore.getState().lambdaUrl).toBe(
      "https://api.kaiord.com/push"
    );
  });

  it("should track push state", () => {
    const store = useGarminStore.getState();

    store.setPush({ status: "loading" });
    expect(useGarminStore.getState().push.status).toBe("loading");

    store.setPush({
      status: "success",
      id: "123",
      name: "Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    });
    const push = useGarminStore.getState().push;
    expect(push.status).toBe("success");
    if (push.status === "success") {
      expect(push.id).toBe("123");
    }
  });

  it("should track push error state", () => {
    useGarminStore.getState().setPush({
      status: "error",
      message: "Auth failed",
    });

    const push = useGarminStore.getState().push;
    expect(push.status).toBe("error");
    if (push.status === "error") {
      expect(push.message).toBe("Auth failed");
    }
  });
});
