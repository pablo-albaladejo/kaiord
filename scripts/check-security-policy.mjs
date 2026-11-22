#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { failIfAny } from "./lib/guard-failure.mjs";

// SECURITY.md (read on GitHub) and /.well-known/security.txt (RFC 9116, read
// by scanners and researchers) must send a reporter to the same place, and
// security.txt must not go stale: RFC 9116 makes Expires mandatory and a
// security.txt past it is to be treated as absent.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SECURITY_MD = join(ROOT, "SECURITY.md");
export const SECURITY_TXT = join(
  ROOT,
  "packages/landing/public/.well-known/security.txt"
);
const POLICY_URL =
  "https://github.com/pablo-albaladejo/kaiord/blob/main/SECURITY.md";
const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_WITHIN_DAYS = 30;
const MAX_AHEAD_DAYS = 366;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

const fields = (text) => {
  const out = new Map();
  for (const line of text.split("\n")) {
    const match = /^([A-Za-z-]+):\s*(.+?)\s*$/.exec(line);
    if (!match || line.startsWith("#")) continue;
    const name = match[1].toLowerCase();
    out.set(name, [...(out.get(name) ?? []), match[2]]);
  }
  return out;
};

const expiryProblems = (value, now) => {
  const expires = new Date(value ?? "");
  if (!value || Number.isNaN(expires.getTime()))
    return [`security.txt Expires is missing or not a date: ${value}`];
  const days = Math.floor((expires.getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return [`security.txt expired on ${value}; renew it`];
  if (days < RENEW_WITHIN_DAYS)
    return [`security.txt expires in ${days} days (${value}); renew it`];
  if (days > MAX_AHEAD_DAYS)
    return [`security.txt Expires is more than a year ahead (${value})`];
  return [];
};

export function checkSecurityPolicy({ securityMd, securityTxt, now }) {
  const txt = fields(securityTxt);
  const problems = [];
  const contacts = txt.get("contact") ?? [];
  if (contacts.length === 0) problems.push("security.txt has no Contact");
  for (const contact of contacts) {
    if (!securityMd.includes(contact))
      problems.push(`security.txt Contact ${contact} is not in SECURITY.md`);
  }
  if (!(txt.get("policy") ?? []).includes(POLICY_URL))
    problems.push(`security.txt Policy must be ${POLICY_URL}`);
  problems.push(...expiryProblems(txt.get("expires")?.[0], now));
  if (EMAIL.test(securityMd))
    problems.push("SECURITY.md holds an email address");
  if (EMAIL.test(securityTxt))
    problems.push("security.txt holds an email address");
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = checkSecurityPolicy({
    securityMd: readFileSync(SECURITY_MD, "utf8"),
    securityTxt: readFileSync(SECURITY_TXT, "utf8"),
    now: new Date(),
  });
  failIfAny("security policy problem(s)", problems);
  console.log("✅ SECURITY.md and security.txt agree and are current");
}
