import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Files whose names start with "_" (like _template.md) are skipped by the pattern below,
// so templates and notes can live next to real posts without ever being published.
const notUnderscored = '**/[^_]*.{md,mdx}';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: notUnderscored }),
  schema: z.object({
    title: z.string().max(100),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Lowercase words joined by hyphens, so every tag makes a clean URL: /tags/web-security/
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
    // Set this to a project's file name (without .md) to list the post in that project's build log.
    project: reference('projects').optional(),
    // Drafts show up in `npm run dev:blog` but are left out of every build.
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: notUnderscored }),
  schema: z.object({
    title: z.string().max(80),
    summary: z.string().max(200),
    status: z.enum(['idea', 'building', 'live', 'paused']),
    stack: z.array(z.string()).default([]),
    started: z.coerce.date(),
    repo: z.url().optional(),
    link: z.url().optional(),
    // Lower numbers are listed first.
    order: z.number().int().default(100),
  }),
});

export const collections = { posts, projects };
