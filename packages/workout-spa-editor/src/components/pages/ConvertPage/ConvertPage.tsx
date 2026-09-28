import { useSearch } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import {
  parseConvertParams,
  partialConvertParams,
} from "../../../routing/convert-params";
import { ConvertFlow } from "./ConvertFlow";
import { ConvertFormatPicker } from "./ConvertFormatPicker";
import { formatLabel } from "./format-labels";

/**
 * Standalone converter reached from the docs converter pages through
 * `/convert?from=<fmt>&to=<fmt>` (the query lives in the fragment, so it is
 * read with `useSearch()`). It is deliberately isolated from the editor: the
 * uploaded workout stays in local state, the Zustand workout store and
 * persistence are never touched. Invalid params show the format picker.
 */
export default function ConvertPage() {
  const t = useTranslate("editor");
  const search = useSearch();
  const pair = parseConvertParams(search);
  const heading = pair
    ? t("convert.heading", {
        from: formatLabel(pair.from),
        to: formatLabel(pair.to),
      })
    : t("convert.pickerHeading");

  return (
    <div
      className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6"
      data-testid="convert-page"
    >
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 text-xl font-semibold text-ink-strong"
      >
        {heading}
      </h1>
      <p className="m-0 text-sm text-ink-muted" data-testid="convert-scope">
        {t("convert.scope")}
      </p>
      {pair ? (
        <ConvertFlow key={`${pair.from}-${pair.to}`} pair={pair} />
      ) : (
        <ConvertFormatPicker initial={partialConvertParams(search)} />
      )}
    </div>
  );
}
