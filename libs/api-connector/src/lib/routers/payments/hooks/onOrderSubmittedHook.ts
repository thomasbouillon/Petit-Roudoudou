import { OrderItemInStock } from '@couture-next/types';
import { Order, Prisma, User } from '@prisma/client';
import { triggerISR } from '../../../isr';
import { Context } from '../../../context';
import { routes } from '@couture-next/routing';
import { moveImageFromCartToOrder } from './utils';

// If you need any thing else,
// make sure parent functions are not modifying these state in the same tansaction
type PartialOrder = Pick<
  Order & { user: Pick<User, 'email' | 'firstName' | 'lastName'> } & {
    billing: Pick<Order['billing'], 'giftCards'>;
  },
  'id' | 'promotionCode' | 'items' | 'user' | 'totalTaxIncluded' | 'status' | 'billing'
>;

/**
 * Extend the transaction to handle side effects of an order being submitted
 */
export async function onOrderSubmittedHook(ctx: Context, transaction: Prisma.TransactionClient, order: PartialOrder) {
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
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate slow stock update
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

  console.log(order.billing.giftCards);

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

  await Promise.all(allPromises);

  // Trigger ISR for all articles that were updated
  const allArticleIds = Array.from(
    new Set(inStockItems.map((item) => (item.type === 'inStock' ? item.originalArticleId : null)))
  ).filter((v): v is string => typeof v === 'string');

  await ctx.orm.article
    .findMany({
      where: {
        id: {
          in: allArticleIds,
        },
      },
      select: {
        id: true,
        slug: true,
      },
    })
    .catch((e) => {
      console.warn('Error while fetching articles, skipping ISR. Error:', e);
      return [];
    })
    .then((articles) => {
      return Promise.all(
        articles.map(async ({ id, slug }) => {
          await triggerISR(ctx, {
            resource: 'articles',
            event: 'update',
            article: { id, slug },
          });
        })
      );
    })
    .catch((e) => {
      console.warn('Error while triggering ISR, skipping. Error:', e);
    });

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
  // await crmClient.sendEvent('orderSubmitted', nextData.user.email, {}).catch((e) => {
  //   console.error('Error while sending event orderSubmitted to CRM', e);
  // });
}

// --- order paid (any)
//   const crmClient = getClient(crmSecret.value());
//   await crmClient.sendEvent('orderPaid', nextData.user.email, {}).catch((e) => {
//     console.error('Error while sending event orderPaid to CRM', e);
//   });

// --- order paid (bank transfer)
// const mailer = getMailer();
//   const orderHref = new URL(
//     routes().account().orders().order(snapshotAfter.id).show(),
//     env.FRONTEND_BASE_URL
//   ).toString();
//   await mailer.scheduleSendEmail(
//     'bank-transfer-received',
//     {
//       email: nextData.user.email,
//       firstname: nextData.user.firstName,
//       lastname: nextData.user.lastName,
//     },
//     {
//       ORDER_HREF: orderHref,
//     }
//   );
//   await mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, { ORDER_HREF: orderHref });

// --- order paid (card)
// Order paid by card
//   const mailer = getMailer();
//   const orderHref = new URL(
//     routes().account().orders().order(snapshotAfter.id).show(),
//     env.FRONTEND_BASE_URL
//   ).toString();
//   await mailer.scheduleSendEmail(
//     'card-payment-received',
//     {
//       email: nextData.user.email,
//       firstname: nextData.user.firstName,
//       lastname: nextData.user.lastName,
//     },
//     {
//       ORDER_HREF: orderHref,
//     }
//   );
//   await mailer.scheduleSendEmail('admin-new-order', env.ADMIN_EMAIL, { ORDER_HREF: orderHref });
