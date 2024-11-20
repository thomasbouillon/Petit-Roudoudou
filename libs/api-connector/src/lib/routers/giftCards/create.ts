import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';

const schema = z.object({
  code: z.string().regex(/^.{4}-.{4}-.{4}$/, 'Mauvais format'),
  amount: z.number().positive(),
});
export default publicProcedure
  .use(isAdmin())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    await ctx.orm.giftCard.create({
      data: {
        code: input.code,
        amount: input.amount,
        status: 'UNCLAIMED',
        consumedAmount: 0,
      },
    });
  });
