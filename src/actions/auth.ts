'use server';

import { signIn as authSignIn, signOut as authSignOut } from '@/app/auth';

export async function signInAction() {
  await authSignIn();
}

export async function signOutAction() {
  await authSignOut({ redirectTo: '/' });
}
