export const MAX_PRINTED_NAME = 80;
const PLAIN_NAME = /^[\w@./-]+$/;

/** Names go into the fault text, so only a short, plain one is printed. */
export const printable = (name: unknown) =>
  typeof name === "string" &&
  name.length <= MAX_PRINTED_NAME &&
  PLAIN_NAME.test(name)
    ? name
    : undefined;
