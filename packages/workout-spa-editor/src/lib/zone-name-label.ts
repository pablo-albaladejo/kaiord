import type { Translate } from "../i18n/use-translate";

const NUMBERED = /^Zone (\d+)$/;

const slug = (name: string): string =>
  name
    .replace("₂", "2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** A preset zone name ("Recovery", "Zone 3") in the reader's language; a
    name the athlete typed is theirs and is shown as written. */
export const zoneNameLabel = (name: string, t: Translate): string => {
  const numbered = NUMBERED.exec(name);
  if (numbered) return t("defaultName.zone_n", { n: numbered[1] ?? "" });
  const key = `defaultName.${slug(name)}`;
  const label = t(key);
  return label === key ? name : label;
};

/** A zone method's name; an id no preset owns is the athlete's own table. */
export const zoneMethodLabel = (id: string, t: Translate): string => {
  const key = `methodName.${id}`;
  const label = t(key);
  return label === key ? t("methodName.own") : label;
};
