import { getProfileFields } from "./profile-fields";

/**
 * Returns the message with its profile fields in field-number order, then
 * every other key (`mesgNum`, sub-field names, `developerFields`) as given.
 *
 * The SDK Encoder writes a message's values in its own key order, but reuses
 * the previous definition when the field SET is equal (`MesgDefinition.equals`
 * ignores order). Two messages with the same fields in a different key order
 * would therefore be written with values in the wrong slots.
 */
export const orderFieldsByProfile = (
  mesgNum: number,
  message: Record<string, unknown>
): Record<string, unknown> => {
  const fieldNums = new Map(
    getProfileFields(mesgNum).map((field) => [field.name, field.num])
  );
  const keys = Object.keys(message);
  const fieldKeys = keys
    .filter((key) => fieldNums.has(key))
    .sort((a, b) => fieldNums.get(a)! - fieldNums.get(b)!);
  const otherKeys = keys.filter((key) => !fieldNums.has(key));
  return Object.fromEntries(
    [...fieldKeys, ...otherKeys].map((key) => [key, message[key]])
  );
};
