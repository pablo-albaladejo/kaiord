export type SitemapPage = {
  loc: string;
  priority: string;
  sources: string[];
  alternates?: boolean;
};
export type GitProvider = {
  isShallow(): boolean;
  lastCommitDate(paths: string[]): string | null;
};
export declare const PAGES: SitemapPage[];
export declare function createGitProvider(
  git?: (args: string[]) => string | null
): GitProvider;
export declare function buildSitemap(options?: {
  git?: GitProvider;
  env?: Record<string, string | undefined>;
}): string;
