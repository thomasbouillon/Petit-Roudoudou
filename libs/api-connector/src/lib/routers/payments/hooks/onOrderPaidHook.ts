import { Order, User } from '@prisma/client';
import { Context } from '../../../context';
import { routes } from '@couture-next/routing';

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
  // const allPromises = [] as Promise<any>[];
  // await Promise.all(allPromises);

  // TODO notify crm

  // --- order paid (any)
  // const crmClient = getClient(crmSecret.value());
  // await crmClient.sendEvent('orderPaid', nextData.user.email, {}).catch((e) => {
  //   console.error('Error while sending event orderPaid to CRM', e);
  // });

  if (order.billing.paymentMethod === 'BANK_TRANSFER') {
    const orderHref = new URL(
      routes().account().orders().order(order.id).show(),
      ctx.environment.FRONTEND_BASE_URL
    ).toString();
    await ctx.mailer.sendEmail(
      'bank-transfer-received',
      {
        email: order.user.email,
        firstname: order.user.firstName ?? '',
        lastname: order.user.lastName ?? '',
      },
      {
        ORDER_HREF: orderHref,
      }
    );
  }

  if (order.billing.paymentMethod === 'CARD') {
    const orderHref = new URL(
      routes().account().orders().order(order.id).show(),
      ctx.environment.FRONTEND_BASE_URL
    ).toString();
    await ctx.mailer.sendEmail(
      'card-payment-received',
      {
        email: order.user.email,
        firstname: order.user.firstName ?? '',
        lastname: order.user.lastName ?? '',
      },
      {
        ORDER_HREF: orderHref,
      }
    );
  }
}
