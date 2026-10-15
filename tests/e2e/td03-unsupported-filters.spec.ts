import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') throw new Error('Unexpected external request');
    await route.continue();
  });
  page.on('pageerror', (error) => { throw error; });
});

for (const query of ['valuation=unsupported&currency=USD', 'valuation=all&currency=JPY']) {
  test(`TD-03 unsupported selection stays blocked until keyboard reset: ${query}`, async ({ page }) => {
    await page.goto(`/admin/finance/transactions?state=ready&v2=mixed-currency-partial&${query}`);
    await expect(page.getByRole('heading', { name: 'Transaction filters unavailable' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Transaction details' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Prepare export' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Transaction filters unavailable' })).toBeVisible();
    const reset = page.getByRole('button', { name: 'Reset transaction filters' });
    for (let count = 0; count < 40 && !await reset.evaluate((el) => el === document.activeElement); count += 1) await page.keyboard.press('Tab');
    await expect(reset).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Valuation', { exact: true })).toHaveValue('all');
    await expect(page.getByLabel('Currency', { exact: true })).toHaveValue('all');
    await expect(page.getByRole('table', { name: 'Transaction details' })).toBeVisible();
    expect(new URL(page.url()).searchParams.has('valuation')).toBe(false);
    expect(new URL(page.url()).searchParams.has('currency')).toBe(false);
  });
}
