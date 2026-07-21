import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/scheduler.ts', 'src/testing/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
});
