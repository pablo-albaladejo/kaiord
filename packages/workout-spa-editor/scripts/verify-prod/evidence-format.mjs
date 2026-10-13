// Compact text rendering of the evidence collected per session.
import { isHashedAsset } from "./evidence.mjs";

export function hasAssetFailure(sessions) {
  return sessions.some((e) =>
    e.failedRequests.some((r) => isHashedAsset(r.url))
  );
}

const LIMIT = 12;

function section(title, items) {
  if (items.length === 0) return [`    ${title}: none`];
  const shown = items.slice(0, LIMIT);
  const more = items.length - shown.length;
  return [
    `    ${title}:`,
    ...shown.map((i) => `      ${i}`),
    ...(more > 0 ? [`      ... ${more} more`] : []),
  ];
}

export function formatEvidence(name, sessions) {
  const lines = [`  evidence for ${name}:`];
  if (hasAssetFailure(sessions)) {
    lines.push("    ! asset 404 during propagation (hashed /app/assets/ file)");
  }
  sessions.forEach((e, i) => {
    if (sessions.length > 1) lines.push(`    session ${i + 1}:`);
    lines.push(
      ...section(
        "navigations",
        e.navigations.map((n) => `+${n.ms}ms ${n.url}`)
      ),
      ...section(
        "failed requests",
        e.failedRequests.map((r) => `${r.what} ${r.url}`)
      ),
      ...section("errors", e.errors)
    );
  });
  return lines.join("\n");
}
