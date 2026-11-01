// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.sneakyram.in',
  // Every page is a folder with an index.html, which is what Apache/LiteSpeed serve best.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
  vite: {
    build: {
      // Never inline small scripts into the HTML. Each script stays a file in /_astro/,
      // so the Content-Security-Policy can stay strict (see scripts/csp.mjs).
      assetsInlineLimit: 0,
    },
  },
});
