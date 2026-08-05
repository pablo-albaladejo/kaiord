/**
 * The line that answers "why does this interval say 241–281 W".
 *
 * It states only what the profile actually records. `Profile` carries an
 * `updatedAt` for the whole record and no per-threshold source, so the copy
 * says "updated {when}" and never "from Garmin, 4 days ago" — a provenance
 * the data cannot support would be a supposition dressed as a fact.
 */

import type { Translate } from "../../../i18n/use-translate";
import { thresholdsForSport } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { formatRelativeTime } from "../../../utils/format-relative-time";

export function buildFtpProvenance(
  profile: Profile | null | undefined,
  sport: string,
  sportLabel: string,
  editorT: Translate,
  commonT: Translate,
  now: Date
): string {
  // `thresholdsForSport` indexes `sportZones` directly, so a profile row
  // written before per-sport zones existed would throw rather than answer
  // "no FTP". Ask whether the map is there before asking it anything.
  const ftp = profile?.sportZones
    ? thresholdsForSport(profile, sport).ftp
    : undefined;
  if (ftp === undefined) {
    return editorT("shape.noThreshold", { sport: sportLabel });
  }

  const updatedAt = profile?.updatedAt;
  if (updatedAt === undefined) {
    return editorT("shape.zonesFromNoDate", { ftp });
  }

  const relative = formatRelativeTime(new Date(updatedAt), now);
  return editorT("shape.zonesFrom", {
    ftp,
    when: commonT(relative.key, relative.params),
  });
}
