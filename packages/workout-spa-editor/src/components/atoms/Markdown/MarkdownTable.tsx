import { useTranslate } from "../../../i18n/use-translate";
import { MarkdownInline } from "./MarkdownInline";
import { parseInline } from "./parse-inline";
import type { Align, TableData } from "./parse-table";

const ALIGN_CLASS: Record<NonNullable<Align>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/* A short row is not padded: its last cell spans the missing columns. */
const spanOf = (col: number, cells: number, width: number) =>
  col === cells - 1 && cells < width ? width - cells + 1 : undefined;

const CELL = "whitespace-nowrap border border-edge px-2 py-1";

/** A table scrolls inside its own box, so a wide one never widens the bubble
 * or the page. The box is focusable so the keyboard can scroll it too. */
export function MarkdownTable({ align, head, rows }: TableData) {
  const t = useTranslate("common");
  const cellClass = (col: number) =>
    `${CELL} ${ALIGN_CLASS[align[col] ?? "left"]}`;
  return (
    <div
      className="max-w-full overflow-x-auto"
      role="region"
      aria-label={t("markdown.table")}
      tabIndex={0}
      data-testid="markdown-table-scroll"
    >
      <table className="border-collapse text-[13px]">
        <thead className="bg-surface-deep">
          <tr>
            {head.map((cell, col) => (
              <th key={col} className={`${cellClass(col)} font-semibold`}>
                <MarkdownInline nodes={parseInline(cell)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, col) => (
                <td
                  key={col}
                  className={cellClass(col)}
                  colSpan={spanOf(col, row.length, head.length)}
                >
                  <MarkdownInline nodes={parseInline(cell)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
