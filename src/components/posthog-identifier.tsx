'use client';

import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function PostHogIdentifier() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only attempt PostHog identification if PostHog is properly initialized
    if (
      status === 'authenticated' &&
      session?.user &&
      posthog &&
      posthog.__loaded
    ) {
      // Identify user with PostHog on the client
      posthog?.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        admin: session.user.admin,
      });
    }
  }, [session, status]);

  return null; // This component doesn't render anything
}
