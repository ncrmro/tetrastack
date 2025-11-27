/**
 * Central export point for all test factories.
 *
 * Import factories from here in your tests:
 * @example
 * ```typescript
 * import { userFactory, teamFactory, projectFactory, taskFactory } from '../factories';
 *
 * const user = await userFactory.create();
 * const team = await teamFactory.create();
 * const project = await projectFactory.create({ teamId: team.id });
 * const task = await taskFactory.create({ projectId: project.id });
 * ```
 */

export { commentFactory } from './comment.factory'
export { projectFactory } from './project.factory'
export { tagFactory } from './tag.factory'
export { taskFactory } from './task.factory'
export { teamFactory, teamMembershipFactory } from './team.factory'
export { userFactory } from './user.factory'
