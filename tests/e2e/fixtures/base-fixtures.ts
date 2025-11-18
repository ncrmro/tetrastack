/* eslint-disable react-hooks/rules-of-hooks */
import {
  test as base,
  type Page,
  type TestInfo,
  type BrowserContext,
} from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { db, users } from '../../../src/database';
import {
  teams,
  teamMemberships,
  TEAM_ROLE,
} from '../../../src/database/schema.teams';
import { generateUserCredentials } from '../helpers';
import { SignInPage } from '../page-objects/SignInPage';
import { BasePage } from '../page-objects/BasePage';

// Base URL helper - uses PLAYWRIGHT_BASE_URL or constructs from WEB_PORT
export const getBaseUrl = () => {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }
  return `http://localhost:${process.env.WEB_PORT || 3000}`;
};

// Cookie domain helper - extracts hostname from base URL
const getCookieDomain = () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || getBaseUrl();
  try {
    const url = new URL(baseUrl);
    return url.hostname;
  } catch {
    return 'localhost';
  }
};

// Test data types
export interface BaseTestData {
  user: {
    id: string;
    credentials: string;
    name: string;
    type: 'admin' | 'user';
  };
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  admin: boolean;
}

// Test context types
export interface AuthenticatedContext {
  page: Page;
  data: BaseTestData;
}

export interface TeamContext {
  page: Page;
  data: BaseTestData;
  userId: number;
  teamId: string;
}

export interface UnauthenticatedContext {
  page: Page;
  data: BaseTestData;
}

// Base fixture types
export type BaseFixtures = {
  // Authenticated users (sign-in only, no team)
  authenticatedUser: AuthenticatedContext;
  authenticatedAdmin: AuthenticatedContext;

  // Users with team setup (sign-in + team membership)
  userWithTeam: TeamContext;
  adminWithTeam: TeamContext;

  // Unauthenticated page with test data available
  unauthenticatedUser: UnauthenticatedContext;

  // Just test data (no pages/contexts)
  baseTestData: BaseTestData;
  baseAdminTestData: BaseTestData;
};

// Generate deterministic test data
function generateBaseTestData(
  testInfo: TestInfo,
  userType: 'admin' | 'user',
): BaseTestData {
  const uniqueId = `${testInfo.workerIndex}-${Date.now()}`;

  return {
    user: {
      id: `${userType}-${uniqueId}`,
      credentials: generateUserCredentials(testInfo, userType),
      name: `Test ${userType === 'admin' ? 'Admin' : 'User'} ${uniqueId}`,
      type: userType,
    },
  };
}

// Fast authentication helpers using cookies
async function createTestUser(credentials: string): Promise<TestUser> {
  // Parse credentials to extract user type and suffix
  const passwordMatch = credentials.match(/^(password|admin)-(.+)$/);
  if (!passwordMatch) {
    throw new Error(`Invalid credentials format: ${credentials}`);
  }

  const [, baseType, suffix] = passwordMatch;
  const isAdmin = baseType === 'admin';

  const email = isAdmin
    ? `admin-${suffix}@example.com`
    : `user-${suffix}@example.com`;
  const name = isAdmin ? `Test Admin ${suffix}` : `Test User ${suffix}`;

  // Always create a fresh user in database
  const newUsers = await db
    .insert(users)
    .values({
      email,
      name,
      admin: isAdmin,
      image: 'https://avatars.githubusercontent.com/u/67470890?s=200&v=4',
    })
    .returning();

  const newUser = newUsers[0];
  return {
    id: newUser.id.toString(), // Convert integer to string for JWT
    email: newUser.email!,
    name: newUser.name!,
    admin: newUser.admin ?? false,
  };
}

async function generateSessionToken(user: TestUser): Promise<string> {
  const secret =
    process.env.AUTH_SECRET || 'txPLQWs8toKE251TIWiGS6abI4dJafPA5Kd/DTxou6q5';
  const now = Math.floor(Date.now() / 1000);

  const token = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      iat: now,
      exp: now + 60 * 60, // 1 hour expiry
    },
    secret,
    salt: 'authjs.session-token', // Updated for Auth.js v5
  });

  return token;
}

