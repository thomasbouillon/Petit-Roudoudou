import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const eventSchema = z.object({
  event: z.enum(['items.update', 'items.create', 'items.delete']),
  collection: z
    .string()
    .regex(/^[a-zA-Z0-9\-\/]+$/)
    .transform((v) => {
      if (!v.startsWith('/')) {
        return '/' + v;
      }
      return v;
    }),
});

/**
 * Revalidate the cache when cms content is updated
 */
export async function POST(request: Request) {
  if (!process.env.ISR_SECRET) {
    throw new Error('ISR_SECRET is not set');
  }

  const secret = request.headers.get('X-ISR-TOKEN');
  if (secret !== process.env.ISR_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const event = eventSchema.parse(body);
  revalidateTag('cms-' + event.collection);

  console.info('ISR revalidation triggered for collection', event.collection);

  return new Response('OK');
}
