'use server';

import { auth } from '@/app/auth';
import type { ActionResult } from '@/lib/actions';
import { db } from '@/database';
import { users } from '@/database/schema.auth';
import { eq } from 'drizzle-orm';

/**
 * Complete user onboarding
 * Marks the user's onboarding as complete
 * Requires authentication
 */
export async function completeOnboarding(): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update user's onboarding completion status
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
      })
      .where(eq(users.id, session.user.id));

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Failed to complete onboarding:', err);
    return {
      success: false,
      error: 'Failed to complete onboarding',
    };
  }
}
