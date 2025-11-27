'use client'

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import type { Session } from 'next-auth'
import { useState } from 'react'
import AccountDropdown from '@/components/AccountDropdown'
import { Button } from '@/components/ui/button'
import { Nav } from '@/components/ui/nav'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface NavigationProps {
  session: Session | null
  isAdmin: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export default function Navigation({
  session,
  isAdmin,
  signIn,
  signOut,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Nav sticky intensity="light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-on-surface hover:text-primary transition-colors"
            >
              Next.js Boilerplate
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {session?.user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/teams"
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Teams
                </Link>
                <Link
                  href="/projects"
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Projects
                </Link>
                <Link
                  href="/tasks"
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Tasks
                </Link>
              </>
            )}
            <ThemeToggle />
            {session?.user ? (
              <AccountDropdown
                session={session}
                isAdmin={isAdmin}
                signOut={signOut}
              />
            ) : (
              <form
                action={async () => {
                  await signIn()
                }}
              >
                <Button type="submit" variant="tertiary" className="text-sm">
                  Sign in
                </Button>
              </form>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-outline">
              {session?.user && (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/teams"
                    className="block px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Teams
                  </Link>
                  <Link
                    href="/projects"
                    className="block px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/tasks"
                    className="block px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tasks
                  </Link>
                  <Link
                    href="/account"
                    className="block px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Account
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-primary hover:text-primary/80 transition-colors font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
              <div className="px-3 py-2">
                {session?.user ? (
                  <form
                    action={async () => {
                      await signOut()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full text-left px-4 py-2 text-sm"
                    >
                      Sign out
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      await signIn()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Button
                      type="submit"
                      variant="tertiary"
                      className="w-full text-left"
                    >
                      Sign in
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Nav>
  )
}
