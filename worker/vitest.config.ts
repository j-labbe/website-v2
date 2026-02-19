import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@jacklabbe/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
