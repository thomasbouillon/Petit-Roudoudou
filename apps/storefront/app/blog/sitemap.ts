import { routes } from '@couture-next/routing';
import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import { MetadataRoute } from 'next';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await fetchFromCMS<BlogPost[]>('/posts', {
    fields: 'id,title,date_updated',
  });

  return blogPosts.map((blogPost) => ({
    url: routes()
      .blog()
      .post(slugify(blogPost.title, { lower: true }), blogPost.id.toString()),
    lastModified: blogPost.date_updated,
    priority: 0.8,
  })) satisfies MetadataRoute.Sitemap;
}
