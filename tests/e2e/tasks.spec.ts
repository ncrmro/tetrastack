import { test, expect } from './fixtures/project-fixtures';
import { TasksPage } from './page-objects/TasksPage';
import { createProjectWithTasks } from './fixtures/project-fixtures';
import { TASK_STATUS, TASK_PRIORITY } from '../../src/database/schema.tasks';

test.describe('Tasks', () => {
  test.describe('View Task Detail', () => {
    test('should display task details with metadata', async ({
      userWithTeam,
    }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let taskId: string;

      await test.step('Create a project with a task', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Detail Test Project' },
          taskData: [
            {
              title: 'Detailed Task',
              description: 'This task has detailed information to display',
              status: TASK_STATUS.IN_PROGRESS,
              priority: TASK_PRIORITY.HIGH,
              assigneeId: userId,
              dueDate: new Date('2025-12-31'),
            },
          ],
        });
        taskId = result.taskIds[0];
      });

      await test.step('Navigate to task detail page', async () => {
        await tasksPage.navigateToTask(taskId);
      });

      await test.step('Verify task title and description', async () => {
        await expect(tasksPage.taskTitle).toContainText('Detailed Task');
        await expect(tasksPage.taskDescription).toContainText(
          'This task has detailed information',
        );
      });

      await test.step('Verify task metadata is displayed', async () => {
        await expect(tasksPage.metadataContainer).toBeVisible();
        await expect(tasksPage.statusBadge).toBeVisible();
        await expect(tasksPage.priorityIndicator).toBeVisible();
        await expect(tasksPage.projectLink).toBeVisible();
      });

      await test.step('Verify status and priority values', async () => {
        const status = await tasksPage.getStatusText();
        const priority = await tasksPage.getPriorityText();
        expect(status).toContain('In Progress');
        expect(priority).toContain('High');
      });
    });
  });

  test.describe('Add Comment', () => {
    test('should add a comment to a task', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let taskId: string;

      await test.step('Create a task', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Add Comment Project' },
          taskData: [
            {
              title: 'Task for Comment',
              description: 'A task to test comment creation',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.MEDIUM,
            },
          ],
        });
        taskId = result.taskIds[0];
      });

      await test.step('Navigate to task detail page', async () => {
        await tasksPage.navigateToTask(taskId);
      });

      await test.step('Verify comment input is visible', async () => {
        await expect(tasksPage.commentInput).toBeVisible();
        await expect(tasksPage.addCommentButton).toBeVisible();
      });

      await test.step('Fill comment input', async () => {
        await tasksPage.commentInput.fill(
          'This is my new comment added via E2E test',
        );
      });

      await test.step('Submit comment', async () => {
        await tasksPage.addCommentButton.click();
      });

      await test.step('Verify comment appears in thread', async () => {
        await expect(
          tasksPage.getComment('This is my new comment added via E2E test'),
        ).toBeVisible();
      });

      await test.step('Verify comment input is cleared', async () => {
        await expect(tasksPage.commentInput).toHaveValue('');
      });
    });
  });

  test.describe('Task Status Update', () => {
    test('should update task status through UI', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let taskId: string;

      await test.step('Create a task', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Status Update Project' },
          taskData: [
            {
              title: 'Task to Update',
              description: 'Testing status update',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.MEDIUM,
              assigneeId: userId,
            },
          ],
        });
        taskId = result.taskIds[0];
      });

      await test.step('Navigate to task detail page', async () => {
        await tasksPage.navigateToTask(taskId);
      });

      await test.step('Verify initial status is Todo', async () => {
        const status = await tasksPage.getStatusText();
        expect(status).toContain('Todo');
      });
    });
  });
});
