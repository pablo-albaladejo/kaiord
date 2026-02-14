import { z } from "zod";

export const oauth1TokenSchema = z.object({
  oauth_token: z.string(),
  oauth_token_secret: z.string(),
});

export const oauth2TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token_expires_in: z.number(),
  expires_at: z.number(),
});

export const garminTokensSchema = z.object({
  oauth1: oauth1TokenSchema,
  oauth2: oauth2TokenSchema,
});
