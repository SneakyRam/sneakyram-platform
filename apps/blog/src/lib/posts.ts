import { getCollection } from 'astro:content';

/** Published posts, newest first. Drafts are included only while running the dev server. */
export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Every project, in the order set by its `order` field, then by title. */
export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date) {
  return dateFormat.format(date);
}
