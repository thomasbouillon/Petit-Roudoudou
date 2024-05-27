import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';
import { ErrorCodes } from '@couture-next/utils';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;

    let cause = error.cause?.message;
    if (cause && !(cause in ErrorCodes)) cause = undefined;

    return {
      ...shape,
      data: {
        ...shape.data,
        cause: cause as ErrorCodes | undefined,
      },
    };
  },
});

const logger = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  result.ok
    ? console.log(JSON.stringify({ status: 'info', type, duration, path }))
    : console.error(JSON.stringify({ status: 'error', type, duration, path }));
  return result;
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure.use(logger);
