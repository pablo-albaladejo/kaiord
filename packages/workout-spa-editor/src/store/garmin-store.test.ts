import { describe, it, expect, beforeEach } from "vitest";
import { useGarminStore, isValidLambdaUrl } from "./garmin-store";

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

  it("should set custom Lambda URL without validation", () => {
    useGarminStore.getState().setLambdaUrl("https://my.server.com/push");

    expect(useGarminStore.getState().lambdaUrl).toBe(
      "https://my.server.com/push"
    );
  });

  it("should store raw URL string even if invalid", () => {
    useGarminStore.getState().setLambdaUrl("not-a-url");

    expect(useGarminStore.getState().lambdaUrl).toBe("not-a-url");
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

describe("isValidLambdaUrl", () => {
  it("should accept valid HTTPS URL", () => {
    expect(isValidLambdaUrl("https://api.kaiord.com/push")).toBe(true);
  });

  it("should reject invalid URL", () => {
    expect(isValidLambdaUrl("not-a-url")).toBe(false);
  });

  it("should reject HTTP URL for non-localhost", () => {
    expect(isValidLambdaUrl("http://api.kaiord.com/push")).toBe(false);
  });

  it("should accept HTTP for localhost", () => {
    expect(isValidLambdaUrl("http://localhost:3000/push")).toBe(true);
  });

  it("should accept HTTP for 127.0.0.1", () => {
    expect(isValidLambdaUrl("http://127.0.0.1:3000/push")).toBe(true);
  });

  it("should reject empty string", () => {
    expect(isValidLambdaUrl("")).toBe(false);
  });
});
