/** Only digits. Rejects '1e3', '0x10', '1.5' and '-1', which Number() would happily accept. */
const POSITIVE_INTEGER = /^\d+$/;

/**
 * Route and query parameters arrive as strings. Entity ids are positive
 * integers, and anything else is treated as absent rather than as an error, so
 * a hand-edited URL degrades instead of breaking (ADR-021, ADR-023).
 */
export function toRouteId(value: string | null | undefined): number | null {
  const text = value?.trim();
  if (!text || !POSITIVE_INTEGER.test(text)) {
    return null;
  }

  const id = Number(text);
  return id > 0 ? id : null;
}
