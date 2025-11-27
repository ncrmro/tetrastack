import type { TestInfo } from '@playwright/test'

/**
 * Generate unique user credentials for E2E tests based on worker index and timestamp
 * to avoid conflicts between parallel test runs
 */
export function generateUserCredentials(
  testInfo: TestInfo,
  role: 'user' | 'admin' = 'user',
) {
  const workerIndex = testInfo.workerIndex
  const timestamp = Date.now()
  const suffix = `${workerIndex}-${timestamp}`

  const basePassword = role === 'admin' ? 'admin' : 'password'
  return `${basePassword}-${suffix}`
}
