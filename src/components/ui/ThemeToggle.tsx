'use client';

import { useState, useEffect, useCallback } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

function getInitialColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const storedColorScheme = localStorage.getItem('color-scheme');
  if (storedColorScheme === 'light' || storedColorScheme === 'dark') {
    return storedColorScheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function ThemeToggle() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    getInitialColorScheme,
  );

  const syncDocumentClass = useCallback((scheme: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(scheme);
  }, []);

  useEffect(() => {
    syncDocumentClass(colorScheme);
  }, [colorScheme, syncDocumentClass]);

  const toggleDarkMode = () => {
    const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newColorScheme);
    localStorage.setItem('color-scheme', newColorScheme);
  };

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
  );
}
