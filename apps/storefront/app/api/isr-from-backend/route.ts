import { trpc } from 'apps/storefront/trpc-server';
import { z } from 'zod';

const eventSchema = z.discriminatedUnion('resource', [
  z.object({
    resource: z.literal('articles'),
    event: z.enum(['update', 'create', 'delete']),
    article: z.object({
      id: z.string(),
      slug: z.string(),
    }),
  }),
  z.object({
    resource: z.literal('fabrics'),
    event: z.enum(['update', 'create', 'delete']),
    fabric: z.object({
      id: z.string(),
    }),
  }),
  z.object({
    resource: z.literal('fabricGroups'),
    event: z.enum(['update', 'create', 'delete']),
  }),
  z.object({
    resource: z.literal('articleGroups'),
    event: z.enum(['update', 'create', 'delete']),
    articleGroup: z.object({
      id: z.string(),
      slug: z.string(),
    }),
  }),
  z.object({
    resource: z.literal('articleThemes'),
    event: z.enum(['update', 'create', 'delete']),
    articleTheme: z.object({
      id: z.string(),
      slug: z.string(),
    }),
  }),
]);

/**
 * Revalidate the cache when cms content is updated
 */
export async function POST(request: Request) {
  console.info('ISR revalidation triggered from backend');

  if (!process.env.ISR_SECRET) {
    throw new Error('ISR_SECRET is not set');
  }

  const secret = request.headers.get('X-ISR-TOKEN');
  if (secret !== process.env.ISR_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const event = eventSchema.parse(body);

  const revalidatePromises = [] as Promise<any>[];

  if (event.resource === 'articles') {
    if (event.article) {
      revalidatePromises.push(trpc.articles.findBySlug.revalidate(event.article.slug));
      revalidatePromises.push(trpc.articles.findById.revalidate(event.article.id));
    }
    revalidatePromises.push(trpc.articles.list.revalidate());
  }

  if (event.resource === 'fabrics') {
    if (event.fabric) {
      revalidatePromises.push(trpc.fabrics.findById.revalidate(event.fabric.id));
    }
    revalidatePromises.push(trpc.fabrics.list.revalidate());
  }

  if (event.resource === 'fabricGroups') {
    revalidatePromises.push(trpc.fabricGroups.list.revalidate());
  }

  if (event.resource === 'articleGroups') {
    if (event.articleGroup) {
      revalidatePromises.push(trpc.articleGroups.findBySlug.revalidate(event.articleGroup.slug));
      revalidatePromises.push(trpc.articleGroups.findById.revalidate(event.articleGroup.id));
      revalidatePromises.push(trpc.articleGroups.searchByName.revalidate());
    }
    revalidatePromises.push(trpc.articleGroups.list.revalidate());
  }

  if (event.resource === 'articleThemes') {
    if (event.articleTheme) {
      revalidatePromises.push(trpc.articleThemes.findBySlug.revalidate(event.articleTheme.slug));
      revalidatePromises.push(trpc.articleThemes.findById.revalidate(event.articleTheme.id));
      revalidatePromises.push(trpc.articleThemes.searchByName.revalidate());
    }
    revalidatePromises.push(trpc.articleThemes.list.revalidate());
  }

  await Promise.all(revalidatePromises).catch((err) => {
    console.warn('Warn revalidating, ignoring', err);
  });

  return new Response('OK');
}
