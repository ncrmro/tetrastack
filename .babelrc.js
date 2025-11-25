module.exports = {
  presets: [['next/babel']],
  env: {
    // Enable Istanbul instrumentation when E2E_COVERAGE is set
    e2e: {
      plugins: [
        [
          'babel-plugin-istanbul',
          {
            extension: ['.js', '.jsx', '.ts', '.tsx'],
            exclude: [
              'node_modules',
              'tests',
              '**/*.test.{js,ts,tsx}',
              '**/*.spec.{js,ts,tsx}',
              'coverage',
              '.next',
              'dist',
            ],
          },
        ],
      ],
    },
  },
};
