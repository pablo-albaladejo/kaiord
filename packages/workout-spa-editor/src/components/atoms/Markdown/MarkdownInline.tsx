import type { Inline } from "./parse-inline";

/** Inline tokens as React elements. Text is only ever a React child, so raw
 * HTML in a reply is escaped, never parsed. */
export function MarkdownInline({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, i) => <InlineNode key={i} node={node} />);
}

function InlineNode({ node }: { node: Inline }) {
  switch (node.kind) {
    case "text":
      return node.text;
    case "code":
      return (
        <code className="rounded bg-surface-deep px-1 py-px font-mono text-[0.92em]">
          {node.text}
        </code>
      );
    case "strong":
      return (
        <strong className="font-semibold">
          <MarkdownInline nodes={node.children} />
        </strong>
      );
    case "em":
      return (
        <em>
          <MarkdownInline nodes={node.children} />
        </em>
      );
    case "link":
      return node.href === null ? (
        <MarkdownInline nodes={node.children} />
      ) : (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2"
        >
          <MarkdownInline nodes={node.children} />
        </a>
      );
  }
}
