import { routes } from '@couture-next/routing';
import { BlogPost, fetchFromCMS } from 'apps/storefront/directus';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { MetadataRoute } from 'next';
import slugify from 'slugify';
import env from '../../env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = useDatabase();

  const [blogPosts, blogUpdatedAt] = await Promise.all([
    fetchFromCMS<BlogPost[]>('/posts', {
      fields: 'id,title,date_updated',
    }),
    getDoc(doc(collection(db, 'cms-metadata'), 'blog')).then((snap) =>
      snap.exists() ? new Date(snap.data()!.updatedAt).toISOString() : undefined
    ),
  ]);

  return blogPosts
    .map(
      (blogPost) =>
        ({
          url:
            env.BASE_URL +
            routes()
              .blog()
              .post(slugify(blogPost.title, { lower: true }), blogPost.id.toString()),
          lastModified: blogPost.date_updated,
          priority: 0.6,
        } satisfies MetadataRoute.Sitemap[0])
    )
    .concat({
      url: env.BASE_URL + routes().blog().index(),
      lastModified: blogUpdatedAt!,
      priority: 0.5,
    } satisfies MetadataRoute.Sitemap[0]);
}
