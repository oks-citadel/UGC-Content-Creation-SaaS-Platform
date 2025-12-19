import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/user.ts',
    'src/campaign.ts',
    'src/content.ts',
    'src/creator.ts',
    'src/commerce.ts',
    'src/analytics.ts',
    'src/api.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
