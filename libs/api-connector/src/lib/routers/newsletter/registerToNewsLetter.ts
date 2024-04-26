import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure
  .input(
    z.object({
      name: z.string().min(2).max(255),
      email: z.string().email(),
      category: z.enum(['future-parent', 'parent', 'for-me']),
      privacy: z.literal(true),
    })
  )
  .mutation(async ({ input, ctx }) => {
    await ctx.mailer.subscribeToNewsLetter(
      {
        email: input.email,
        firstname: input.name,
        lastname: '',
      },
      input.category
    );
  });
