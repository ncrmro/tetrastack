import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';
import '@xyflow/react/dist/style.css';
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
      <div className="theme-background min-h-screen text-on-surface">
        <Story />
      </div>
    ),
  ],
};

export default preview;
