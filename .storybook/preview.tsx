import type { Preview } from '@storybook/react-vite';
import '../src/app/globals.css';
import * as React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="theme-background min-h-screen p-8 text-on-surface">
        <Story />
      </div>
    ),
  ],
};

export default preview;
