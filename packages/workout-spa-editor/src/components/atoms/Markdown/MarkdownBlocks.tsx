import { MarkdownInline } from "./MarkdownInline";
import { MarkdownTable } from "./MarkdownTable";
import type { Block } from "./parse-blocks";
import { parseInline } from "./parse-inline";

export function MarkdownBlocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((block, i) => <MarkdownBlock key={i} block={block} />);
}

function MarkdownBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p>
          <MarkdownInline nodes={parseInline(block.text)} />
        </p>
      );
    // A reply's heading is a label inside a bubble, not a page outline entry.
    case "heading":
      return (
        <p className="font-semibold text-ink-strong">
          <MarkdownInline nodes={parseInline(block.text)} />
        </p>
      );
    case "code":
      return (
        <pre
          className="overflow-x-auto whitespace-pre rounded-lg bg-surface-deep p-2 font-mono text-[12.5px]"
          tabIndex={0}
        >
          <code>{block.text}</code>
        </pre>
      );
    case "rule":
      return <hr className="border-edge" />;
    case "quote":
      return (
        <blockquote className="space-y-2 border-l-2 border-edge-strong pl-3 text-ink-body">
          <MarkdownBlocks blocks={block.blocks} />
        </blockquote>
      );
    case "list":
      return <MarkdownList {...block} />;
    case "table":
      return <MarkdownTable {...block} />;
  }
}

function MarkdownList({
  ordered,
  start,
  items,
}: Extract<Block, { kind: "list" }>) {
  const children = items.map((item, i) => (
    <li key={i} className="space-y-1">
      <MarkdownBlocks blocks={item} />
    </li>
  ));
  return ordered ? (
    <ol start={start} className="list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ) : (
    <ul className="list-disc space-y-1 pl-5">{children}</ul>
  );
}
