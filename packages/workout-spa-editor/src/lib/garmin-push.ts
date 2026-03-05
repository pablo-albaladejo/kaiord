import type { KRD } from "@kaiord/core";

export type GarminPushRequest = {
  krd: KRD;
  garmin: { username: string; password: string };
};

export type GarminPushResponse = {
  id: string;
  name: string;
  url: string;
};

export const pushToGarminLambda = async (
  lambdaUrl: string,
  request: GarminPushRequest
): Promise<GarminPushResponse> => {
  const res = await fetch(lambdaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = (await res.json()) as
    | GarminPushResponse
    | { error: string };

  if (!res.ok) {
    const error = "error" in data ? data.error : `HTTP ${res.status}`;
    throw new Error(error);
  }

  return data as GarminPushResponse;
};
