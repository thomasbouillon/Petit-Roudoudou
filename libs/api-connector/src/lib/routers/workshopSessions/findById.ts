import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { triggerISR } from '../../isr';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const workshopSession = await ctx.orm.workshopSession.findUnique({
    where: {
      id: input,
    },
    include: {
      attendees: true,
    },
  });

  if (!workshopSession) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Workshop session not found',
    });
  }

  await triggerISR(ctx, {
    resource: 'workshopSessions',
    event: 'update',
    workshopSession: {
      id: workshopSession.id,
    },
  });

  return workshopSession;
});
