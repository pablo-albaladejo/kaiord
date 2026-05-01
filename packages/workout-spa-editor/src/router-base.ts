export function computeRouterBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}
