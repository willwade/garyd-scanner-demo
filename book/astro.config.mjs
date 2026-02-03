import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://example.com',
  base: '/book/',
  output: 'static',
  integrations: [mdx()]
});
