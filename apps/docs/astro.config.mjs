// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.sneakyram.in',
  trailingSlash: 'always',
  vite: {
    build: {
      // Keep scripts as files in /_astro/ so the Content-Security-Policy stays strict (see scripts/csp.mjs).
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    starlight({
      title: 'SneakyRam Write-ups',
      description: 'Step-by-step write-ups for retired Hack The Box content and other security labs.',
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/SneakyRam' },
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/starshyn' },
      ],
      // Each platform's group lists every page in its folder automatically.
      sidebar: [
        { label: 'Start here', items: ['rules'] },
        { label: 'Hack The Box', items: [{ autogenerate: { directory: 'htb' } }] },
        { label: 'TryHackMe', items: [{ autogenerate: { directory: 'thm' } }] },
        { label: 'PortSwigger Academy', items: [{ autogenerate: { directory: 'portswigger' } }] },
      ],
      components: {
        // Adds the platform, difficulty and retirement facts under each write-up's title.
        PageTitle: './src/components/PageTitle.astro',
      },
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