export async function setAuthCookies(
  context: BrowserContext,
  user: TestUser,
): Promise<void> {
  const sessionToken = await generateSessionToken(user);
  const cookieDomain = getCookieDomain();

  // Generate CSRF token - simple random string for tests
  const csrfToken =
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);

  // Set all required Auth.js cookies
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: cookieDomain,
      path: '/',
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'Lax',
    },
    {
      name: 'authjs.csrf-token',
      value: csrfToken,
      domain: cookieDomain,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'authjs.callback-url',
      value: `${getBaseUrl()}/`,
      domain: cookieDomain,
      path: '/',
      httpOnly: false, // This one is typically not httpOnly
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function authenticateUserWithCookie(
  context: BrowserContext,
  credentials: string,
): Promise<void> {
  const user = await createTestUser(credentials);
  await setAuthCookies(context, user);
}

// Create a team and add user as member
async function createUserWithTeam(
  user: TestUser,
  role: 'member' | 'admin' = 'admin',
): Promise<string> {
  const userId = parseInt(user.id);

  // Create a team for the user
  const [team] = await db
    .insert(teams)
    .values({
      name: `${user.name}'s Team`,
      description: `Test team for ${user.name}`,
    })
    .returning();

  // Add user as team member with specified role
  await db.insert(teamMemberships).values({
    teamId: team.id,
    userId,
    role: role === 'admin' ? TEAM_ROLE.ADMIN : TEAM_ROLE.MEMBER,
  });

  return team.id;
}

// Helper function to authenticate user (fast cookie-based method)
async function authenticateUser(
  page: Page,
  credentials: string,
): Promise<void> {
  const context = page.context();
  await authenticateUserWithCookie(context, credentials);

  // Navigate to a page to verify authentication
  await page.goto(`${getBaseUrl()}/dashboard`);
  const basePage = new BasePage(page);
  await basePage.verifyAuthenticated();
}

// Helper function to authenticate user via UI (slower method for testing login flow)
export async function authenticateUserViaUI(
  page: Page,
  credentials: string,
): Promise<void> {
  const signInPage = new SignInPage(page);
  await signInPage.navigateToSignIn();
  await signInPage.signInWithPassword(credentials);

  // Verify authentication completed
  const basePage = new BasePage(page);
  await basePage.verifyAuthenticated();
}

// Extend base test with reusable fixtures
export const test = base.extend<BaseFixtures>({
  // Pure test data generation (no browser contexts)
  baseTestData: async ({}, use, testInfo) => {
    const data = generateBaseTestData(testInfo, 'user');
    await use(data);
  },

  baseAdminTestData: async ({}, use, testInfo) => {
    const data = generateBaseTestData(testInfo, 'admin');
    await use(data);
  },

  // Authenticated regular user (sign-in only)
  authenticatedUser: async ({ browser, baseTestData }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await authenticateUser(page, baseTestData.user.credentials);

    await use({
      page,
      data: baseTestData,
    });

    await context.close();
  },

  // Authenticated admin user (sign-in only)
  authenticatedAdmin: async ({ browser, baseAdminTestData }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await authenticateUser(page, baseAdminTestData.user.credentials);

    await use({
      page,
      data: baseAdminTestData,
    });

    await context.close();
  },

  // Regular user with team (sign-in + team membership)
  userWithTeam: async ({ browser, baseTestData }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Create user and team in database
    const user = await createTestUser(baseTestData.user.credentials);
    const teamId = await createUserWithTeam(user, 'member');
    await setAuthCookies(context, user);

    await use({
      page,
      data: baseTestData,
      userId: parseInt(user.id),
      teamId,
    });

    await context.close();
  },

  // Admin user with team (sign-in + team membership as admin)
  adminWithTeam: async ({ browser, baseAdminTestData }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Create admin user and team in database
    const user = await createTestUser(baseAdminTestData.user.credentials);
    const teamId = await createUserWithTeam(user, 'admin');
    await setAuthCookies(context, user);

    await use({
      page,
      data: baseAdminTestData,
      userId: parseInt(user.id),
      teamId,
    });

    await context.close();
  },

  // Unauthenticated context (clean slate)
  unauthenticatedUser: async ({ browser, baseTestData }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await use({
      page,
      data: baseTestData,
    });

    await context.close();
  },
});

export { expect } from '@playwright/test';
