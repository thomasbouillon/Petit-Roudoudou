import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import type {
  Article,
  Cart,
  CheckoutSession,
  Fabric,
  Order,
  OrderItem,
  PaidCheckoutSession,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';

// Careful, do not update payment, this would create an infinite loop
export const onCheckoutSessionsUpdated = onDocumentUpdated(
  'checkoutSessions/{docId}',
  async (event) => {
    const snapshotBefore = event.data?.before;
    const prevData = snapshotBefore?.data() as CheckoutSession;
    const snapshotAfter = event.data?.after;
    const nextData = snapshotAfter?.data() as CheckoutSession;

    if (!snapshotAfter || (prevData === undefined && nextData === undefined)) {
      console.warn('No data associated with the event');
      return;
    }

    const prevStatus = prevData?.type;
    const nextStatus = nextData?.type;

    if (prevStatus !== nextStatus && nextStatus === 'paid') {
      console.info('Payment confirmed, creating order');
      const db = getFirestore();

      const cart = await db
        .doc(`carts/${snapshotAfter.id}`)
        .get()
        .then((doc) => {
          if (!doc.exists) throw new Error('Cart not found');
          return doc.data() as Cart;
        });

      const order = await cartToOrder(cart, nextData, snapshotAfter.id);

      db.runTransaction(async (transaction) => {
        const orderRef = db.collection('orders').doc();
        await Promise.all([
          transaction.set(orderRef, order),
          transaction.delete(db.doc(`carts/${snapshotAfter.id}`)),
          transaction.delete(snapshotAfter.ref),
        ]);
        return;
      });
    } else {
      console.info('No status change, nothing to do');
    }
  }
);

async function cartToOrder(
  cart: Cart,
  checkoutSession: PaidCheckoutSession,
  userId: string
): Promise<Order> {
  const db = getFirestore();

  const allArticles = await Promise.all(
    cart.items.map(async (cartItem) => {
      const articleSnapshot = await db
        .doc(`articles/${cartItem.articleId}`)
        .withConverter(adminFirestoreConverterAddRemoveId<Article>())
        .get();
      if (!articleSnapshot.exists) throw new Error('Article not found');
      return articleSnapshot.data()!;
    })
  );

  const fabrics = await prefetchChosenFabrics(cart, allArticles);

  return {
    totalTaxExcluded: cart.totalTaxExcluded,
    totalTaxIncluded: cart.totalTaxIncluded,
    taxes: cart.taxes,
    items: cart.items.map((cartItem) => ({
      description: cartItem.description,
      image: cartItem.image,
      taxes: cartItem.taxes,
      totalTaxExcluded: cartItem.totalTaxExcluded,
      totalTaxIncluded: cartItem.totalTaxIncluded,
      customizations: Object.entries(cartItem.customizations).map(
        ([customzableId, unknown]) => {
          const article = allArticles.find(
            (article) => article._id === cartItem.articleId
          );
          if (!article) throw new Error('Article not found');
          const customzable = article.customizables.find(
            (customizable) => customizable.uid === customzableId
          );
          if (!customzable) throw new Error('Customizable not found');

          if (customzable.type !== 'customizable-part')
            throw new Error('Not handled yet');

          const fabric = fabrics[unknown as string];
          if (!fabric) throw new Error('Fabric not found');

          return {
            title: customzable.label,
            value: fabric.name,
          } satisfies OrderItem['customizations'][0];
        }
      ),
    })),
    user: {
      uid: userId,
      firstName: '',
      lastName: '',
    },
    billing: {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      zip: '',
      country: '',
      paymentRef: checkoutSession.sessionId,
    },
    shipping: {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      zip: '',
      country: '',
      method: 'colissimo',
    },
  };
}

async function prefetchChosenFabrics(
  cart: Cart,
  allArticles: Article[]
): Promise<Record<string, Fabric>> {
  const db = getFirestore();

  const chosenFabricIds = cart.items.reduce((acc, cartItem) => {
    const article = allArticles.find(
      (article) => article._id === cartItem.articleId
    );
    if (!article) throw new Error('Article not found');
    Object.entries(cartItem.customizations).forEach(
      ([customizableId, value]) => {
        const customizable = article.customizables.find(
          (customizable) => customizable.uid === customizableId
        );
        if (!customizable) throw new Error('Customizable not found');
        if (customizable.type === 'customizable-part') {
          acc.add(value as string);
        }
      }
    );
    return acc;
  }, new Set<string>());

  const fabrics = await Promise.all(
    Array.from(chosenFabricIds).map(async (fabricId) => {
      const fabricSnapshot = await db
        .doc(`fabrics/${fabricId}`)
        .withConverter(adminFirestoreConverterAddRemoveId<Fabric>())
        .get();
      if (!fabricSnapshot.exists) throw new Error('Fabric not found');
      return fabricSnapshot.data()!;
    })
  );

  return fabrics.reduce((acc, fabric) => {
    acc[fabric._id] = fabric;
    return acc;
  }, {} as Record<string, Fabric>);
}
