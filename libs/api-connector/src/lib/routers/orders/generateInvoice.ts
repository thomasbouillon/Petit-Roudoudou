import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { generateInvoice, uploadInvoiceToStorage } from './invoice';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: {
        id: input,
      },
    });

    if (!order)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });

    if (order.invoice) return;

    const pathToInvoice = await generateInvoice(order);
    const invoice = await uploadInvoiceToStorage(ctx, order.id, pathToInvoice);

    await ctx.orm.order.update({
      where: { id: order.id },
      data: { invoice },
    });
  });
