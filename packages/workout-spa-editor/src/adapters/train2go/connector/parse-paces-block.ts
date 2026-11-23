import { sliceBetween } from "./details-slices";
import { parseCyclingPaces } from "./parse-cycling-paces";
import { parseMinSecPaces } from "./parse-min-sec-paces";
import type { Train2GoPaces } from "./train2go-zones-payload";

export const parsePacesBlock = (html: string): Train2GoPaces | null => {
  const block = sliceBetween(html, /id="paces-\d+"/, /<\/main>|<\/section>/);
  if (!block) return null;
  const out: Train2GoPaces = {};
  const cycling = parseCyclingPaces(block);
  if (cycling) out.cycling = cycling;
  const running = parseMinSecPaces(block, /sport_id"[^>]+value="1"/);
  if (running) out.running = running;
  const swimming = parseMinSecPaces(block, /sport_id"[^>]+value="2"/);
  if (swimming) out.swimming = swimming;
  return Object.keys(out).length > 0 ? out : null;
};
