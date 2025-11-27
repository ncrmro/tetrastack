import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '../components/AuthProvider'
import NavigationWrapper from '../components/NavigationWrapper'
import PostHogIdentifier from '../components/posthog-identifier'

export const metadata: Metadata = {
  title: 'Meze - Transform Your Meal Prep',
  description:
    'A comprehensive meal prepping platform that makes nutrition and meal planning effortless, leading to healthier living, better aesthetics, and often reduced food costs.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
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
  )
}
