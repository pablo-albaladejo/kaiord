import { JSDOM } from "jsdom";

/**
 * The hrefs of the real `<link rel="manifest">` elements in the document's
 * head. Parsing (not a regex) keeps a commented-out link or one placed in
 * the body from counting as linked.
 */
export function headManifestHrefs(html) {
  const { document } = new JSDOM(html).window;
  return [...document.head.querySelectorAll('link[rel~="manifest"]')].map(
    (link) => link.getAttribute("href")
  );
}
