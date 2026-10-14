import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FINANCE_V2_EXPORT_KIND, evaluateFinanceV2ExportAccess, usePreparedExport,
  type FinanceV2ExportHostAccess, type FinanceV2PreparedExportOptions, type FinanceV2PreparedExportRequest,
} from '../../src/views/finance-v2/export-port';
import { FINANCE_EXPORT, FINANCE_READ } from '../../src/access/permissions';
import { exportConformanceIdentity, exportConformancePage, exportConformanceScope } from '../../integration/fixture-host/finance-v2-export';
import { ok, receiptZero } from './export-support';

// TEST_BUILT clock/host/port controls over the unchanged captured receipt. No
// genuine issuer, Finance execution, provider request, delivery or adoption.
const NOW = Date.parse('2026-10-12T00:00:00Z');
const EXPIRES = NOW + 1000;
const CANARY = 'TEST_BUILT_CLOCK_EXCEPTION_NOT_FOR_DISCLOSURE';
const bound = { revision: 'clock-test', scope: exportConformanceScope };
const access = (): FinanceV2ExportHostAccess => ({
  ...bound, capabilities: [FINANCE_READ, FINANCE_EXPORT], expiresAt: new Date(EXPIRES).toISOString(),
});
const prepared = () => ok(receiptZero().receipt);
function revoked(): unknown { const value = Proxy.revocable({}, {}); value.revoke(); return value.proxy; }
const invalidValues: readonly (readonly [string, () => unknown])[] = [
  ['NaN', () => Number.NaN], ['positive infinity', () => Number.POSITIVE_INFINITY], ['negative infinity', () => Number.NEGATIVE_INFINITY],
  ['undefined', () => undefined], ['null', () => null], ['false', () => false], ['true', () => true], ['numeric string', () => String(NOW)],
  ['bigint', () => BigInt(NOW)], ['symbol', () => Symbol('clock')], ['object', () => ({})], ['Date object', () => new Date(NOW)], ['revoked proxy', revoked],
];
const invalidClocks: readonly (readonly [string, () => number])[] = [
  ['NaN', () => Number.NaN], ['positive infinity', () => Number.POSITIVE_INFINITY], ['negative infinity', () => Number.NEGATIVE_INFINITY],
  ['throwing clock', () => { throw new Error(CANARY); }],
];
function fixture(now: () => number = () => NOW) {
  const token = vi.fn(async () => 'TEST_BUILT_CLOCK_TOKEN');
  const prepare = vi.fn(async (request: FinanceV2PreparedExportRequest): Promise<unknown> => { void request; return prepared(); });
  const options: FinanceV2PreparedExportOptions = {
    mode: 'SYNTHETIC_PROPOSAL', port: { kind: FINANCE_V2_EXPORT_KIND, prepare }, access,
    authorization: { revision: bound.revision, token }, scope: exportConformanceScope,
    expectedSnapshotId: exportConformanceIdentity.snapshotId, expectedQueryContentHash: exportConformanceIdentity.queryContentHash,
    expectedSummaryContentHash: exportConformanceIdentity.summaryContentHash, page: exportConformancePage(), firstPage: true, now,
  };
  return { token, prepare, options };
}
function noDisclosure() {
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain(CANARY);
}
beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:clock-test') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('current-access clock value validation', () => {
  it.each(invalidValues)('%s cannot establish current access or invoke the reader', (_name, make) => {
    const reader = vi.fn(access);
    expect(evaluateFinanceV2ExportAccess(reader, bound, make() as number)).toBe('no-access');
    expect(reader).not.toHaveBeenCalled();
  });
  it('does not coerce an unreadable clock value', () => {
    const inspect = vi.fn(() => { throw new Error(CANARY); });
    const value = Object.defineProperty({}, Symbol.toPrimitive, { get: inspect });
    expect(evaluateFinanceV2ExportAccess(access, bound, value as number)).toBe('no-access');
    expect(inspect).not.toHaveBeenCalled();
  });
  it.each([NOW, EXPIRES - 0.5, 0, -0.5])('preserves finite instant %s before expiry without coercion or rounding', now => {
    expect(evaluateFinanceV2ExportAccess(access, bound, now)).toBeNull();
  });
  it.each([EXPIRES, EXPIRES + 1])('rejects finite instant %s at or after expiry', now => {
    expect(evaluateFinanceV2ExportAccess(access, bound, now)).toBe('expired');
  });
});

