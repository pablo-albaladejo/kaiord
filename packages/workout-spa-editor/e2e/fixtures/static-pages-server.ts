import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

// Mimics GitHub Pages' static-host contract for the SPA-on-subpath e2e:
// - Known files: serve with status 200 and a sensible content-type.
// - Unknown paths: serve <root>/404.html with status 404 (no SPA fallback).
// - Path traversal (../) is blocked.
// http-server / serve diverge on at least one of these axes, so we hand-roll.

const MIME = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function contentTypeFor(path: string): string {
  return MIME.get(extname(path).toLowerCase()) ?? "application/octet-stream";
}

export type StaticPagesServer = {
  url: string;
  close: () => Promise<void>;
};

export async function startStaticPagesServer(
  rootDir: string
): Promise<StaticPagesServer> {
  const root = resolve(rootDir);
  const fourOhFour = join(root, "404.html");

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }

    const candidate = normalize(join(root, pathname));
    const isInsideRoot =
      candidate === root ||
      candidate.startsWith(root + "/") ||
      candidate.startsWith(root + "\\");

    if (isInsideRoot && existsSync(candidate) && statSync(candidate).isFile()) {
      const body = readFileSync(candidate);
      res.writeHead(200, { "content-type": contentTypeFor(candidate) });
      res.end(body);
      return;
    }

    if (existsSync(fourOhFour)) {
      const body = readFileSync(fourOhFour);
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(body);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  });

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", () => resolveListen());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind static-pages-server");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((err) => (err ? rejectClose(err) : resolveClose()));
      }),
  };
}
