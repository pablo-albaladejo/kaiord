export function buildPickerHref(date: string | null): string {
  return date ? `/workout/new?date=${date}` : "/workout/new";
}
