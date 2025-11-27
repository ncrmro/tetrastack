import { expect, test } from './fixtures/base-fixtures'
import { ProjectsPage } from './page-objects/ProjectsPage'

test.describe('AI Project Generation', () => {
  test.describe('Navigation', () => {
    test('should navigate to AI generation page from projects list', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam
      const projectsPage = new ProjectsPage(page)

      await test.step('Navigate to projects page', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Click Generate with AI button', async () => {
        await projectsPage.generateWithAIButton.click()
      })

      await test.step('Verify on AI generation page', async () => {
        await expect(page).toHaveURL(/\/projects\/generate/)
        await expect(
          page.getByRole('heading', { name: /generate project with ai/i }),
        ).toBeVisible()
      })
    })
  })

  test.describe('AI Generation Form', () => {
    test('should display AI generation form with all elements', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Verify page heading and description', async () => {
        await expect(
          page.getByRole('heading', { name: /generate project with ai/i }),
        ).toBeVisible()
        await expect(
          page.getByText(/describe your project and let ai create it for you/i),
        ).toBeVisible()
      })

      await test.step('Verify form elements are present', async () => {
        await expect(page.getByLabel(/describe your project/i)).toBeVisible()
        await expect(
          page.getByRole('button', { name: /generate project with ai/i }),
        ).toBeVisible()
      })

      await test.step('Verify back to projects link', async () => {
        await expect(
          page.getByRole('link', { name: /← projects/i }),
        ).toBeVisible()
      })
    })

    test('should disable generate button when description is empty', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Verify generate button is disabled initially', async () => {
        const generateButton = page.getByRole('button', {
          name: /generate project with ai/i,
        })
        await expect(generateButton).toBeDisabled()
      })
    })

    test('should enable generate button when description is filled', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Fill in project description', async () => {
        const descriptionInput = page.getByLabel(/describe your project/i)
        await descriptionInput.fill(
          'Create a task management app with real-time collaboration',
        )
      })

      await test.step('Verify generate button is enabled', async () => {
        const generateButton = page.getByRole('button', {
          name: /generate project with ai/i,
        })
        await expect(generateButton).toBeEnabled()
      })
    })
  })

  test.describe('AI Generation Process', () => {
    test('should show loading state during generation', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Fill in project description', async () => {
        const descriptionInput = page.getByLabel(/describe your project/i)
        await descriptionInput.fill('Build a simple todo list application')
      })

      await test.step('Click generate button', async () => {
        const generateButton = page.getByRole('button', {
          name: /generate project with ai/i,
        })
        await generateButton.click()
      })

      await test.step('Verify loading state appears', async () => {
        await expect(
          page.getByRole('button', { name: /generating\.\.\./i }),
        ).toBeVisible()
      })

      // Note: Actual AI generation may take time and requires ANTHROPIC_API_KEY
      // This test verifies the UI state changes correctly
      // For full E2E, you'd need to mock the API or have valid credentials
    })

    test('should display skeleton loading during generation', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Fill in project description', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('Create a blog platform')
      })

      await test.step('Click generate button', async () => {
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click()
      })

      await test.step('Verify skeleton loader appears', async () => {
        // The skeleton has animate-pulse class
        const skeleton = page.locator('.animate-pulse')
        await expect(skeleton).toBeVisible({ timeout: 2000 })
      })
    })

    test('should generate project successfully with mocked AI response', async ({
      userWithTeam,
    }) => {
      const { page, teamId } = userWithTeam

      // Mock the AI generation API with SSE response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEResponse = [
          'event: progress\ndata: {"type":"tool_use","name":"search_projects","input":{"query":"inventory"}}\n\n',
          'event: progress\ndata: {"type":"text","text":"Analyzing your request..."}\n\n',
          'event: complete\ndata: {"type":"new","project":{"id":"test-project-123","title":"Inventory Management System","description":"A simple inventory tracking system","slug":"inventory-management-system","status":"planning","priority":"medium","teamId":"' +
            teamId +
            '"},"explanation":"Created a new project based on your description","suggestedTags":["backend","database"]}\n\n',
        ].join('')

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEResponse,
        })
      })

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Fill in project description', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('Simple inventory management system')
      })

      await test.step('Click generate button', async () => {
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click()
      })

      await test.step('Wait for generation to complete', async () => {
        // Wait for success message
        await expect(page.getByText(/project created!/i)).toBeVisible({
          timeout: 30000,
        })
      })

      await test.step('Verify project details are displayed', async () => {
        await expect(page.getByText(/view project →/i)).toBeVisible()
      })
    })

    test('should handle API errors gracefully with mocked error response', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam

      // Mock the AI generation API with error response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEError =
          'event: error\ndata: {"error":"AI service temporarily unavailable"}\n\n'

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEError,
        })
      })

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Fill in project description', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('Test error handling')
      })

      await test.step('Click generate button', async () => {
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click()
      })

      await test.step('Wait for error message', async () => {
        // If API fails, error message should appear (from our mock)
        await expect(
          page.getByText(/AI service temporarily unavailable/i),
        ).toBeVisible({
          timeout: 10000,
        })
      })
    })
  })

  test.describe('Generated Project Navigation', () => {
    test('should navigate to generated project with mocked response', async ({
      userWithTeam,
    }) => {
      const { page, teamId } = userWithTeam

      // Mock the AI generation API with success response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEResponse = [
          'event: progress\ndata: {"type":"text","text":"Creating project..."}\n\n',
          'event: complete\ndata: {"type":"new","project":{"id":"e2e-test-123","title":"E2E Test Project","description":"Generated for testing navigation","slug":"e2e-test-project","status":"active","priority":"high","teamId":"' +
            teamId +
            '"},"explanation":"Project created successfully","suggestedTags":[]}\n\n',
        ].join('')

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEResponse,
        })
      })

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Generate a project', async () => {
        await page.getByLabel(/describe your project/i).fill('E2E test project')
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click()
      })

      await test.step('Wait for generation to complete', async () => {
        await expect(page.getByText(/project created!/i)).toBeVisible({
          timeout: 30000,
        })
      })

      await test.step('Click view project link', async () => {
        await page.getByText(/view project →/i).click()
      })

      await test.step('Verify navigation to project detail page', async () => {
        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/)
      })
    })
  })

  test.describe('Back Navigation', () => {
    test('should navigate back to projects list', async ({ userWithTeam }) => {
      const { page } = userWithTeam

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Click back to projects link', async () => {
        await page.getByRole('link', { name: /← projects/i }).click()
      })

      await test.step('Verify navigation to projects list', async () => {
        await expect(page).toHaveURL('/projects')
        await expect(
          page.getByRole('heading', { name: /^projects$/i }),
        ).toBeVisible()
      })
    })
  })

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign-in when not authenticated', async ({
      unauthenticatedUser,
    }) => {
      const { page } = unauthenticatedUser

      await test.step('Attempt to access AI generation page', async () => {
        await page.goto('/projects/generate')
      })

      await test.step('Verify redirect to sign-in', async () => {
        await expect(page).toHaveURL(/\/api\/auth\/signin/)
      })
    })
  })

  test.describe('No Teams Edge Case', () => {
    test('should show 404 when user has no teams', async ({
      authenticatedUser,
    }) => {
      // This test uses authenticatedUser fixture which doesn't create a team
      const { page } = authenticatedUser

      await test.step('Attempt to access AI generation page', async () => {
        await page.goto('/projects/generate', {
          waitUntil: 'domcontentloaded',
        })
      })

      await test.step('Verify 404 or redirect', async () => {
        // According to the code, it calls notFound() if no teams
        // Next.js 404 page should be shown
        await expect(
          page.getByRole('heading', { name: /404|not found/i }),
        ).toBeVisible()
      })
    })
  })
})
