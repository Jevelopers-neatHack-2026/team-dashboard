import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard, type RouteProvider } from '../../src';
import type { RouteReadResult } from '../../integration';
import { fixtureAccess } from '../fixtures/td01';

const base = { basePath: '/admin/finance', pathname: '/admin/finance', navigate: vi.fn(), access: fixtureAccess };
const view = ({ data }: { data: string }) => <p>{data}</p>;
const answer = (data: string): RouteReadResult<string> => ({ state: { status: 'ready', data }, access: fixtureAccess });
const good = (): RouteProvider<string> => ({ mode: 'fixture', readRoute: async () => answer('current-record') });
const broken = (field: string) => Object.defineProperty({ mode: 'fixture', readRoute: vi.fn() }, field, { get() { throw new Error('private-provider-canary'); } }) as RouteProvider<string>;

describe('TD-01.D / TD-09 route provider recovery', () => {
  it.each(['mode', 'readRoute'])('contains unreadable %s and recovers after replacement', async (field) => {
    const { rerender } = render(<Dashboard {...base} provider={broken(field)} renderRoute={view} />);
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
    expect(document.body).not.toHaveTextContent('private-provider-canary');
    rerender(<Dashboard {...base} provider={good()} renderRoute={view} />);
    expect(await screen.findByText('current-record')).toBeVisible();
  });
  it.each(['unknown', undefined, null])('does not read from an unsupported mode %s', (mode) => {
    const readRoute = vi.fn();
    render(<Dashboard {...base} provider={{ mode, readRoute } as unknown as RouteProvider<string>} renderRoute={view} />);
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
    expect(readRoute).not.toHaveBeenCalled();
  });
  it.each([null, 1, {}, undefined])('rejects a non-callable read method %s', (readRoute) => {
    render(<Dashboard {...base} provider={{ mode: 'fixture', readRoute } as unknown as RouteProvider<string>} renderRoute={view} />);
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
  });
  it('contains a revoked proxy without retaining a settled record', async () => {
    const { proxy, revoke } = Proxy.revocable(good(), {});
    const { rerender } = render(<Dashboard {...base} provider={good()} renderRoute={view} />);
    expect(await screen.findByText('current-record')).toBeVisible();
    revoke();
    rerender(<Dashboard {...base} provider={proxy} renderRoute={view} />);
    expect(screen.queryByText('current-record')).toBeNull();
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
  });
  it('aborts the old read and ignores its late answer when an unreadable provider replaces it', async () => {
    let finish!: (value: RouteReadResult<string>) => void;
    let signal: AbortSignal | undefined;
    const readRoute = vi.fn((request) => { signal = request.signal; return new Promise<RouteReadResult<string>>((resolve) => { finish = resolve; }); });
    const { rerender } = render(<Dashboard {...base} provider={{ mode: 'fixture', readRoute }} renderRoute={view} />);
    await waitFor(() => expect(readRoute).toHaveBeenCalledOnce());
    rerender(<Dashboard {...base} provider={broken('mode')} renderRoute={view} />);
    expect(signal?.aborted).toBe(true);
    await act(async () => finish(answer('old-record-canary')));
    expect(screen.queryByText('old-record-canary')).toBeNull();
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
  });
  it('preserves the method receiver with a readable accessor', async () => {
    const readRoute = vi.fn(function (this: { marker: string }) { return Promise.resolve(answer(this.marker)); });
    const get = vi.fn(() => readRoute);
    const port = { mode: 'integrated', marker: 'receiver-record', get readRoute() { return get(); } } as unknown as RouteProvider<string>;
    render(<Dashboard {...base} provider={port} renderRoute={view} />);
    expect(await screen.findByText('receiver-record')).toBeVisible();
    expect(get).toHaveBeenCalled();
  });
  it('supports a pure accessor under StrictMode without an exactly-once assumption', async () => {
    const readRoute = vi.fn(function (this: { marker: string }) { return Promise.resolve(answer(this.marker)); });
    const get = vi.fn(() => readRoute);
    const port = { mode: 'integrated', marker: 'strict-record', get readRoute() { return get(); } } as unknown as RouteProvider<string>;
    render(<StrictMode><Dashboard {...base} provider={port} renderRoute={view} /></StrictMode>);
    expect(await screen.findByText('strict-record')).toBeVisible();
    // StrictMode deliberately repeats render calculations; do not pin an exact count.
    expect(get.mock.calls.length).toBeGreaterThan(1);
    expect(readRoute).toHaveBeenCalled();
  });
  it.each(['mode', 'readRoute'])('contains throwing %s accessors and recovers with a data-property provider under StrictMode', async (field) => {
    const { rerender } = render(<StrictMode><Dashboard {...base} provider={broken(field)} renderRoute={view} /></StrictMode>);
    expect(screen.getByText('Upstream unavailable')).toBeVisible();
    expect(document.body).not.toHaveTextContent('private-provider-canary');
    rerender(<StrictMode><Dashboard {...base} provider={good()} renderRoute={view} /></StrictMode>);
    expect(await screen.findByText('current-record')).toBeVisible();
    expect(screen.queryByText('Upstream unavailable')).toBeNull();
  });
});
