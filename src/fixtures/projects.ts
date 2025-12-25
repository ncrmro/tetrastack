import { uuidv7, slugify } from '@tetrastack/backend/utils';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '@/database/schema.projects';
import type { SelectProject } from '@/database/schema.projects';
import { TEAM_ENGINEERING, TEAM_PRODUCT } from './teams';
import { users } from './users';

export const PROJECT_WEBSITE_REDESIGN: SelectProject = {
  id: uuidv7(),
  title: 'Website Redesign',
  slug: slugify('Website Redesign'),
  description:
    'Complete overhaul of the company website with modern design and improved UX',
  status: PROJECT_STATUS.ACTIVE,
  priority: PROJECT_PRIORITY.HIGH,
  teamId: TEAM_PRODUCT.id,
  createdBy: users[0].id, // Admin User
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-03-15'),
};

export const PROJECT_API_V2: SelectProject = {
  id: uuidv7(),
  title: 'API v2 Development',
  slug: slugify('API v2 Development'),
  description: 'Build next generation REST API with GraphQL support',
  status: PROJECT_STATUS.ACTIVE,
  priority: PROJECT_PRIORITY.HIGH,
  teamId: TEAM_ENGINEERING.id,
  createdBy: users[0].id, // Admin User
  createdAt: new Date('2024-02-01'),
  updatedAt: new Date('2024-03-10'),
};

export const PROJECT_MOBILE_APP: SelectProject = {
  id: uuidv7(),
  title: 'Mobile App',
  slug: slugify('Mobile App'),
  description: 'Native iOS and Android applications',
  status: PROJECT_STATUS.PLANNING,
  priority: PROJECT_PRIORITY.MEDIUM,
  teamId: TEAM_ENGINEERING.id,
  createdBy: users[1].id, // Bob Alice
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
};

export const PROJECT_CUSTOMER_PORTAL: SelectProject = {
  id: uuidv7(),
  title: 'Customer Portal',
  slug: slugify('Customer Portal'),
  description:
    'Self-service portal for customers to manage accounts and billing',
  status: PROJECT_STATUS.ACTIVE,
  priority: PROJECT_PRIORITY.MEDIUM,
  teamId: TEAM_ENGINEERING.id,
  createdBy: users[0].id, // Admin User
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-03-12'),
};

export const PROJECT_PERFORMANCE_OPTIMIZATION: SelectProject = {
  id: uuidv7(),
  title: 'Performance Optimization',
  slug: slugify('Performance Optimization'),
  description: 'Improve application load times and runtime performance',
  status: PROJECT_STATUS.COMPLETED,
  priority: PROJECT_PRIORITY.HIGH,
  teamId: TEAM_ENGINEERING.id,
  createdBy: users[1].id, // Bob Alice
  createdAt: new Date('2023-11-01'),
  updatedAt: new Date('2024-01-15'),
};

export const PROJECT_USER_RESEARCH: SelectProject = {
  id: uuidv7(),
  title: 'Q1 User Research',
  slug: slugify('Q1 User Research'),
  description: 'Conduct user interviews and surveys for product roadmap',
  status: PROJECT_STATUS.COMPLETED,
  priority: PROJECT_PRIORITY.MEDIUM,
  teamId: TEAM_PRODUCT.id,
  createdBy: users[0].id, // Admin User
  createdAt: new Date('2024-01-05'),
  updatedAt: new Date('2024-02-28'),
};

export const PROJECT_LEGACY_MIGRATION: SelectProject = {
  id: uuidv7(),
  title: 'Legacy System Migration',
  slug: slugify('Legacy System Migration'),
  description:
    'Migrate data and functionality from legacy monolith to microservices',
  status: PROJECT_STATUS.ARCHIVED,
  priority: PROJECT_PRIORITY.LOW,
  teamId: TEAM_ENGINEERING.id,
  createdBy: users[0].id, // Admin User
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2023-12-31'),
};

export const projects = [
  PROJECT_WEBSITE_REDESIGN,
  PROJECT_API_V2,
  PROJECT_MOBILE_APP,
  PROJECT_CUSTOMER_PORTAL,
  PROJECT_PERFORMANCE_OPTIMIZATION,
  PROJECT_USER_RESEARCH,
  PROJECT_LEGACY_MIGRATION,
];
