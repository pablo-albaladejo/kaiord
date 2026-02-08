import { z } from "zod";

export const garminAuthorSchema = z.object({
  userProfilePk: z.number().int().positive(),
  displayName: z.string(),
  fullName: z.string().nullable(),
  profileImgNameLarge: z.string().nullable(),
  profileImgNameMedium: z.string().nullable(),
  profileImgNameSmall: z.string().nullable(),
  userPro: z.boolean(),
  vivokidUser: z.boolean(),
});

export type GarminAuthor = z.infer<typeof garminAuthorSchema>;
