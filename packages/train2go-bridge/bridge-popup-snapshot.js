/**
 * Kaiord Bridge Core — Popup Snapshot / Athlete Card (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-snapshot.js. Never
 * edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 * Vendored only by bridges with a profile-snapshot feature.
 *
 * Browser-only companion to bridge-popup-utils.js (loaded right after it
 * in popup.html; resolves msg/$/relativeAgo through the shared page
 * scope). Renders the cached-profile athlete card and its freshness
 * messaging.
 */

/* global msg, $, relativeAgo */

// Vendored from @kaiord/core's STALE_SNAPSHOT_THRESHOLD_DAYS.
// Parity is enforced by check-bridge-stale-threshold-parity.
const STALE_SNAPSHOT_THRESHOLD_DAYS = 7;

const isFresh = (snapshot) => {
  if (!snapshot?.receivedAt) return false;
  return (
    Date.now() - snapshot.receivedAt <
    STALE_SNAPSHOT_THRESHOLD_DAYS * 24 * 60 * 60 * 1_000
  );
};

const formatRelative = (epochMs) => {
  const ago = relativeAgo(epochMs);
  return ago ? msg("updatedAgo", [ago]) : msg("updatedJustNow");
};

const collectFields = (snapshot) => {
  const out = [];
  if (snapshot.activeSport) {
    out.push({ label: msg("labelSport"), value: snapshot.activeSport });
  }
  if (snapshot.thresholds?.cycling?.ftp) {
    out.push({ label: "FTP", value: `${snapshot.thresholds.cycling.ftp} W` });
  }
  if (snapshot.thresholds?.running?.thresholdPaceSecPerKm) {
    const s = snapshot.thresholds.running.thresholdPaceSecPerKm;
    out.push({
      label: msg("labelPace"),
      value: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} /km`,
    });
  }
  if (snapshot.heartRate?.lthr) {
    out.push({ label: "LTHR", value: `${snapshot.heartRate.lthr} bpm` });
  }
  if (snapshot.heartRate?.max) {
    out.push({
      label: msg("labelMaxHr"),
      value: `${snapshot.heartRate.max} bpm`,
    });
  }
  if (snapshot.profile?.bodyWeight) {
    out.push({
      label: msg("labelWeight"),
      value: `${snapshot.profile.bodyWeight} kg`,
    });
  }
  return out;
};

const renderAthleteCard = (snapshot) => {
  const region = $("athlete-region");
  region.innerHTML = "";
  if (!snapshot || !isFresh(snapshot)) {
    const el = document.createElement("div");
    el.className = "athlete athlete--placeholder";
    el.textContent = snapshot ? msg("profileStale") : msg("noProfile");
    region.appendChild(el);
    return;
  }
  const fields = collectFields(snapshot);
  if (fields.length === 0) {
    const el = document.createElement("div");
    el.className = "athlete athlete--placeholder";
    el.textContent = msg("noThresholds");
    region.appendChild(el);
    return;
  }
  const grid = document.createElement("div");
  grid.className = fields.length === 1 ? "athlete athlete--single" : "athlete";
  for (const f of fields) {
    const cell = document.createElement("div");
    cell.className = "athlete__cell";
    const label = document.createElement("span");
    label.className = "athlete__label";
    label.textContent = f.label;
    const value = document.createElement("span");
    value.className = "athlete__value";
    value.textContent = f.value;
    cell.append(label, value);
    grid.appendChild(cell);
  }
  const updated = document.createElement("div");
  updated.className = "athlete__updated";
  updated.setAttribute("aria-live", "polite");
  updated.textContent = formatRelative(snapshot.receivedAt);
  grid.appendChild(updated);
  region.appendChild(grid);
};
