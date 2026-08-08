/**
 * Canvas Setup Utilities
 *
 * Functions for setting up the canvas for thumbnail generation.
 * Palette is fixed/theme-neutral by design — thumbnails must render
 * consistently regardless of the app's light/dark theme.
 */

import type { ThumbnailConfig } from "./types";

/* Frozen on purpose: a thumbnail is a stored artifact, so it must not depend
   on the theme in force the day it was saved. They are the LIGHT values of
   `--bg-elevated` and `--text-dim`, and `scripts/check-frozen-hex-parity.mjs`
   fails the build if the ramp moves under them. */
const FROZEN_SURFACE = "#f0f0f0";
const FROZEN_PLACEHOLDER_INK = "#747474";

export function createCanvas(config: ThumbnailConfig): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  return canvas;
}

export function getCanvasContext(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  return ctx;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = FROZEN_SURFACE;
  ctx.fillRect(0, 0, width, height);
}

export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
): void {
  ctx.fillStyle = FROZEN_PLACEHOLDER_INK;
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
}
