import { publicProcedure } from '../../trpc';
import { changeQuantityPayloadSchema } from './dto/changeQuantity';
import { isAuth } from '../../middlewares/isAuth';
import { hasCart } from '../../middlewares/hasCart';

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
    // TODO check quantities

    // TODO cancel pending draft order

    if (input.newQuantity > 0) {
      const item = ctx.cart.items[itemIndex];
      item.quantity = input.newQuantity;
    } else {
      ctx.cart.items.splice(itemIndex, 1);
    }

    // TODO update cart total & item totl

    // TODO notify crm

    const { id, ...newCartWithOutId } = ctx.cart;

    await ctx.orm.cart.update({
      where: { id },
      data: newCartWithOutId,
    });

    return ctx.cart;
  });
