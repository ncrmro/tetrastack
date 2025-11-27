import type { SelectTask } from '@/database/schema.tasks'
import { TASK_PRIORITY, TASK_STATUS } from '@/database/schema.tasks'
import { generateUuidV7 } from '@/lib/uuid'
import {
  PROJECT_API_V2,
  PROJECT_CUSTOMER_PORTAL,
  PROJECT_MOBILE_APP,
  PROJECT_WEBSITE_REDESIGN,
} from './projects'

// API v2 Tasks
export const TASK_API_DESIGN: SelectTask = {
  id: generateUuidV7(),
  title: 'Design API endpoints',
  description: 'Create OpenAPI specification for all v2 endpoints',
  status: TASK_STATUS.DONE,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_API_V2.id,
  assigneeId: 1, // John Doe
  dueDate: new Date('2024-02-15'),
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-14'),
}

export const TASK_API_AUTHENTICATION: SelectTask = {
  id: generateUuidV7(),
  title: 'Implement JWT authentication',
  description: 'Add JWT-based authentication with refresh tokens',
  status: TASK_STATUS.IN_PROGRESS,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_API_V2.id,
  assigneeId: 2, // Jane Doe
  dueDate: new Date('2024-03-20'),
  createdAt: new Date('2024-02-10'),
  updatedAt: new Date('2024-03-12'),
}

export const TASK_API_TESTS: SelectTask = {
  id: generateUuidV7(),
  title: 'Write integration tests',
  description: 'Add comprehensive test coverage for all endpoints',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  projectId: PROJECT_API_V2.id,
  assigneeId: 1,
  dueDate: new Date('2024-04-01'),
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
}

// Website Redesign Tasks
export const TASK_DESIGN_MOCKUPS: SelectTask = {
  id: generateUuidV7(),
  title: 'Create design mockups',
  description: 'Design high-fidelity mockups for all key pages',
  status: TASK_STATUS.DONE,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_WEBSITE_REDESIGN.id,
  assigneeId: 1,
  dueDate: new Date('2024-02-01'),
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-30'),
}

export const TASK_IMPLEMENT_HOMEPAGE: SelectTask = {
  id: generateUuidV7(),
  title: 'Implement new homepage',
  description: 'Build responsive homepage with new design',
  status: TASK_STATUS.IN_PROGRESS,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_WEBSITE_REDESIGN.id,
  assigneeId: 2,
  dueDate: new Date('2024-03-20'),
  createdAt: new Date('2024-02-05'),
  updatedAt: new Date('2024-03-10'),
}

export const TASK_SEO_OPTIMIZATION: SelectTask = {
  id: generateUuidV7(),
  title: 'SEO optimization',
  description: 'Optimize meta tags, structured data, and performance',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  projectId: PROJECT_WEBSITE_REDESIGN.id,
  assigneeId: null,
  dueDate: new Date('2024-04-15'),
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
}

// Customer Portal Tasks
export const TASK_USER_DASHBOARD: SelectTask = {
  id: generateUuidV7(),
  title: 'Build user dashboard',
  description: 'Create main dashboard view with account summary',
  status: TASK_STATUS.IN_PROGRESS,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_CUSTOMER_PORTAL.id,
  assigneeId: 1,
  dueDate: new Date('2024-03-25'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-11'),
}

export const TASK_BILLING_INTEGRATION: SelectTask = {
  id: generateUuidV7(),
  title: 'Integrate billing system',
  description: 'Connect Stripe for payment management',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_CUSTOMER_PORTAL.id,
  assigneeId: 2,
  dueDate: new Date('2024-04-05'),
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-02-01'),
}

export const TASK_SUPPORT_TICKETS: SelectTask = {
  id: generateUuidV7(),
  title: 'Add support ticket system',
  description: 'Allow customers to submit and track support requests',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  projectId: PROJECT_CUSTOMER_PORTAL.id,
  assigneeId: null,
  dueDate: new Date('2024-04-20'),
  createdAt: new Date('2024-02-15'),
  updatedAt: new Date('2024-02-15'),
}

// Mobile App Tasks
export const TASK_MOBILE_RESEARCH: SelectTask = {
  id: generateUuidV7(),
  title: 'Research mobile frameworks',
  description: 'Evaluate React Native vs Flutter for our use case',
  status: TASK_STATUS.IN_PROGRESS,
  priority: TASK_PRIORITY.HIGH,
  projectId: PROJECT_MOBILE_APP.id,
  assigneeId: 1,
  dueDate: new Date('2024-03-15'),
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-10'),
}

export const TASK_MOBILE_PROTOTYPE: SelectTask = {
  id: generateUuidV7(),
  title: 'Build proof of concept',
  description: 'Create basic prototype with core features',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  projectId: PROJECT_MOBILE_APP.id,
  assigneeId: null,
  dueDate: new Date('2024-04-01'),
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
}

export const TASK_APP_STORE_SETUP: SelectTask = {
  id: generateUuidV7(),
  title: 'Setup app store accounts',
  description: 'Configure Apple App Store and Google Play Store accounts',
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.LOW,
  projectId: PROJECT_MOBILE_APP.id,
  assigneeId: null,
  dueDate: null,
  createdAt: new Date('2024-03-05'),
  updatedAt: new Date('2024-03-05'),
}

export const tasks = [
  TASK_API_DESIGN,
  TASK_API_AUTHENTICATION,
  TASK_API_TESTS,
  TASK_DESIGN_MOCKUPS,
  TASK_IMPLEMENT_HOMEPAGE,
  TASK_SEO_OPTIMIZATION,
  TASK_USER_DASHBOARD,
  TASK_BILLING_INTEGRATION,
  TASK_SUPPORT_TICKETS,
  TASK_MOBILE_RESEARCH,
  TASK_MOBILE_PROTOTYPE,
  TASK_APP_STORE_SETUP,
]
