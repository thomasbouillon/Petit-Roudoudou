import { Role, User } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import { Context } from '../context';
import { MiddlewareBuilder } from '@trpc/server/dist/unstable-core-do-not-import';

const handler = async (ctx: Context) => {
  // get token from cookies
  const token = ctx.cookies.getAuthCookie();
  if (!token) return { user: null };

  // get user from token
  let userId: string;
  let jwtExpiresAt: number | undefined;
  try {
    const decoded = ctx.auth.jwt.decode(token);
    userId = decoded.id;
    jwtExpiresAt = decoded.expiresAt;
  } catch (error) {
    ctx.cookies.clearAuthCookie();
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  const user = await ctx.orm.user.findUnique({
    where: {
      id: userId,
    },
  });

  // checks
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  // refresh cookie if expires soon (-30min)
  if (jwtExpiresAt && jwtExpiresAt - Date.now() < 1000 * 60 * 30) {
    const newToken = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(newToken);
  }

  return {
    user,
  };
};

export const isAuth: <AllowGuest extends boolean | undefined = false>(opts?: {
  role?: Role;
  allowGuest?: AllowGuest;
}) => NewBuilder<ReturnType<typeof middleware>, { user: AllowGuest extends true ? User | null : User }> = (opts) => {
  return middleware(async ({ ctx, next }) => {
    let user: User | null = null;
    try {
      user = (await handler(ctx)).user;
    } catch (error) {
      if (opts?.allowGuest !== true || !(error instanceof TRPCError) || error.code !== 'UNAUTHORIZED') throw error;
    }
    if (!user && opts?.allowGuest !== true) throw new TRPCError({ code: 'UNAUTHORIZED' });
    if (opts?.role && opts.role !== 'USER' && user?.role !== opts.role) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { user: user } });
  });
};

export type NewBuilder<T, U> = T extends MiddlewareBuilder<
  infer TBase,
  infer TMeta,
  infer TContextOverrides,
  infer TInputOut
>
  ? MiddlewareBuilder<TBase, TMeta, TContextOverrides & U, TInputOut>
  : never;
