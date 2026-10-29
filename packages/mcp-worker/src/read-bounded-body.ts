const concat = (chunks: ReadonlyArray<Uint8Array>, total: number) => {
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

/**
 * Streams the body and stops as soon as it passes `maxBytes`, so neither a
 * missing nor a false `content-length` can make the Worker buffer more.
 * Returns `null` when the body is over the limit.
 */
export const readBoundedBody = async (
  request: Request,
  maxBytes: number
): Promise<Uint8Array | null> => {
  if (request.body === null) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return concat(chunks, total);
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
};
