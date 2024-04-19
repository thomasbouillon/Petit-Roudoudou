import { publicProcedure } from '../../trpc';
import { changeQuantityPayloadSchema } from './dto/changeQuantity';
import { isAuth } from '../../middlewares/isAuth';
import { hasCart } from '../../middlewares/hasCart';
import { cancelDraftOrder } from './utils';
import { Taxes } from '@couture-next/types';
import { Cart } from '@prisma/client';

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
  .input(changeQuantityPayloadSchema)
  .mutation(async ({ ctx, input }) => {
    // TODO add locks at database layer to ensure consistency
    console.log('READ CART');
    const itemIndex = ctx.cart.items.findIndex((item) => item.uid === input.itemUid);
    if (itemIndex < 0) {
      throw new Error('Item not found');
    }

    await cancelDraftOrder(ctx, ctx.cart);
    // TODO check quantities

    if (input.newQuantity > 0) {
      const item = ctx.cart.items[itemIndex];
      const prevQuantity = item.quantity;
      const perItemWeight = item.totalWeight / prevQuantity;
      item.quantity = input.newQuantity;
      item.totalTaxExcluded = item.perUnitTaxExcluded * item.quantity;
      item.totalTaxIncluded = item.perUnitTaxIncluded * item.quantity;
      item.totalWeight = perItemWeight * item.quantity;
      item.taxes = {
        [Taxes.VAT_20]: item.totalTaxIncluded - item.totalTaxExcluded,
      };
    } else {
      ctx.cart.items.splice(itemIndex, 1);
    }

    const [totalTaxExcluded, totalTaxIncluded, taxes, totalWeight] = ctx.cart.items.reduce(
      ([totalTaxExcluded, totalTaxIncluded, taxes, totalWeight], item) => {
        // update taxes
        Object.entries(item.taxes).forEach(([taxName, taxAmount]) => {
          taxes[taxName] = taxes[taxName] ?? 0 + taxAmount;
        });
        return [
          totalTaxExcluded + item.totalTaxExcluded,
          totalTaxIncluded + item.totalTaxIncluded,
          taxes,
          totalWeight + item.totalWeight,
        ];
      },
      [0, 0, {} as Cart['taxes'], 0]
    );

    ctx.cart.totalTaxExcluded = totalTaxExcluded;
    ctx.cart.totalTaxIncluded = totalTaxIncluded;
    ctx.cart.taxes = taxes;
    ctx.cart.totalWeight = totalWeight;

    // TODO notify crm

    const { id, ...newCartWithOutId } = ctx.cart;

    await ctx.orm.cart.update({
      where: { id },
      data: newCartWithOutId,
    });

    return ctx.cart;
  });
