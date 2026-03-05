import { describe, it, expect } from "vitest";
import { jsonResponse, errorResponse } from "./response";

describe("jsonResponse", () => {
  it("should return a response with the given status code and serialized body", () => {
    const body = { id: "123", name: "Test" };

    const result = jsonResponse(200, body);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toStrictEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(result.body as string)).toStrictEqual(body);
  });

  it("should serialize arrays correctly", () => {
    const body = [1, 2, 3];

    const result = jsonResponse(200, body);

    expect(JSON.parse(result.body as string)).toStrictEqual([1, 2, 3]);
  });

  it("should handle different status codes", () => {
    const result = jsonResponse(404, { message: "not found" });

    expect(result.statusCode).toBe(404);
  });

  it("should handle null body", () => {
    const result = jsonResponse(204, null);

    expect(result.body).toBe("null");
  });
});

describe("errorResponse", () => {
  it("should return a response with error field", () => {
    const result = errorResponse(400, "Bad request");

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string)).toStrictEqual({
      error: "Bad request",
    });
  });

  it("should return 500 for server errors", () => {
    const result = errorResponse(500, "Internal server error");

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body as string)).toStrictEqual({
      error: "Internal server error",
    });
  });

  it("should include Content-Type header", () => {
    const result = errorResponse(401, "Unauthorized");

    expect(result.headers).toStrictEqual({ "Content-Type": "application/json" });
  });
});
