'use client'

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>()

  useEffect(() => {
    const storedColorScheme = localStorage.getItem('color-scheme')
    if (storedColorScheme) {
      setColorScheme(storedColorScheme as 'light' | 'dark')
      document.documentElement.classList.add(storedColorScheme)
    } else {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      setColorScheme(systemPreference)
    }
  }, [])

  const toggleDarkMode = () => {
    const newColorScheme = colorScheme === 'light' ? 'dark' : 'light'
    setColorScheme(newColorScheme)
    document.documentElement.classList.add(newColorScheme)
    document.documentElement.classList.remove(colorScheme!)
    localStorage.setItem('color-scheme', newColorScheme)
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-100"
      aria-label="Toggle dark mode"
    >
      {colorScheme === 'light' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}
