import { TASK_PRIORITY, TASK_STATUS } from '../../src/database/schema.tasks';
import { insertComments } from '../../src/models/comments';
import {
  createProjectWithTasks,
  expect,
  test,
} from './fixtures/project-fixtures';
import { TasksPage } from './page-objects/TasksPage';

test.describe('Tasks', () => {
  test.describe('Tasks List View', () => {
    test('should display empty state when no tasks assigned', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;
      const tasksPage = new TasksPage(page);

      await test.step('Navigate to tasks page', async () => {
        await tasksPage.navigateToTasks();
      });

      await test.step('Verify empty state is displayed', async () => {
        await expect(tasksPage.emptyStateHeading).toBeVisible();
        await expect(tasksPage.emptyStateMessage).toBeVisible();
        await expect(tasksPage.viewProjectsButton).toBeVisible();
      });
    });

    test('should display task stats correctly', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      await test.step('Create project with tasks assigned to user', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Task Stats Project' },
          taskData: [
            {
              title: 'Todo Task',
              description: 'A todo task',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.MEDIUM,
              assigneeId: userId,
            },
            {
              title: 'In Progress Task',
              description: 'An in-progress task',
              status: TASK_STATUS.IN_PROGRESS,
              priority: TASK_PRIORITY.HIGH,
              assigneeId: userId,
            },
            {
              title: 'Done Task',
              description: 'A completed task',
              status: TASK_STATUS.DONE,
              priority: TASK_PRIORITY.LOW,
              assigneeId: userId,
            },
          ],
        });
      });

      await test.step('Navigate to tasks page', async () => {
        await tasksPage.navigateToTasks();
      });

      await test.step('Verify page heading and subheading', async () => {
        await expect(tasksPage.pageHeading).toBeVisible();
        await expect(tasksPage.pageSubheading).toBeVisible();
      });

      await test.step('Verify task stats', async () => {
        await expect(tasksPage.totalTasksStat).toContainText('3');
        await expect(tasksPage.todoTasksStat).toContainText('1');
        await expect(tasksPage.inProgressTasksStat).toContainText('1');
        await expect(tasksPage.completedTasksStat).toContainText('1');
      });

      await test.step('Verify task list is visible', async () => {
        await expect(tasksPage.taskList).toBeVisible();
      });
    });

    test('should display assigned tasks in list', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      await test.step('Create project with tasks', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'My Task Project' },
          taskData: [
            {
              title: 'First Task',
              description: 'First task description',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.HIGH,
              assigneeId: userId,
            },
            {
              title: 'Second Task',
              description: 'Second task description',
              status: TASK_STATUS.IN_PROGRESS,
              priority: TASK_PRIORITY.MEDIUM,
              assigneeId: userId,
            },
          ],
        });
      });

      await test.step('Navigate to tasks page', async () => {
        await tasksPage.navigateToTasks();
      });

      await test.step('Verify tasks are displayed', async () => {
        await expect(tasksPage.getTaskCard('First Task')).toBeVisible();
        await expect(tasksPage.getTaskCard('Second Task')).toBeVisible();
      });
    });
  });

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

      await test.step('Verify due date is displayed', async () => {
        await expect(tasksPage.dueDate).toBeVisible();
      });

      await test.step('Verify created and updated dates', async () => {
        await expect(tasksPage.createdDate).toBeVisible();
        await expect(tasksPage.updatedDate).toBeVisible();
      });

      await test.step('Verify comments section exists', async () => {
        await expect(tasksPage.commentsHeading).toBeVisible();
        await expect(tasksPage.commentsContainer).toBeVisible();
      });
    });

    test('should display existing comments', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let taskId: string;

      await test.step('Create task with comments', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Comments Test Project' },
          taskData: [
            {
              title: 'Task with Comments',
              description: 'A task that has comments',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.MEDIUM,
            },
          ],
        });
        taskId = result.taskIds[0];

        // Add comments to the task
        await insertComments([
          {
            taskId,
            userId,
            content: 'This is the first comment',
          },
          {
            taskId,
            userId,
            content: 'This is the second comment',
          },
        ]);
      });

      await test.step('Navigate to task detail page', async () => {
        await tasksPage.navigateToTask(taskId);
      });

      await test.step('Verify comments are displayed', async () => {
        await expect(
          tasksPage.getComment('This is the first comment'),
        ).toBeVisible();
        await expect(
          tasksPage.getComment('This is the second comment'),
        ).toBeVisible();
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

  test.describe('Navigation', () => {
    test('should navigate from task to project', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let projectSlug: string;
      let taskId: string;

      await test.step('Create project with task', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Navigation Source Project' },
          taskData: [
            {
              title: 'Navigation Test Task',
              description: 'A task for testing navigation',
              status: TASK_STATUS.TODO,
              priority: TASK_PRIORITY.MEDIUM,
            },
          ],
        });
        projectSlug = result.projectSlug;
        taskId = result.taskIds[0];
      });

      await test.step('Navigate to task detail page', async () => {
        await tasksPage.navigateToTask(taskId);
      });

      await test.step('Click project link', async () => {
        await tasksPage.projectLink.click();
      });

      await test.step('Verify navigation to project page', async () => {
        await expect(page).toHaveURL(`/projects/${projectSlug}`);
        await expect(
          page.getByRole('heading', { name: 'Navigation Source Project' }),
        ).toBeVisible();
      });
    });

    test('should navigate back to tasks list', async ({ userWithTeam }) => {
      const { page, userId, teamId } = userWithTeam;
      const tasksPage = new TasksPage(page);

      let taskId: string;

      await test.step('Create a task', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Back Navigation Project' },
          taskData: [
            {
              title: 'Back Navigation Task',
              description: 'Test back navigation',
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

      await test.step('Click back to tasks link', async () => {
        await tasksPage.backToTasksLink.click();
      });

      await test.step('Verify back on tasks list page', async () => {
        await expect(page).toHaveURL('/tasks');
        await expect(tasksPage.pageHeading).toBeVisible();
      });
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign-in when not authenticated', async ({
      unauthenticatedUser,
    }) => {
      const { page } = unauthenticatedUser;

      await test.step('Attempt to access tasks page', async () => {
        await page.goto('/tasks');
      });

      await test.step('Verify redirect to sign-in', async () => {
        await expect(page).toHaveURL(/\/api\/auth\/signin/);
      });
    });
  });
});
