import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const base = process.env.ASTRO_BASE ?? '/book/';

export default defineConfig({
  site: 'https://willwade.github.io/garyd-scanner-demo',
  base,
  output: 'static',
  integrations: [mdx()]
});
