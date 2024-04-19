import { Cart } from '@prisma/client';
import { Context } from '../../context';

export function getPublicUrl(path: string, storageBaseUrl: string) {
  path = encodeURIComponent(path);
  if (!storageBaseUrl.endsWith('%2D') && !storageBaseUrl.endsWith('/')) {
    storageBaseUrl += '/';
  }

  if (path.startsWith('carts')) {
    return `${storageBaseUrl}${path}?alt=media`;
  }

  throw new Error('Not implemented yet');
}

export async function cancelDraftOrder(ctx: Context, cart: Cart) {
  if (!cart.draftOrderId) {
    return;
  }

  const draftOrder = await ctx.orm.order.findUnique({
    where: {
      id: cart.draftOrderId,
    },
  });

  if (!draftOrder) {
    cart.draftOrderId = null;
    return;
  }

  if (draftOrder.status !== 'DRAFT') throw new Error('Cannot cancel non draft order');

  if (draftOrder.billing.paymentMethod === 'CARD') {
    // Cancel the payment session
    if (!draftOrder.billing.checkoutSessionId) throw new Error('Missing checkout session id to cancel order');
    const expired = await ctx.billing.isProviderSessionExpired(draftOrder.billing.checkoutSessionId);
    if (!expired) {
      await ctx.billing.cancelProviderSession(draftOrder.billing.checkoutSessionId);
    }
  }

  await ctx.orm.order.delete({
    where: {
      id: draftOrder.id,
    },
  });
  cart.draftOrderId = null;
}
