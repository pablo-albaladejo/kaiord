import { parseHrZonesBlock } from "./parse-hr-zones-block";
import { parsePacesBlock } from "./parse-paces-block";
import { parsePhysioBlock } from "./parse-physio-block";
import type { Train2GoZonesPayload } from "./train2go-zones-payload";

// Allowlist by construction: only the fields below are ever emitted;
// everything else on the `/user/details` page is dropped at parse time.
export const parseDetailsHtml = (html: unknown): Train2GoZonesPayload => {
  if (typeof html !== "string" || html.length === 0) return {};
  const out: Train2GoZonesPayload = {};
  const physiological = parsePhysioBlock(html);
  if (physiological) out.physiological = physiological;
  const paces = parsePacesBlock(html);
  if (paces) out.paces = paces;
  const hrZones = parseHrZonesBlock(html);
  if (hrZones) out.hrZones = hrZones;
  return out;
};
