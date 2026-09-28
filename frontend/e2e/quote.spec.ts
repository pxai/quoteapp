import { expect, test } from '@playwright/test'

test('shows a quote loaded from the API', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Quote App' })).toBeVisible()
  await expect(page.locator('i')).toHaveText(/\S+/)
  await expect(page.locator('footer')).toHaveText('version: 0.0.1')
})
