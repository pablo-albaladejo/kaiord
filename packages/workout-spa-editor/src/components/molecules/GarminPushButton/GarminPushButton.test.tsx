import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GarminPushButton } from "./GarminPushButton";
import { useGarminStore } from "../../../store/garmin-store";

describe("GarminPushButton", () => {
  beforeEach(() => {
    useGarminStore.setState({
      username: "",
      password: "",
      lambdaUrl: "https://test123.execute-api.eu-west-1.amazonaws.com/push",
      push: { status: "idle" },
    });
  });

  it("should show configure button when no credentials", () => {
    render(<GarminPushButton />);

    expect(screen.getByText("Configure Garmin")).toBeInTheDocument();
  });

  it("should show configure button when Lambda URL is empty", () => {
    useGarminStore.setState({ lambdaUrl: "" });
    useGarminStore.getState().setCredentials("user@test.com", "pass");

    render(<GarminPushButton />);

    expect(screen.getByText("Configure Garmin")).toBeInTheDocument();
  });

  it("should show push button when credentials exist", () => {
    useGarminStore.getState().setCredentials("user@test.com", "pass");

    render(<GarminPushButton />);

    expect(screen.getByText("Push to Garmin")).toBeInTheDocument();
  });

  it("should show success link after push", () => {
    useGarminStore.getState().setCredentials("user@test.com", "pass");
    useGarminStore.setState({
      push: {
        status: "success",
        id: "123",
        name: "Test",
        url: "https://connect.garmin.com/modern/workout/123",
      },
    });

    render(<GarminPushButton />);

    expect(screen.getByText("Open in Garmin Connect")).toBeInTheDocument();
  });

  it("should show error message on push failure", () => {
    useGarminStore.getState().setCredentials("user@test.com", "pass");
    useGarminStore.setState({
      push: { status: "error", message: "Garmin authentication failed" },
    });

    render(<GarminPushButton />);

    expect(
      screen.getByText(/Garmin authentication failed/)
    ).toBeInTheDocument();
  });

  it("should show check credentials link on auth error", () => {
    useGarminStore.getState().setCredentials("user@test.com", "pass");
    useGarminStore.setState({
      push: { status: "error", message: "Garmin authentication failed" },
    });

    render(<GarminPushButton />);

    expect(screen.getByText("check credentials")).toBeInTheDocument();
  });
});
