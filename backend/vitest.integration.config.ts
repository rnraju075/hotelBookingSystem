import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    globals: true,

    setupFiles: [
      './tests/integration/test-env.ts',
    ],

    include: [
      'tests/integration/**/*.test.ts',
    ],

    coverage: {
      reporter: [
        'text',
        'html',
      ],
    },
  },
});