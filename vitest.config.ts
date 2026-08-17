import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/__tests__/**/*.test.js', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'server/*.js',
        'src/lib/**/*.ts',
        'src/services/api.ts',
        'src/store/useStore.ts',
      ],
      exclude: ['**/__tests__/**', '**/*.test.*', '**/node_modules/**'],
      // 目标：语句/行/函数 100%，分支尽量高
      thresholds: {
        statements: 100,
        lines: 100,
        functions: 100,
        branches: 70,
      },
    },
  },
});