describe('clock failures at the actual export lifecycle boundary', () => {
  it.each(invalidClocks)('%s at entry settles unavailable without token, preparation or disclosure', (_name, clock) => {
    const f = fixture(clock);
    const { result } = renderHook(() => usePreparedExport(f.options));
    expect(result.current.unavailable).toBe('no-access');
    act(() => result.current.prepare());
    expect(result.current.download()).toBeNull();
    expect(f.token).not.toHaveBeenCalled();
    expect(f.prepare).not.toHaveBeenCalled();
    noDisclosure();
  });
  it('contains a throwing clock getter without inspecting its exception', () => {
    const f = fixture();
    const inspect = vi.fn(() => { throw new Error(CANARY); });
    const exception = new Proxy({}, { get: inspect, getPrototypeOf: inspect });
    const options = Object.defineProperty(f.options, 'now', { get() { throw exception; } });
    const { result } = renderHook(() => usePreparedExport(options));
    expect(result.current.unavailable).toBe('no-access');
    act(() => result.current.prepare());
    expect(inspect).not.toHaveBeenCalled();
    expect(f.token).not.toHaveBeenCalled();
    expect(f.prepare).not.toHaveBeenCalled();
    noDisclosure();
  });
  it('contains a non-callable injected clock', () => {
    const f = fixture();
    const { result } = renderHook(() => usePreparedExport({ ...f.options, now: 1 as unknown as () => number }));
    expect(result.current.unavailable).toBe('no-access');
    act(() => result.current.prepare());
    expect(f.token).not.toHaveBeenCalled();
    noDisclosure();
  });
  it.each(invalidClocks)('%s after token resolution blocks dispatch and allows a fresh retry after recovery', async (_name, bad) => {
    let clock = () => NOW;
    let resolveToken!: (value: string) => void;
    const f = fixture(() => clock());
    f.token.mockImplementationOnce(() => new Promise(resolve => { resolveToken = resolve; }));
    const { result, rerender } = renderHook(() => usePreparedExport(f.options));
    act(() => result.current.prepare());
    expect(f.token).toHaveBeenCalledTimes(1);
    clock = bad;
    await act(async () => { resolveToken('TEST_BUILT_CLOCK_TOKEN'); });
    expect(result.current.unavailable).toBe('no-access');
    expect(f.prepare).not.toHaveBeenCalled();
    noDisclosure();
    clock = () => NOW;
    rerender();
    expect(result.current.download()).toBeNull();
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    expect(f.prepare).toHaveBeenCalledTimes(1);
    noDisclosure();
  });
  it.each(invalidClocks)('%s before download discards held bytes without a rerender', async (_name, bad) => {
    let clock = () => NOW;
    const f = fixture(() => clock());
    const { result, rerender } = renderHook(() => usePreparedExport(f.options));
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    clock = bad;
    act(() => { expect(result.current.download()).toBeNull(); });
    noDisclosure();
    clock = () => NOW;
    rerender();
    expect(result.current.download()).toBeNull();
    expect(result.current.state).toEqual({ phase: 'discarded', reason: 'no-access' });
  });
  it.each(invalidClocks)('%s on the watcher aborts a pending port and discards its late answer', async (_name, bad) => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let clock = () => NOW;
    let answer!: (value: unknown) => void;
    const f = fixture(() => clock());
    f.prepare.mockImplementationOnce(() => new Promise(resolve => { answer = resolve; }));
    const { result, rerender, unmount } = renderHook(() => usePreparedExport(f.options));
    act(() => result.current.prepare());
    await waitFor(() => expect(f.prepare).toHaveBeenCalledTimes(1));
    const request = f.prepare.mock.calls[0]![0];
    clock = bad;
    act(() => { vi.advanceTimersByTime(250); });
    expect(request.signal.aborted).toBe(true);
    expect(result.current.unavailable).toBe('no-access');
    clock = () => NOW;
    rerender();
    await act(async () => { answer(prepared()); });
    expect(result.current.state).toEqual({ phase: 'discarded', reason: 'no-access' });
    expect(result.current.download()).toBeNull();
    noDisclosure();
    unmount();
  });
  it('preserves the default wall clock and the normal explicit download control', async () => {
    const f = fixture();
    const { now: _injected, ...options } = f.options;
    void _injected;
    const { result } = renderHook(() => usePreparedExport({ ...options, access: () => ({ ...access(), expiresAt: '2099-01-01T00:00:00Z' }) }));
    act(() => result.current.prepare());
    await waitFor(() => expect(result.current.state.phase).toBe('prepared'));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    act(() => { expect(result.current.download()).toBe('summary.json'); });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });
});
