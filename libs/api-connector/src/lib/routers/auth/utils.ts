import { Context } from '../../context';

export async function mergeCart(ctx: Context, fromUserId: string, toUserId: string) {
  console.log(toUserId);
  const fromUserCart = await ctx.orm.cart.findUnique({
    where: {
      userId: fromUserId,
    },
  });
  const toUserCart = await ctx.orm.cart.findUnique({
    where: {
      userId: toUserId,
    },
  });

  console.log(fromUserCart, toUserCart);

  // fromUserId has no cart or empty, skip
  if (!fromUserCart) {
    return;
  }

  if (!fromUserCart.items.length || toUserCart?.items.length) {
    console.log('fromUserCart is empty or toUserCart is not empty, deleting fromUserCart, id=');
    console.log(fromUserCart.id);
    await ctx.orm.cart.delete({
      where: {
        id: fromUserCart.id,
      },
    });
    return;
  }

  // to user cart was empty, copy
  await ctx.orm.$transaction(async ($t) => {
    // set attach "from" cart to "to" user
    if (toUserCart) {
      await $t.cart.delete({
        where: {
          id: toUserCart.id,
        },
      });
      console.log('DELETED');
    }
    await $t.cart.update({
      where: {
        id: fromUserCart.id,
      },
      data: {
        userId: {
          set: toUserId,
        },
      },
    });
  });
}
