/**
 * Body weight and height are stored in kilograms and centimetres. These
 * convert to and from the active units for input fields, rounded to one
 * decimal so a value typed in pounds or inches survives the round trip.
 */

import type { Units } from "../../types/user-preferences";
import { convertKg } from "./units";

const CM_PER_INCH = 2.54;

const round1 = (value: number): number => Math.round(value * 10) / 10;

export const heightUnitLabel = (units: Units): string =>
  units === "imperial" ? "in" : "cm";

export const weightToDisplay = (
  kg: number | undefined,
  units: Units
): number | undefined =>
  kg === undefined ? undefined : round1(convertKg(kg, units));

export const weightFromDisplay = (
  shown: number | undefined,
  units: Units
): number | undefined =>
  shown === undefined ? undefined : shown / convertKg(1, units);

export const heightToDisplay = (
  cm: number | undefined,
  units: Units
): number | undefined => {
  if (cm === undefined) return undefined;
  return round1(units === "imperial" ? cm / CM_PER_INCH : cm);
};

export const heightFromDisplay = (
  shown: number | undefined,
  units: Units
): number | undefined => {
  if (shown === undefined) return undefined;
  return units === "imperial" ? shown * CM_PER_INCH : shown;
};
