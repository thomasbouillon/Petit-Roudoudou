import {
  BillingOrderItem,
  CallGetCartPaymentUrlResponse,
  NewDraftOrder,
  CallGetCartPaymentUrlPayload,
  PromotionCode,
  OrderItem,
  Order,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { createStripeClient } from '@couture-next/billing';
import { defineSecret } from 'firebase-functions/params';
import { routes } from '@couture-next/routing';
import env from '../env';
import { adminFirestoreNewDraftOrderConverter, cartContainsCustomizedItems } from '@couture-next/utils';
import { firebaseServerImageLoader } from '@couture-next/utils';
import { cartToOrder, findCartWithLinkedDraftOrder, saveOrderAndLinkToCart, userInfosSchema } from './utils';
import { BoxtalClient } from '@couture-next/shipping';
import { trpc } from '../trpc';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');
const boxtalUserSecret = defineSecret('BOXTAL_USER');
const boxtalPassSecret = defineSecret('BOXTAL_SECRET');

export const callGetCartPaymentUrl = onCall<unknown, Promise<CallGetCartPaymentUrlResponse>>(
  { cors: '*', secrets: [stripeKeySecret, boxtalUserSecret, boxtalPassSecret] },
  async (event) => {
    const userId = event.auth?.uid;
    const userEmail = event.auth?.token.email;
    if (!userId) throw new Error('No user id provided');
    if (!userEmail) throw new Error('No user email provided');
    if (event.auth?.token.firebase.sign_in_provider === 'anonymous') throw new Error('User is anonymous');

    const payload = userInfosSchema.parse(event.data) satisfies CallGetCartPaymentUrlPayload;

    let {
      cart,
      cartRef,
      draftOrder: existing,
      draftOrderRef: existingRef,
    } = await findCartWithLinkedDraftOrder(userId);

    const db = getFirestore();

    // Check if admin disabled custom articles
    if (cartContainsCustomizedItems(cart)) {
      const allowNewOrdersWithCustomArticles = await trpc.settings.getValue.query('allowNewOrdersWithCustomArticles');

      if (!allowNewOrdersWithCustomArticles) {
        console.error('Setting allowNewOrdersWithCustomArticles not found');
        throw new Error('Customized articles not allowed for now, please use in stock articles only');
      }
    }

    // Check if admin disabled urgent orders
    if (payload.extras.reduceManufacturingTimes) {
      const allowNewOrdersWithReducedManufacturingTimes = await trpc.settings.getValue.query(
        'allowNewOrdersWithReducedManufacturingTimes'
      );

      if (!allowNewOrdersWithReducedManufacturingTimes) {
        payload.extras.reduceManufacturingTimes = false;
      }
    }

    // Find promotionCode
    // TODO when migrating orders
    // const promotionCodeSnapshot = payload.promotionCode
    //   ? await db.collection('promotionCodes').where('code', '==', payload.promotionCode).get()
    //   : undefined;

    // if (promotionCodeSnapshot?.empty === true) throw new Error('Promotion code not found');

    const promotionCode = undefined as PromotionCode | undefined; // promotionCodeSnapshot?.docs[0].data() as Omit<PromotionCode, '_id'> | undefined;

    // check if promotion code is suitable for this cart
    if (
      promotionCode &&
      ((promotionCode.conditions.usageLimit && promotionCode.conditions.usageLimit <= promotionCode.used) ||
        (promotionCode.conditions.until && promotionCode.conditions.until.getTime() < Date.now()) ||
        (promotionCode.conditions.minAmount !== undefined &&
          promotionCode.conditions.minAmount >
            cart.totalTaxIncluded + (payload.extras.reduceManufacturingTimes ? 15 : 0)))
    ) {
      console.warn('Promotion code is not suitable for this cart');
      throw new Error('Promotion code not found');
    }

    // If edited shipping or extras (so new draft)
    if (
      existingRef &&
      existing &&
      (JSON.stringify(existing.shipping) !== JSON.stringify(payload.shipping) ||
        JSON.stringify(existing.extras) !== JSON.stringify(payload.extras) ||
        existing.promotionCode?.code !== payload.promotionCode)
    ) {
      await existingRef.delete();
      existingRef = null;
      existing = null;
    }

    const stripeClient = createStripeClient(stripeKeySecret.value());
    // If already exists and not expired
    if (existing && !(await stripeClient.isProviderSessionExpired(existing.billing.checkoutSessionId))) {
      return existing.billing.checkoutSessionUrl;
    }

    const newDraftRef = db.collection('orders').doc().withConverter(adminFirestoreNewDraftOrderConverter);
    // Ref to existing or new draft
    const draftOrderRef = existingRef || newDraftRef;

    // Get existing or create new not persisted draft
    const order = existing
      ? existing
      : await cartToOrder<NewDraftOrder>(
          new BoxtalClient(env.BOXTAL_API_URL, boxtalUserSecret.value(), boxtalPassSecret.value(), {
            ENABLE_VAT_PASS_THROUGH: env.ENABLE_VAT_PASS_THROUGH,
          }),
          cart,
          userId,
          payload.giftCards,
          {
            ...payload.billing,
            checkoutSessionId: 'IS_SET_LATER',
            checkoutSessionUrl: 'IS_SET_LATER',
          },
          payload.shipping,
          payload.extras,
          promotionCode,
          'draft'
        );

    // Prepare items to bill for stripe
    const itemsToBill = orderItemsToBillingOrderItems(order.items, order.giftOffered);

    itemsToBill.push({
      label: 'Frais de port',
      price: Math.round(order.shipping.price.originalTaxIncluded * 100),
      quantity: 1,
      quantity_unit: '',
    });

    if (payload.extras.reduceManufacturingTimes) {
      itemsToBill.push({
        label: 'Supplément commande urgente',
        price: Math.round(15 * 100),
        quantity: 1,
        quantity_unit: '',
      });
    }

    // Create new provider session
    const providerSession = await stripeClient.createProviderSession(
      draftOrderRef.id,
      userEmail,
      itemsToBill,
      new URL(routes().cart().confirm(draftOrderRef.id), env.FRONTEND_BASE_URL).toString(),
      calcOrderTotalDiscount(order.items, order.shipping.price),
      order.billing.amountPaidWithGiftCards * 100
    );

    if (!existingRef) {
      // Save new draft
      order.billing.checkoutSessionId = providerSession.sessionId;
      order.billing.checkoutSessionUrl = providerSession.public_id;
      await saveOrderAndLinkToCart(cartRef, newDraftRef, order as NewDraftOrder);
    } else {
      // Update existing draft
      await draftOrderRef.set(
        {
          billing: {
            checkoutSessionId: providerSession.sessionId,
            checkoutSessionUrl: providerSession.public_id,
          },
        },
        { merge: true }
      );
    }

    return providerSession.public_id;
  }
);

function orderItemsToBillingOrderItems(items: OrderItem[], appendGift: boolean): BillingOrderItem[] {
  const r: BillingOrderItem[] = items.map((item) => ({
    label: item.description,
    image: firebaseServerImageLoader()({ src: item.image.url, width: 256 }),
    price: Math.round(item.originalPerUnitTaxIncluded * 100),
    quantity: item.quantity,
    quantity_unit: '',
  }));
  if (appendGift) {
    r.push({
      label: 'Cadeau',
      price: 0,
      quantity: 1,
      quantity_unit: '',
    });
  }
  return r;
}

function calcOrderTotalDiscount(items: OrderItem[], shippingPrice: Order['shipping']['price']): number {
  return Math.round(
    items.reduce((acc, item) => acc + (item.originalTotalTaxIncluded - item.totalTaxIncluded), 0) * 100 +
      (shippingPrice.originalTaxIncluded - shippingPrice.taxIncluded) * 100
  );
}
