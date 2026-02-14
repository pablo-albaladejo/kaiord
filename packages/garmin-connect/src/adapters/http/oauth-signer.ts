import { createHmac } from "node:crypto";
import OAuth from "oauth-1.0a";
import type { OAuthConsumer } from "./types";

export type { OAuthConsumer } from "./types";
export type OAuthToken = { key: string; secret: string };

export type OAuthSigner = {
  toHeader: (
    request: { url: string; method: string },
    token?: OAuthToken
  ) => Record<string, string>;
};

export const createOAuthSigner = (consumer: OAuthConsumer): OAuthSigner => {
  const oauth = new OAuth({
    consumer,
    signature_method: "HMAC-SHA1",
    hash_function(baseString: string, key: string) {
      return createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  return {
    toHeader: (request, token) => {
      const authorized = token
        ? oauth.authorize(request, token)
        : oauth.authorize(request);
      const header = oauth.toHeader(authorized);
      return Object.fromEntries(Object.entries(header));
    },
  };
};
