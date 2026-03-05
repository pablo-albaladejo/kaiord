/**
 * Lambda endpoint response fixtures for E2E tests.
 * Covers success and error cases for the Garmin push flow.
 */

export const LAMBDA_SUCCESS = {
  id: "workout-12345",
  name: "Sweet Spot Cycling",
  url: "https://connect.garmin.com/modern/workout/12345",
};

export const LAMBDA_AUTH_ERROR = {
  error: "Garmin authentication failed. Check your credentials.",
};

export const LAMBDA_SERVER_ERROR = {
  error: "Internal server error. Please try again later.",
};
