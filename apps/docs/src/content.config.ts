import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

// Extra front-matter fields for write-ups. They are optional here so overview pages can skip them;
// scripts/check-writeups.mjs makes them required where a platform's rules need them.
const writeup = z.object({
  platform: z.enum(['htb', 'thm', 'portswigger', 'other']).optional(),
  kind: z
    .enum(['machine', 'challenge', 'sherlock', 'endgame', 'starting-point', 'academy-tier-0', 'room', 'lab'])
    .optional(),
  difficulty: z
    .enum(['very-easy', 'easy', 'medium', 'hard', 'insane', 'apprentice', 'practitioner', 'expert'])
    .optional(),
  os: z.enum(['linux', 'windows', 'other']).optional(),
  techniques: z.array(z.string()).default([]),
  // The date the content retired on the platform. HTB write-ups can't be published without it.
  retired: z.coerce.date().optional(),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: writeup }) }),
};
