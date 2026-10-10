import { Profile, type ProfileField } from "@garmin/fitsdk";

/** The SDK profile's field list for a message number (empty if unknown). */
export const getProfileFields = (mesgNum: number): Array<ProfileField> =>
  Object.values(Profile.messages[mesgNum]?.fields ?? {});
