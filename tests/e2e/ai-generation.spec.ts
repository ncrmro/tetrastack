import { test, expect } from './fixtures/base-fixtures';

test.describe('AI Project Generation', () => {
  test.describe('AI Generation Process', () => {
    test('should generate project successfully with mocked AI response', async ({
      userWithTeam,
    }) => {
      const { page, teamId } = userWithTeam;

      // Mock the AI generation API with SSE response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEResponse = [
          'event: progress\ndata: {"type":"tool_use","name":"search_projects","input":{"query":"inventory"}}\n\n',
          'event: progress\ndata: {"type":"text","text":"Analyzing your request..."}\n\n',
          'event: complete\ndata: {"type":"new","project":{"id":"test-project-123","title":"Inventory Management System","description":"A simple inventory tracking system","slug":"inventory-management-system","status":"planning","priority":"medium","teamId":"' +
            teamId +
            '"},"explanation":"Created a new project based on your description","suggestedTags":["backend","database"]}\n\n',
        ].join('');

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEResponse,
        });
      });

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate');
      });

      await test.step('Fill in project description', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('Simple inventory management system');
      });

      await test.step('Click generate button', async () => {
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click();
      });

      await test.step('Wait for generation to complete', async () => {
        await expect(page.getByText(/project created!/i)).toBeVisible({
          timeout: 30000,
        });
      });

      await test.step('Verify project details are displayed', async () => {
        await expect(page.getByText(/view project →/i)).toBeVisible();
      });
    });

    test('should handle API errors gracefully with mocked error response', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;

      // Mock the AI generation API with error response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEError =
          'event: error\ndata: {"error":"AI service temporarily unavailable"}\n\n';

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEError,
        });
      });

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate');
      });

      await test.step('Fill in project description', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('Test error handling');
      });

      await test.step('Click generate button', async () => {
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click();
      });

      await test.step('Wait for error message', async () => {
        await expect(
          page.getByText(/AI service temporarily unavailable/i),
        ).toBeVisible({
          timeout: 10000,
        });
      });
    });
  });

  test.describe('Generated Project Navigation', () => {
    test('should navigate to generated project with mocked response', async ({
      userWithTeam,
    }) => {
      const { page, teamId } = userWithTeam;

      // Mock the AI generation API with success response
      await page.route('**/api/ai/generate-project', async (route) => {
        const mockSSEResponse = [
          'event: progress\ndata: {"type":"text","text":"Creating project..."}\n\n',
          'event: complete\ndata: {"type":"new","project":{"id":"e2e-test-123","title":"E2E Test Project","description":"Generated for testing navigation","slug":"e2e-test-project","status":"active","priority":"high","teamId":"' +
            teamId +
            '"},"explanation":"Project created successfully","suggestedTags":[]}\n\n',
        ].join('');

        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: mockSSEResponse,
        });
      });

      await test.step('Navigate to AI generation page', async () => {
        await page.goto('/projects/generate');
      });

      await test.step('Generate a project', async () => {
        await page
          .getByLabel(/describe your project/i)
          .fill('E2E test project');
        await page
          .getByRole('button', { name: /generate project with ai/i })
          .click();
      });

      await test.step('Wait for generation to complete', async () => {
        await expect(page.getByText(/project created!/i)).toBeVisible({
          timeout: 30000,
        });
      });

      await test.step('Click view project link', async () => {
        await page.getByText(/view project →/i).click();
      });

      await test.step('Verify navigation to project detail page', async () => {
        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/);
      });
    });
  });
});
