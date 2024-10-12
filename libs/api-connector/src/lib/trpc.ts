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

    if (error.code === 'INTERNAL_SERVER_ERROR' && process.env.NODE_ENV !== 'development') {
      return {
        code: shape.code,
        message: 'Internal server error',
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          httpStatus: 500,
          path: shape.data.path,
          cause: undefined,
        },
      };
    }

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
  const result = await next();

  if (!result.ok)
    // ? console.log(JSON.stringify({ status: 'info', type, duration, path }))
    console.error(JSON.stringify({ status: 'error', type, path }));
  return result;
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure.use(logger);
