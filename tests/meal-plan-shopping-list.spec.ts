import { expect, test } from '@playwright/test'
import { BasePage } from './e2e/page-objects/BasePage'
import { SignInPage } from './e2e/page-objects/SignInPage'

test.describe('Meal Plan Shopping List Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user to access meal plan functionality
    // The global setup has already seeded the database with admin user and household
    const signInPage = new SignInPage(page)
    await signInPage.navigateToSignIn()
    await signInPage.signInWithPassword('admin')
  })

  test('adding Pinto Beans recipe and checking shopping list functionality', async ({
    page,
  }) => {
    const basePage = new BasePage(page)

    await test.step('navigate to meal plan page', async () => {
      await basePage.goto('/meal-plan')

      // Verify we're on the meal plan page
      await expect(
        page.getByRole('heading', { name: 'Your Meal Plan' }),
      ).toBeVisible()
      await expect(page.getByText('Available Meals')).toBeVisible()
    })

    await test.step('add Eggs a la Mexicana meal to plan', async () => {
      // Find and click the "Add to Plan" button for "Eggs a la Mexicana" meal
      // This meal contains the Pinto Beans recipe
      const mealCard = page
        .locator('[data-testid="meal-card"]')
        .filter({ hasText: 'Eggs a la Mexicana' })
      const addButton = mealCard.getByRole('button', { name: 'Add to Plan' })
      await expect(addButton).toBeVisible()
      await addButton.click()
    })

    await test.step('verify Pinto Beans appear in shopping list', async () => {
      // Navigate to shopping list page
      await basePage.goto('/shopping-list')

      // Verify the shopping list page loaded correctly
      await expect(
        page.getByRole('heading', { name: 'Shopping List' }),
      ).toBeVisible()

      // Look for Pinto Beans heading in the shopping list (the ingredient heading)
      const pintoBeansHeading = page.getByRole('heading', {
        name: 'Pinto Beans',
      })
      await expect(pintoBeansHeading).toBeVisible()

      // Verify the pinto beans item is not checked initially
      const pintoBeansItem = page.locator(
        '[data-testid="shopping-item"][data-item-name="Pinto Beans"]',
      )
      const pintoBeansCheckbox = pintoBeansItem.locator(
        '[data-testid="shopping-item-checkbox"]',
      )
      await expect(pintoBeansCheckbox).not.toBeChecked()
    })

    await test.step('check pinto beans item', async () => {
      // Check the pinto beans checkbox
      const pintoBeansItem = page.locator(
        '[data-testid="shopping-item"][data-item-name="Pinto Beans"]',
      )
      const pintoBeansCheckbox = pintoBeansItem.locator(
        '[data-testid="shopping-item-checkbox"]',
      )
      await pintoBeansCheckbox.check()

      // Verify it's checked
      await expect(pintoBeansCheckbox).toBeChecked()
    })
  })
})
