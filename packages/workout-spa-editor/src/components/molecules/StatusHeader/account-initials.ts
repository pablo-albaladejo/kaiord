/**
 * Up to two initials for the avatar, or an empty string when there is no
 * name to abbreviate.
 *
 * Empty rather than a placeholder glyph: the caller renders the generic
 * person icon instead. A stand-in character would be text inside a control
 * whose only other text is the profile's name, which reads as a name.
 */
export const accountInitials = (name: string | null): string => {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
};
