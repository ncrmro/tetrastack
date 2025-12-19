import type { Metadata } from 'next';
import './globals.css';
import NavigationWrapper from '../components/NavigationWrapper';
import AuthProvider from '../components/AuthProvider';
import PostHogIdentifier from '../components/posthog-identifier';

export const metadata: Metadata = {
  title: 'Tetrastack - Project Management',
  description:
    'A comprehensive project management platform for teams to collaborate on projects and tasks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased bg-background text-on-background`}>
        <AuthProvider>
          <PostHogIdentifier />
          <NavigationWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
