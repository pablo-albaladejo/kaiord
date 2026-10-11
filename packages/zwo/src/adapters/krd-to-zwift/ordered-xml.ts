// fast-xml-parser's default object model groups repeated siblings under one
// key, so it cannot interleave <workout> children; its preserveOrder model
// can. These helpers translate the grouped model ("@_" attributes, arrays for
// repeated elements) into the ordered one.
export type OrderedNode = Record<string, unknown>;

const ORDERED_CHILDREN = Symbol("orderedChildren");

type WithOrderedChildren = { [ORDERED_CHILDREN]: Array<OrderedNode> };

export const withOrderedChildren = (
  children: Array<OrderedNode>
): WithOrderedChildren => ({ [ORDERED_CHILDREN]: children });

const isAttribute = (key: string): boolean => key.startsWith("@_");

const attributesOf = (record: Record<string, unknown>): OrderedNode => {
  const attributes = Object.entries(record).filter(
    ([key, value]) => isAttribute(key) && value !== undefined
  );
  return attributes.length > 0 ? { ":@": Object.fromEntries(attributes) } : {};
};

const toOrderedChildren = (
  record: Record<string, unknown>
): Array<OrderedNode> =>
  Object.entries(record)
    .filter(([key, value]) => !isAttribute(key) && value !== undefined)
    .flatMap(([tag, value]) =>
      (Array.isArray(value) ? value : [value]).map((item) =>
        toOrderedNode(tag, item)
      )
    );

export const toOrderedNode = (tag: string, value: unknown): OrderedNode => {
  if (value === null || typeof value !== "object") {
    return { [tag]: [{ "#text": value }] };
  }
  const record = value as Record<string, unknown>;
  const children =
    (value as Partial<WithOrderedChildren>)[ORDERED_CHILDREN] ??
    toOrderedChildren(record);
  return { [tag]: children, ...attributesOf(record) };
};
