import { OrderItemInStock } from '@couture-next/types';
import { Cart, Order, Prisma, User } from '@prisma/client';
import { triggerISR } from '../../../isr';
import { Context } from '../../../context';
import { routes } from '@couture-next/routing';
import { moveImageFromCartToOrder } from './utils';
import { ObjectId } from 'bson';

// If you need any thing else,
// make sure parent functions are not modifying these state in the same tansaction
type PartialOrder = Pick<
  Order & { user: Pick<User, 'email' | 'firstName' | 'lastName' | 'id'> } & {
    billing: Pick<Order['billing'], 'giftCards'>;
  },
  'id' | 'promotionCode' | 'items' | 'user' | 'totalTaxIncluded' | 'status' | 'billing'
>;

type ContextWithMaybeCart = Context & { cart?: Cart };

/**
 * Extend the transaction to handle side effects of an order being submitted
 */
export async function onOrderSubmittedHook(
  ctx: ContextWithMaybeCart,
  transaction: Prisma.TransactionClient,
  order: PartialOrder
) {
  const allPromises = [] as Promise<any>[];

  // Update promotion code usage
  if (order.promotionCode) {
    allPromises.push(
      transaction.promotionCode.update({
        where: {
          code: order.promotionCode.code,
        },
        data: {
          used: {
            increment: 1,
          },
        },
      })
    );
  }

  // update giftcards
  allPromises.push(
    ...Object.entries((order.billing.giftCards as PrismaJson.OrderBillingGiftCards) ?? {}).map(([giftCardId, amount]) =>
      transaction.giftCard.update({
        where: {
          id: giftCardId,
        },
        data: {
          consumedAmount: {
            increment: amount,
          },
        },
      })
    )
  );

  // Update article stocks
  // TODO prefetch articles to prevent fetching same article multiple times
  const inStockItems = order.items.filter((item): item is OrderItemInStock => item.type === 'inStock');
  const syncStockPromises = inStockItems.map(async (item) => {
    if (!item.originalArticleId) throw new Error('Article ID is missing');
    if (!item.originalStockId) throw new Error('Original stock ID is missing');

    const article = await transaction.article.findUniqueOrThrow({
      where: {
        id: item.originalArticleId,
      },
    });
    const stockIndex = article.stocks.findIndex((stock) => stock.uid === item.originalStockId);
    await transaction
      .$runCommandRaw({
        update: 'Article',
        updates: [
          {
            q: {
              _id: { $oid: item.originalArticleId },
            },
            u: {
              $inc: {
                ['stocks.' + stockIndex + '.stock']: -item.quantity,
              },
            },
          },
        ],
      })
      .then((result) => {
        if (result['nModified'] === 0) {
          console.debug('Failed to update stock', result);
          throw new Error('Failed to update stock');
        }
      });
  });

  allPromises.push(...syncStockPromises);
  await Promise.all(allPromises);

  // fetch articles that were updated
  const allArticleIds = Array.from(new Set(inStockItems.map((item) => item.originalArticleId)));

  const updatedArticles = await transaction.article
    .findMany({
      where: {
        id: {
          in: allArticleIds,
        },
      },
      select: {
        id: true,
        slug: true,
        stocks: true,
      },
    })
    .catch((e) => {
      console.warn('Error while fetching articles, skipping ISR. Error:', e);
      return [];
    });

  // Update carts contains the updated articles (inStock only)
  const updatedStockUid = Array.from(new Set(inStockItems.map((item) => item.originalStockId)));
  const res = await transaction
    .$runCommandRaw({
      find: 'Cart',
      batchSize: 200,
      filter: {
        'items.type': 'inStock',
        'items.stockUid': { $in: updatedStockUid },
        userId: { $ne: { $uid: order.user.id } },
      },
    })
    .then((r) => r as unknown as { cursor: { id: string; firstBatch: Cart[] } });

  const newAvailableStockQuantities = updatedArticles.reduce((acc, article) => {
    article.stocks.forEach((stock) => {
      if (updatedStockUid.includes(stock.uid)) acc[stock.uid] = stock.stock;
    });
    return acc;
  }, {} as Record<string, number>);
  if ('ok' in res && res.ok === 1 && 'cursor' in res && 'firstBatch' in res.cursor) {
    for (const cart of res.cursor.firstBatch as Cart[]) {
      const newQuantitiesInCartByStockUid = {} as Record<string, number>;
      const updates = {} as Record<string, number>;
      cart.items.forEach((item, i) => {
        if (item.type === 'inStock' && updatedStockUid.includes(item.stockUid)) {
          // max available quantity
          console.log(
            'item',
            item.quantity,
            newAvailableStockQuantities[item.stockUid],
            newQuantitiesInCartByStockUid[item.stockUid] ?? 0
          );
          const newQuantity = Math.min(
            item.quantity,
            newAvailableStockQuantities[item.stockUid] - (newQuantitiesInCartByStockUid[item.stockUid] ?? 0)
          );
          // prepare update if changed
          if (newQuantity !== item.quantity) {
            updates[i.toString()] = newQuantity;
            newQuantitiesInCartByStockUid[item.stockUid] =
              newQuantity + (newQuantitiesInCartByStockUid[item.stockUid] ?? 0);
          }
        }
      });
      const formattedUpdates = Object.entries(updates).reduce(
        (acc, [i, quantity]) => {
          if (quantity === 0) {
            acc.$pull.items.uid.$in.push(cart.items[parseInt(i)].uid);
          } else {
            acc.$set[`items.${i}.quantity`] = quantity;
            acc.$set[`items.${i}.totalTaxExcluded`] = quantity * cart.items[parseInt(i)].perUnitTaxExcluded;
            acc.$set[`items.${i}.totalTaxIncluded`] = quantity * cart.items[parseInt(i)].perUnitTaxIncluded;
            acc.$set[`items.${i}.totalWeight`] =
              quantity * (cart.items[parseInt(i)].totalWeight / cart.items[parseInt(i)].quantity);
            acc.$set[`items.${i}.taxes`] = Object.entries(cart.items[parseInt(i)].taxes).reduce(
              (acc, [tax, taxAmount]) => {
                acc[tax] = (taxAmount / cart.items[parseInt(i)].quantity) * quantity;
                return acc;
              },
              {} as Record<string, number>
            );
          }

          // TODO TAXES WHEN enabling then back
          return acc;
        },
        {
          $pull: { items: { uid: { $in: [] as string[] } } },
          $set: {} as Record<string, any>,
        }
      );
      if (Object.keys(formattedUpdates.$set).length > 0 || Object.keys(formattedUpdates.$pull).length > 0) {
        await transaction
          .$runCommandRaw({
            update: 'Cart',
            updates: [
              {
                q: {
                  _id: (cart as unknown as { _id: ObjectId })._id,
                },
                u: formattedUpdates,
              },
            ],
          })
          .then((result) => {
            if (result['nModified'] === 0) {
              console.debug('Failed to update cart', result);
              throw new Error('Failed to update cart');
            }
          })
          .then(() =>
            transaction.$runCommandRaw({
              update: 'Cart',
              updates: [
                {
                  q: {
                    _id: (cart as unknown as { _id: ObjectId })._id,
                  },
                  u: [
                    {
                      $set: {
                        totalTaxExcluded: { $sum: '$items.totalTaxExcluded' },
                        totalTaxIncluded: { $sum: '$items.totalTaxIncluded' },
                        totalWeight: { $sum: '$items.totalWeight' },
                      },
                    },
                  ],
                },
              ],
            })
          )
          .then((result) => {
            if (result['nModified'] === 0) {
              console.debug('Failed to update cart', result);
              throw new Error('Failed to update cart');
            }
          })
          .catch((e) => {
            console.warn('Error while updating cart', e);
            throw e;
          });
      } else {
        console.warn('Cart matched but nothing to update', (cart as any)._id);
      }
    }

    if ((res.cursor.firstBatch as Array<unknown>).length > 199) {
      console.warn('More than 200 carts matched, skipping update for the rest');
    }
  } else {
    console.warn('Error while updating carts, skipping', res);
    throw new Error('Error while updating carts');
  }

  // Trigger ISR for all articles that were updated
  await Promise.all(
    updatedArticles.map(async ({ id, slug }) => {
      await triggerISR(ctx, {
        resource: 'articles',
        event: 'update',
        article: { id, slug },
      });
    })
  ).catch((e) => {
    console.warn('Error while triggering ISR, skipping. Error:', e);
  });

  // Send emails
  await ctx.mailer
    .sendEmail('admin-new-order', ctx.environment.ADMIN_EMAIL, {
      ORDER_HREF: new URL(
        routes().admin().orders().order(order.id).show(),
        ctx.environment.FRONTEND_BASE_URL
      ).toString(),
    })
    .catch((e) => {
      console.warn('Error while sending email to admin', e);
    });

  // --- waiting payment ----
  if (order.status === 'WAITING_BANK_TRANSFER') {
    await ctx.mailer
      .sendEmail(
        'bank-transfer-instructions',
        {
          email: order.user.email,
          firstname: order.user.firstName ?? '',
          lastname: order.user.lastName ?? '',
        },
        {
          ORDER_TOTAL: order.totalTaxIncluded.toFixed(2),
        }
      )
      .catch((e) => {
        console.warn('Error while sending email to customer', e);
      });
  }

  console.log('moving images');

  // Move images from cart to order
  await Promise.all(
    order.items.map((item, i) =>
      moveImageFromCartToOrder(ctx, order.id, item.image)
        .then((newImage) =>
          // update order item image
          transaction.$runCommandRaw({
            update: 'Order',
            updates: [
              {
                q: {
                  _id: { $oid: order.id },
                },
                u: {
                  $set: {
                    ['items.' + i + '.image']: newImage,
                  },
                },
              },
            ],
          })
        )
        .catch((e) => {
          console.warn('Error while moving image from cart to order', e);
        })
    )
  );

  // // TODO check if submitted is the right event for gift cards
  await ctx.crm.sendEvent('orderSubmitted', order.user.email, {}).catch((e) => {
    console.error('Error while sending event orderSubmitted to CRM', e);
  });
}
