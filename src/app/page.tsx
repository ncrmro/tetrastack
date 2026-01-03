import { redirect } from 'next/navigation';
import LandingPage from '../components/LandingPage';
import { auth } from './auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  // If user is authenticated, redirect to dashboard
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
