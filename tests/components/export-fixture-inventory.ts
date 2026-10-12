// The accepted synthetic export packet contains exactly receipts 0–16.
// This is test coverage policy, not a Finance contract or an integrated grant.
const REQUIRED_INDICES: readonly number[] = Object.freeze(Array.from({ length: 17 }, (_unused, index) => index));

/** Refuse an incomplete checkout before it can silently register fewer conformance cases. */
export function requireExportReceiptIndices(hasReceipt: (index: number) => boolean): readonly number[] {
  const missing = REQUIRED_INDICES.filter((index) => !hasReceipt(index));
  if (missing.length > 0) {
    const files = missing.map((index) => `receipt-${String(index).padStart(2, '0')}.json`).join(', ');
    throw new Error(`Missing required export conformance fixtures: ${files}. Restore the exact accepted producer copies; do not synthesize receipts.`);
  }
  return REQUIRED_INDICES;
}
