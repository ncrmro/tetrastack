import { auth } from '@/app/auth';
import { signInAction, signOutAction } from '@/actions/auth';
import Navigation from './Navigation';

export default async function NavigationWrapper() {
  const session = await auth();
  const isAdmin = session?.user?.admin ?? false;

  return (
    <Navigation
      session={session}
      isAdmin={isAdmin}
      signIn={signInAction}
      signOut={signOutAction}
    />
  );
}
