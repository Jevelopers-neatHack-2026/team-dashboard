import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FINANCE_EXPORT, FINANCE_READ } from '../../src/access/permissions';
import {
  FINANCE_V2_EXPORT_KIND, usePreparedExport,
  type FinanceV2PreparedExportOptions,
} from '../../src/views/finance-v2/export-port';
import { exportConformanceIdentity, exportConformancePage, exportConformanceScope } from '../../integration/fixture-host/finance-v2-export';
import { ok, receiptZero } from './export-support';

// TEST_BUILT current-access clock and host controls; captured receipt bytes are
// unchanged. This checks presentation/cancellation, not Finance or host adoption.
const NOW = Date.parse('2026-10-12T00:00:00Z');
const invalidClocks: readonly (readonly [string, () => number])[] = [
  ['NaN', () => Number.NaN], ['positive infinity', () => Number.POSITIVE_INFINITY], ['negative infinity', () => Number.NEGATIVE_INFINITY],
  ['throwing clock', () => { throw new Error('TEST_BUILT_CLOCK_FAILURE'); }],
];
function fixture(now: () => number) {
  const prepare = vi.fn(async () => ok(receiptZero().receipt));
  const options: FinanceV2PreparedExportOptions = {
    mode: 'SYNTHETIC_PROPOSAL', port: { kind: FINANCE_V2_EXPORT_KIND, prepare },
    access: () => ({ revision: 'clock-roundtrip', scope: exportConformanceScope, capabilities: [FINANCE_READ, FINANCE_EXPORT], expiresAt: '2026-10-13T00:00:00Z' }),
    authorization: { revision: 'clock-roundtrip', token: async () => 'TEST_BUILT_TOKEN' }, scope: exportConformanceScope,
    expectedSnapshotId: exportConformanceIdentity.snapshotId, expectedQueryContentHash: exportConformanceIdentity.queryContentHash,
    expectedSummaryContentHash: exportConformanceIdentity.summaryContentHash, page: exportConformancePage(), firstPage: true, now,
  };
  return { options, prepare };
}
beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:clock-roundtrip') });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); });

describe('render-time veto with simultaneous run-key cleanup', () => {
  it.each(invalidClocks)('%s plus a format round trip cannot revive the old prepared manifest', async (_name, bad) => {
    let clock = () => NOW;
    const f = fixture(() => clock());
    const { result, rerender } = renderHook(() => usePreparedExport(f.options));
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    clock = bad;
    act(() => result.current.setFormat('csv'));
    expect(result.current.unavailable).toBe('no-access');
    clock = () => NOW;
    rerender();
    act(() => result.current.setFormat('json'));
    expect(result.current.state).toEqual({ phase: 'idle' });
    expect(result.current.download()).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    expect(f.prepare).toHaveBeenCalledTimes(2);
  });
  it.each(invalidClocks)('%s plus an identity round trip cannot revive the old prepared manifest', async (_name, bad) => {
    let clock = () => NOW;
    const f = fixture(() => clock());
    const { result, rerender } = renderHook(({ resetKey }) => usePreparedExport({ ...f.options, resetKey }), { initialProps: { resetKey: 'original' } });
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    clock = bad;
    rerender({ resetKey: 'changed-filter' });
    expect(result.current.unavailable).toBe('no-access');
    clock = () => NOW;
    rerender({ resetKey: 'changed-filter' });
    rerender({ resetKey: 'original' });
    expect(result.current.state).toEqual({ phase: 'idle' });
    expect(result.current.download()).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    expect(f.prepare).toHaveBeenCalledTimes(2);
  });
});
