import rss from '@astrojs/rss';
import { SITE } from '../consts';
import { getPublishedPosts } from '../lib/posts';

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.title} ${SITE.tagline}`,
    description: SITE.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
