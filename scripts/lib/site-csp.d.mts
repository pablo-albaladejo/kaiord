export type CspDirectives = Readonly<Record<string, readonly string[]>>;

export declare const SITE_CSP: {
  readonly landing: CspDirectives;
  readonly docs: CspDirectives;
  readonly app: CspDirectives;
};

export declare function inlineScriptHashes(html: string): string[];

export declare function withCsp(
  html: string,
  directives: CspDirectives
): string;

export declare function applySiteCsp(siteDir: string): string[];
