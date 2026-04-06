import type { Logger } from "@kaiord/core";

import { logLoginResponse } from "./sso-html-diagnostics";
import type { FetchFn } from "./types";
import {
  GARMIN_SSO_EMBED,
  GARMIN_SSO_ORIGIN,
  SIGNIN_URL,
  USER_AGENT_BROWSER,
} from "./urls";

export type LoginResult = { html: string; status: number };

type LoginInput = {
  username: string;
  password: string;
  csrf: string;
  fetchFn: FetchFn;
  logger: Logger;
};

const buildLoginParams = (): URLSearchParams =>
  new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    clientId: "GarminConnect",
    locale: "en",
    gauthHost: GARMIN_SSO_EMBED,
    service: GARMIN_SSO_EMBED,
    source: GARMIN_SSO_EMBED,
    redirectAfterAccountLoginUrl: GARMIN_SSO_EMBED,
    redirectAfterAccountCreationUrl: GARMIN_SSO_EMBED,
  });

export const submitLogin = async (input: LoginInput): Promise<LoginResult> => {
  const { username, password, csrf, fetchFn, logger } = input;
  logger.debug("[SSO] Submitting login");
  const body = new URLSearchParams({
    username,
    password,
    embed: "true",
    _csrf: csrf,
  });
  const loginRes = await fetchFn(`${SIGNIN_URL}?${buildLoginParams()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Dnt: "1",
      Origin: GARMIN_SSO_ORIGIN,
      Referer: SIGNIN_URL,
      "User-Agent": USER_AGENT_BROWSER,
    },
    body: body.toString(),
  });
  const html = await loginRes.text();
  const size = new TextEncoder().encode(html).byteLength;
  logLoginResponse(logger, loginRes.status, size);
  return { html, status: loginRes.status };
};
