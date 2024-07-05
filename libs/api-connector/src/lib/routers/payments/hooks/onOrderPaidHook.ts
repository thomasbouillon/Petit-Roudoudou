import { Order, User } from '@prisma/client';
import { Context } from '../../../context';
import { routes } from '@couture-next/routing';
import { generateInvoice, uploadInvoiceToStorage } from '../../orders/invoice';
import { OrderItemGiftCard } from '@couture-next/types';
import { triggerISR } from '../../../isr';

// If you need any thing else,
// make sure parent functions are not modifying these state in the same tansaction
type PartialOrder = Pick<
  Order & { user: Pick<User, 'email' | 'firstName' | 'lastName'> },
  'id' | 'totalTaxIncluded' | 'user'
> & { billing: Pick<Order['billing'], 'paymentMethod'> };

/**
 * Extend the transaction to handle side effects of an order being submitted
 */
export async function onOrderPaidHook(ctx: Context, order: PartialOrder) {
  // --- order paid (any)
  await ctx.crm.sendEvent('orderPaid', order.user.email, {}).catch((e) => {
    console.error('Error while sending event orderPaid to CRM', e);
  });

  if (order.billing.paymentMethod === 'BANK_TRANSFER') {
    const orderHref = new URL(
      routes().account().orders().order(order.id).show(),
      ctx.environment.FRONTEND_BASE_URL
    ).toString();
    await ctx.mailer
      .sendEmail(
        'bank-transfer-received',
        {
          email: order.user.email,
          firstname: order.user.firstName ?? '',
          lastname: order.user.lastName ?? '',
        },
        {
          ORDER_HREF: orderHref,
        }
      )
      .catch((e) => {
        console.error('Error while sending email bank-transfer-received', e);
      });
  }

  if (order.billing.paymentMethod === 'CARD') {
    const orderHref = new URL(
      routes().account().orders().order(order.id).show(),
      ctx.environment.FRONTEND_BASE_URL
    ).toString();
    await ctx.mailer
      .sendEmail(
        'card-payment-received',
        {
          email: order.user.email,
          firstname: order.user.firstName ?? '',
          lastname: order.user.lastName ?? '',
        },
        {
          ORDER_HREF: orderHref,
        }
      )
      .catch((e) => {
        console.error('Error while sending email card-payment-received', e);
      });
  }

  // notify crm
  await ctx.crm
    .sendEvent('orderPaid', order.user.email, {})
    .catch((e) => console.warn('Error while sending event orderPaid to CRM', e));

  const freshOrder = await ctx.orm.order
    .findUnique({
      where: {
        id: order.id,
      },
    })
    .catch((e) => {
      console.warn('Error while fetching fresh order', e);
      return null;
    });

  // Create giftcards
  if (freshOrder) {
    const orderItemGiftCards = freshOrder.items.filter((item): item is OrderItemGiftCard => item.type === 'giftCard');
    const orderItemGiftCardsWithUser = await Promise.all(
      orderItemGiftCards.map(async (item) => {
        const user = await ctx.orm.user.findUnique({
          where: {
            email: item.details.recipient.email,
          },
        });
        return {
          ...item,
          user,
        };
      })
    ).catch((e) => {
      console.warn('Error while fetching users for gift cards', e);
      return [];
    });
    if (orderItemGiftCardsWithUser.length > 0) {
      await ctx.orm.giftCard
        .createMany({
          data: orderItemGiftCardsWithUser.map((itemWithUser) => ({
            amount: itemWithUser.totalTaxExcluded,
            consumedAmount: 0,
            status: itemWithUser.user ? 'CLAIMED' : 'UNCLAIMED',
            image: itemWithUser.image,
            userId: itemWithUser.user ? itemWithUser.user.id : null,
            userEmail: !itemWithUser.user ? itemWithUser.details.recipient.email : null,
          })),
        })
        .then(() =>
          Promise.all(
            orderItemGiftCardsWithUser.map((itemWithUser) =>
              ctx.mailer.sendEmail(
                'new-giftcard',
                {
                  email: itemWithUser.details.recipient.email,
                  firstname: itemWithUser.details.recipient.name,
                  lastname: '',
                },
                {
                  GIFTCARD_AMOUNT: itemWithUser.details.amount,
                  GIFTCARD_MESSAGE: itemWithUser.details.text,
                  SENDER_FIRSTNAME: order.user.firstName ?? '',
                }
              )
            )
          )
        )
        .catch((e) => {
          console.warn('Error while creating gift cards', e);
        });
    }
  }

  if (freshOrder) {
    // Generate invoice
    try {
      const pathToInvoice = await generateInvoice(freshOrder);
      const invoice = await uploadInvoiceToStorage(ctx, freshOrder.id, pathToInvoice);
      await ctx.orm.order.update({
        where: {
          id: freshOrder.id,
        },
        data: {
          invoice,
        },
      });
    } catch (e) {
      console.warn('Error while generating invoice, skipping.', e);
    }
  }

  const workshopSessions = freshOrder?.items.filter(
    (
      item
    ): item is (typeof freshOrder)['items'][number] & {
      type: 'workshopSession';
    } => item.type === 'workshopSession'
  );

  // Add user to workshop sessions
  if (freshOrder)
    await Promise.all(
      (workshopSessions ?? [])
        .map((workshopSession) =>
          ctx.orm
            .$runCommandRaw({
              update: 'WorkshopSession',
              updates: [
                {
                  q: {
                    _id: { $oid: workshopSession.workshopId },
                  },
                  u: {
                    $push: {
                      attendeeIds: { $oid: freshOrder.userId },
                    },
                    $inc: {
                      remainingCapacity: -1,
                    },
                  },
                },
              ],
            })
            .then(() => true)
            .catch((e) => {
              console.warn('Error while adding user to workshop sessions', e);
              return false;
            })
            .then((success) => {
              if (success)
                // Send invite email
                return ctx.mailer.sendEmail(
                  'workshop-invite',
                  {
                    email: order.user.email,
                    firstname: order.user.firstName ?? '',
                    lastname: order.user.lastName ?? '',
                  },
                  {
                    WORKSHOP_WHERE: workshopSession.details.location,
                    WORKSHOP_WHEN: new Date(workshopSession.details.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    }),
                    WORKSHOP_NAME: workshopSession.description,
                  }
                );
              return Promise.resolve();
            })
            .then(() =>
              triggerISR(ctx, {
                resource: 'workshopSessions',
                event: 'update',
                workshopSession: { id: workshopSession.workshopId },
              })
            )
        )
        .concat([
          ctx.orm
            .$runCommandRaw({
              update: 'User',
              updates: [
                {
                  q: {
                    _id: { $oid: freshOrder.userId },
                  },
                  u: {
                    $push: {
                      workshopSessionIds: { $oid: freshOrder.id },
                    },
                  },
                },
              ],
            })
            .catch((e) => {
              console.warn('Error while adding user to workshop sessions', e);
            })
            .then(() => {}),
        ])
    );
}
