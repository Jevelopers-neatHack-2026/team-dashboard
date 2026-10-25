import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { checkFinanceV2Page, FinanceV2View, type FinanceV2ViewName } from '../../src/views/finance-v2';
import { financeV2Fixture, syntheticOpaqueScope } from '../../src/views/finance-v2/fixtures';

function pageWith(bucket: unknown) {
  const input = financeV2Fixture('ready').input;
  if (input.status !== 'ready') throw new Error('Expected ready fixture');
  const page = structuredClone(input.page) as {
    summary: { currencies: { valuation: Record<string, unknown> }[] };
  };
  page.summary.currencies[0]!.valuation.reportedUnsettled = bucket;
  return page;
}

describe('TD-01B / TD-09 unsupported valuation boundary', () => {
  // Test-built deviations of the existing fixture, not captured Finance outputs.
  it.each([
    { status: 'known', knownSubtotal: '7.000000000000000001', total: '7.000000000000000001', unknownCount: 0 },
    { status: 'partial', knownSubtotal: '7', total: null, unknownCount: 1 },
    { status: 'unknown', knownSubtotal: null, total: null, unknownCount: 1 },
    { status: 'known', knownSubtotal: '0', total: '0', unknownCount: 0 },
    null, undefined,
  ])('refuses an unrendered reported-unsettled bucket %#', (bucket) => {
    expect(checkFinanceV2Page(pageWith(bucket), syntheticOpaqueScope)).toEqual({
      ok: false, code: 'INVALID_SHAPE', path: '/summary/currencies/0/valuation',
    });
  });

  it.each(['budget', 'breakdown', 'transactions', 'transaction-detail'] as const)('withholds %s amounts and export when the valuation shape is unsupported', (view: FinanceV2ViewName) => {
    const page = pageWith({ status: 'known', knownSubtotal: '7', total: '7', unknownCount: 0 });
    render(<FinanceV2View mode="SYNTHETIC_PROPOSAL" view={view} input={{ status: 'ready', page }} expectedScope={syntheticOpaqueScope}
      exportSlot={<button type="button">Prepare export</button>} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Report refused');
    expect(screen.queryByText(/42\.000000000000000000/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Prepare export' })).toBeNull();
  });

  it('recovers with the original supported valuation shape', () => {
    const original = financeV2Fixture('ready').input;
    const { rerender } = render(<FinanceV2View mode="SYNTHETIC_PROPOSAL" view="transactions" input={{ status: 'ready', page: pageWith({}) }} expectedScope={syntheticOpaqueScope} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Report refused');
    rerender(<FinanceV2View mode="SYNTHETIC_PROPOSAL" view="transactions" input={original} expectedScope={syntheticOpaqueScope} />);
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(screen.getByLabelText('Valuation'), { target: { value: 'estimated' } });
    expect(screen.getByRole('table', { name: 'Transaction details' })).toHaveTextContent('estimated');
  });
});
