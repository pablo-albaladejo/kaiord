/**
 * mapExtractionToDraft — turn a permissive AI lab extraction into the entry
 * form's draft shape (header + rows). A UI-layer concern: it produces
 * `LabRowState` (form state), so it lives beside the form rather than in the
 * application layer. Every extracted value yields exactly one row; keys resolve
 * model-proposed → localized label lookup → free custom key.
 */
import type { LabExtraction, LabExtractionValue } from "@kaiord/ai/agents";
import { customParameterKey, getLabParameter } from "@kaiord/core";
import { type Locale, normalizeLocale } from "@kaiord/i18n";

import type {
  FastingInput,
  LabReportHeaderInput,
} from "../../../../application/lab/build-lab-report";
import {
  formatLabParameterLabel,
  getLabParameterDisplay,
} from "./lab-parameter-display";
import { findParameterByLabel, slugify } from "./lab-parameter-options";
import type { LabRowState } from "./lab-row-model";

export type LabDraftRow = Omit<LabRowState, "rowId">;

export type LabDraft = { header: LabReportHeaderInput; rows: LabDraftRow[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const catalogLabelFor = (key: string, locale: Locale): string => {
  const display = getLabParameterDisplay(key, locale);
  return display ? formatLabParameterLabel(display) : key;
};

const mapFasting = (fasting: boolean | undefined): FastingInput => {
  if (fasting === undefined) return "unspecified";
  return fasting ? "yes" : "no";
};

const mapHeader = (extraction: LabExtraction): LabReportHeaderInput => ({
  date:
    extraction.date && ISO_DATE.test(extraction.date) ? extraction.date : "",
  labName: extraction.labName ?? "",
  fasting: mapFasting(extraction.fasting),
  drawTime: extraction.drawTime ?? "",
  notes: extraction.notes ?? "",
});

const measurementFields = (value: LabExtractionValue) => ({
  valueRaw: value.value != null ? String(value.value) : "",
  unitRaw: value.unit ?? "",
  refLowRaw: value.refLow != null ? String(value.refLow) : "",
  refHighRaw: value.refHigh != null ? String(value.refHigh) : "",
  refTouched:
    value.refLow != null || value.refHigh != null || value.refText != null,
});

const resolveCatalogKey = (
  value: LabExtractionValue,
  locale: Locale
): string | undefined => {
  if (value.parameterKey && getLabParameter(value.parameterKey)) {
    return value.parameterKey;
  }
  return findParameterByLabel(value.label, locale)?.key;
};

const mapRow = (value: LabExtractionValue, locale: Locale): LabDraftRow => {
  const catalogKey = resolveCatalogKey(value, locale);
  if (catalogKey) {
    return {
      mode: "catalog",
      catalogLabel: catalogLabelFor(catalogKey, locale),
      customName: "",
      parameterKey: catalogKey,
      ...measurementFields(value),
    };
  }
  return {
    mode: "custom",
    catalogLabel: "",
    customName: value.label,
    parameterKey: customParameterKey(slugify(value.label)),
    ...measurementFields(value),
  };
};

export const mapExtractionToDraft = (
  extraction: LabExtraction,
  opts: { locale: string }
): LabDraft => {
  const locale = normalizeLocale(opts.locale);
  return {
    header: mapHeader(extraction),
    rows: extraction.values.map((value) => mapRow(value, locale)),
  };
};
