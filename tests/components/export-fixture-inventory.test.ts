import { describe, expect, it } from 'vitest';
import { requireExportReceiptIndices } from './export-fixture-inventory';

// TEST_BUILT presence controls only; no producer bytes, grants or financial values.
const indices = Array.from({ length: 17 }, (_unused, index) => index);

describe('required export receipt coverage', () => {
  it('returns the complete immutable inventory rather than a subset', () => {
    const checked: number[] = [];
    const result = requireExportReceiptIndices((index) => { checked.push(index); return true; });
    expect(result).toEqual(indices);
    expect(checked).toEqual(indices);
    expect(Object.isFrozen(result)).toBe(true);
  });
  it.each(indices)('rejects missing receipt %i and recovers only after it is restored', (missing) => {
    const present = new Set(indices.filter((index) => index !== missing));
    const exists = (index: number): boolean => present.has(index);
    expect(() => requireExportReceiptIndices(exists)).toThrow(`receipt-${String(missing).padStart(2, '0')}.json`);
    present.add(missing);
    expect(requireExportReceiptIndices(exists)).toEqual(indices);
  });
  it('reports every missing receipt in stable order', () => {
    expect(() => requireExportReceiptIndices((index) => ![16, 0, 2].includes(index)))
      .toThrow('receipt-00.json, receipt-02.json, receipt-16.json');
  });
  it.each([undefined, '0', '1'])('does not waive missing coverage with the legacy flag set to %s', (flag) => {
    const before = process.env.TD_REQUIRE_EXPORT_FIXTURES;
    try {
      if (flag === undefined) delete process.env.TD_REQUIRE_EXPORT_FIXTURES;
      else process.env.TD_REQUIRE_EXPORT_FIXTURES = flag;
      expect(() => requireExportReceiptIndices((index) => index !== 16)).toThrow('receipt-16.json');
    } finally {
      if (before === undefined) delete process.env.TD_REQUIRE_EXPORT_FIXTURES;
      else process.env.TD_REQUIRE_EXPORT_FIXTURES = before;
    }
  });
});
