import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('Golden path', () => {
  test('create list, add items, check off, remove checked', async ({ page }) => {
    await page.goto(BASE)

    // Enter email and create list
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Create new list")')
    await page.waitForURL(/\/list\//)

    // List page loaded
    await expect(page.locator('.header__title')).toBeVisible()

    // Add an item
    await page.fill('input[placeholder="Add an item…"]', 'milk')
    await page.keyboard.press('Enter')
    await expect(page.locator('.item-row__name')).toContainText('milk')

    // Add another item
    await page.fill('input[placeholder="Add an item…"]', 'bread')
    await page.keyboard.press('Enter')
    await expect(page.locator('.item-row__name').nth(1)).toContainText('bread')

    // Check off milk
    await page.locator('.item-row').filter({ hasText: 'milk' }).locator('.item-row__checkbox').click()
    await expect(
      page.locator('.item-row').filter({ hasText: 'milk' }).locator('.item-row__name')
    ).toHaveClass(/item-row__name--checked/)

    // Checked item stays in place (not removed)
    await expect(page.locator('.item-row__name')).toHaveCount(2)

    // Remove checked items
    await page.click('button:has-text("Remove 1 checked item")')
    await page.waitForTimeout(300)
    await expect(page.locator('.item-row__name')).toHaveCount(1)
    await expect(page.locator('.item-row__name')).toContainText('bread')
  })

  test('copy link button copies URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(BASE)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Create new list")')
    await page.waitForURL(/\/list\//)

    await page.click('button[title="Copy link"]')
    const handle = await page.evaluateHandle(() => navigator.clipboard.readText())
    const text = await handle.jsonValue()
    expect(text).toMatch(/\/list\//)
  })

  test('send my lists shows confirmation', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Send me my lists")')
    await expect(page.locator('.home__confirmation')).toBeVisible()
  })
})
