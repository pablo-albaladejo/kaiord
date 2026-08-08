/*
 * CloudFront Function (viewer-request) for kaiord.com.
 *
 * S3's REST endpoint — the one an Origin Access Control can reach — serves
 * exactly the key it is asked for. It resolves no directory index and appends
 * no extension, both of which GitHub Pages did for us. Every URL shape the
 * site serves today therefore has to be resolved here, or moving the origin
 * silently 404s pages that work right now.
 *
 * Runtime is cloudfront-js-2.0: ES5-era syntax, no modules, no regex
 * lookbehind. Keep it that way — this file is uploaded verbatim.
 */

// eslint-disable-next-line no-unused-vars -- CloudFront calls this by name.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Anything with a file extension is a real object: assets, sitemap.xml,
  // llms.txt, favicon.svg. Never touch it.
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  if (lastSegment.indexOf(".") !== -1) {
    return request;
  }

  // A trailing slash always means "the index of this directory": `/`, `/es/`,
  // `/docs/`, `/editor/`.
  if (uri.charAt(uri.length - 1) === "/") {
    request.uri = uri + "index.html";
    return request;
  }

  // The editor is a client-routed SPA. Any depth under it — including the
  // unbounded ones, `/editor/workout/<uuid>` and `/editor/calendar/<week>` —
  // is served by its shell, which then reads the path from the URL. This is
  // the rewrite that stops a real URL from answering 404 on the way in.
  if (uri.indexOf("/editor/") === 0) {
    request.uri = "/editor/index.html";
    return request;
  }

  // The docs are built with VitePress `cleanUrls: true`: pages are linked
  // without an extension and stored with one.
  if (uri.indexOf("/docs/") === 0) {
    request.uri = uri + ".html";
    return request;
  }

  // Left over: an extensionless path at the root, which is a directory the
  // site links to with a slash (`/es`). Redirect rather than rewrite, so the
  // canonical URL is the one the address bar keeps — the behaviour the site
  // has today.
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: uri + "/" } },
  };
}
