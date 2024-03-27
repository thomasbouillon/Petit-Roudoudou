import { onCall } from 'firebase-functions/v2/https';
import {
  type Article,
  type Cart,
  type FabricGroup,
  CallEditCartMutationPayload,
  CallEditCartMutationResponse,
  CartItem,
  BillingClient,
  Order,
  NewCustomizedCartItem,
  NewInStockCartItem,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { uuidv4 } from '@firebase/util';
import { defineSecret } from 'firebase-functions/params';
import { createStripeClient } from '@couture-next/billing';
import { adminFirestoreOrderConverter } from '@couture-next/utils';
import { getPublicUrl } from './utils';
import * as z from 'zod';
import { getPlaiceholder } from './vendor/plaiceholder';
import { getClient } from './brevoEvents';

const stripeKeySecret = defineSecret('STRIPE_SECRET_KEY');
const crmSecret = defineSecret('CRM_SECRET');

export const callEditCart = onCall<unknown, Promise<CallEditCartMutationResponse>>(
  { cors: '*', secrets: [stripeKeySecret, crmSecret] },
  async (event) => {
    const userId = event.auth?.uid;
    if (!userId) throw new Error('No user id provided');

    const db = getFirestore();

    const cart = await getCartAndCancelDraftOrderIfExists(db, createStripeClient(stripeKeySecret.value()), userId);

    const eventPayload = parseEventData(event.data) satisfies CallEditCartMutationPayload;

    const article = await db
      .collection('articles')
      .doc('articleId' in eventPayload ? eventPayload.articleId : cart.items[eventPayload.index].articleId)
      .get()
      .then((snapshot) => {
        if (!snapshot.exists) throw new Error('Article does not exist');
        return snapshot.data() as Article;
      });

    if (eventPayload.type === 'change-item-quantity') {
      const item = cart.items[eventPayload.index];
      if (item.stockUid) {
        const stock = article.stocks.find((stock) => stock.uid === item.stockUid);
        if (!stock) throw 'Impossible (ERR8)';
        const quantityInCartAfterEdit = cart.items.reduce((acc, item, i) => {
          if (item.stockUid === stock.uid)
            return acc + (i === eventPayload.index ? eventPayload.newQuantity : item.quantity);
          return acc;
        }, 0);
        if (quantityInCartAfterEdit > stock.stock) throw new Error('Not enough stock');
      }

      if (eventPayload.newQuantity <= 0) {
        cart.items.splice(eventPayload.index, 1);
      } else {
        cart.items[eventPayload.index].quantity = eventPayload.newQuantity;
      }
    } else if (eventPayload.type === 'add-customized-item') {
      validateCartItemExceptFabricsAgainstArticle(eventPayload, article);
      validateCartItemChosenFabrics(eventPayload, article);
      const formattedCustomizations = formatCartItemCustomizations(eventPayload.customizations, article);

      const image = await imageFromDataUrl(eventPayload.imageDataUrl, uuidv4() + '.png', userId);

      // Get Price
      const newItemSku = article.skus.find((sku) => sku.uid === eventPayload.skuId);
      if (!newItemSku) throw 'Impossible (ERR1)';

      cart.items.push({
        type: 'customized',
        articleId: eventPayload.articleId,
        skuId: eventPayload.skuId,
        customizations: formattedCustomizations,
        totalWeight: newItemSku.weight * eventPayload.quantity,
        quantity: eventPayload.quantity,
        image,
        description: getSkuLabel(eventPayload.skuId, article),
        perUnitTaxExcluded: -1,
        perUnitTaxIncluded: -1,
        totalTaxExcluded: -1,
        totalTaxIncluded: -1,
        taxes: {},
      });
    } else if (eventPayload.type === 'add-in-stock-item') {
      const stockConfig = article.stocks.find((stock) => stock.uid === eventPayload.stockUid);
      if (!stockConfig) throw 'Impossible (ERR2)';

      const availableQuantity = stockConfig.stock;
      if (availableQuantity <= 0) throw new Error('Stock is empty');

      const newItemSku = article.skus.find((sku) => sku.uid === stockConfig.sku);
      if (!newItemSku) throw 'Impossible (ERR3)';
      const formattedCustomizations = formatCartItemCustomizations(eventPayload.customizations, article);

      const image = await createItemImageFromArticleStockImage(stockConfig.images[0], userId);
      cart.items.push({
        type: 'inStock',
        stockUid: eventPayload.stockUid,
        articleId: eventPayload.articleId,
        customizations: formattedCustomizations,
        skuId: stockConfig.sku,
        totalWeight: newItemSku.weight * 1,
        quantity: 1,
        image,
        description: getSkuLabel(stockConfig.sku, article),
        perUnitTaxExcluded: -1,
        perUnitTaxIncluded: -1,
        totalTaxExcluded: -1,
        totalTaxIncluded: -1,
        taxes: {},
      });
    }

    await db.runTransaction(async (transaction) => {
      const toDelete = cart.draftOrderId;
      if (toDelete) {
        transaction.delete(db.collection('orders').doc(toDelete));
      }
      if (cart.items.every((item) => item.totalTaxExcluded === -1)) {
        cart.totalTaxExcluded = -1;
        cart.totalTaxIncluded = -1;
      }
      transaction.set(db.collection('carts').doc(userId), cart);
    });

    const userEmail = event.auth?.token.email;
    if (userEmail) {
      // Notify CRM
      const crmClient = getClient(crmSecret.value());
      await crmClient.sendEvent('cartUpdated', userEmail, {}).catch((e) => {
        console.error('Error while sending event cartUpdated to CRM', e);
      });
    }
  }
);

async function getCartAndCancelDraftOrderIfExists(
  db: FirebaseFirestore.Firestore,
  billingClient: BillingClient,
  userId: string
) {
  const cart = await db
    .collection('carts')
    .doc(userId)
    .get()
    .then<Cart>((snapshot) => {
      if (snapshot.exists) return snapshot.data() as Cart;
      return {
        items: [],
        articleIds: [],
        taxes: {},
        totalTaxExcluded: 0,
        totalTaxIncluded: 0,
        totalWeight: 0,
        userId,
      };
    });

  if (cart.draftOrderId)
    await db
      .collection('orders')
      .doc(cart.draftOrderId)
      .withConverter(adminFirestoreOrderConverter)
      .get()
      .then(async (snapshot) => {
        delete cart.draftOrderId;
        if (!snapshot.exists) return;
        const related = snapshot.data() as Order;
        if (!related) return;
        if (related.status !== 'draft') throw new Error('Related order is not a draft');
        await billingClient.cancelProviderSession(related.billing.checkoutSessionId);
      });

  return cart;
}

function parseEventData(data: unknown): CallEditCartMutationPayload {
  const schema = z.union([
    z.object({
      type: z.literal('add-customized-item'),
      articleId: z.string(),
      skuId: z.string(),
      customizations: z.record(z.unknown()),
      imageDataUrl: z.string(),
      quantity: z.number().int().min(1),
    }),
    z.object({
      type: z.literal('add-in-stock-item'),
      articleId: z.string(),
      stockUid: z.string(),
      customizations: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('change-item-quantity'),
      index: z.number(),
      newQuantity: z.number().int().min(0),
    }),
  ]);
  return schema.parse(data) satisfies CallEditCartMutationPayload;
}

function formatCartItemCustomizations(
  itemCustomizations: (NewCustomizedCartItem | NewInStockCartItem)['customizations'],
  article: Article
): CartItem['customizations'] {
  return Object.entries(itemCustomizations).reduce((acc, [customizationId, value]) => {
    const customizable = article.customizables.find((customizable) => customizable.uid === customizationId);
    if (!customizable) throw 'Impossible (ERR7)';

    acc[customizable.uid] = {
      title: customizable.label,
      value: ['customizable-part', 'customizable-text'].includes(customizable.type)
        ? z.string().parse(value)
        : z.boolean().parse(value),
      type: (customizable.type === 'customizable-part'
        ? 'fabric'
        : customizable.type === 'customizable-boolean'
        ? 'boolean'
        : 'text') as 'text' | 'boolean',
    };
    return acc;
  }, {} as CartItem['customizations']);
}

async function imageFromDataUrl(dataUrl: string, filename: string, subfolder: string): Promise<CartItem['image']> {
  const storage = getStorage();
  const bucket = storage.bucket();
  const path = `carts/${subfolder}/${filename}`;
  const file = bucket.file(path);
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  await file.save(buffer, { contentType: 'image/png' });
  return {
    url: getPublicUrl(path),
    uid: path,
    placeholderDataUrl: (await getPlaiceholder(buffer)).base64,
  };
}

async function createItemImageFromArticleStockImage(
  stockImage: Article['stocks'][0]['images'][0],
  subfolder: string
): Promise<CartItem['image']> {
  const storage = getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(stockImage.uid);
  const path = `carts/${subfolder}/${uuidv4()}.png`;
  await file.copy(path);
  return {
    url: getPublicUrl(path),
    uid: path,
    placeholderDataUrl: stockImage.placeholderDataUrl,
  };
}

function getSkuLabel(skuId: string, article: Article) {
  const sku = article.skus.find((sku) => sku.uid === skuId);
  if (!sku) throw 'Impossible (ERR4)';
  const skuDesc = Object.entries(sku?.characteristics)
    .map(([characId, valueId]) => article.characteristics[characId].values[valueId])
    .join(' - ');
  if (!skuDesc) return article.name;
  return `${article.name} - ${skuDesc}`;
}

function validateCartItemExceptFabricsAgainstArticle(item: NewCustomizedCartItem, article: Article): void {
  // validate SKU
  const sku = article.skus.find((sku) => sku.uid === item.skuId);
  if (!sku) throw new Error('Sku does not exist');
  if (!sku.enabled) throw new Error('Sku is not enabled');

  // validate customizations
  const customizations = {} as NewCustomizedCartItem['customizations'];
  article.customizables.forEach((customizable) => {
    if (!(customizable.uid in item.customizations)) throw new Error(`Customization ${customizable.uid} is missing`);
    const value = item.customizations[customizable.uid];

    if (customizable.type === 'customizable-part') {
      if (typeof value !== 'string') throw new Error(`Customization ${customizable.uid} value is not a string`);
    } else if (customizable.type === 'customizable-text') {
      if (typeof value !== 'string') throw new Error(`Customization ${customizable.uid} value is not not a string`);
      if ((value.length > 0 && value.length < customizable.min) || value.length > customizable.max) {
        throw new Error(`Customization ${customizable.uid} value is not in the specified range`);
      }
    } else if (customizable.type === 'customizable-boolean') {
      if (typeof value !== 'boolean') throw new Error(`Customization ${customizable.uid} value is not not a boolean`);
    } else {
      throw new Error('Impossible (ERR6)');
    }
    customizations[customizable.uid] = value;
  });

  item.customizations = customizations;
}

async function validateCartItemChosenFabrics(item: NewCustomizedCartItem, article: Article) {
  const articleFabricGroupIds = [
    ...new Set(
      article.customizables
        .filter((customizable) => customizable.type === 'customizable-part')
        .map((customizable) => customizable?.fabricListId)
    ),
  ].filter((listId) => listId !== undefined) as string[];

  const selectedFabricIdsByFabricGroupId = article.customizables.reduce((acc, customizable) => {
    if (customizable.type !== 'customizable-part') return acc;
    const selectedFabricId = item.customizations[customizable.uid];
    if (!selectedFabricId || typeof selectedFabricId !== 'string') throw 'Impossible (ERR5)';
    if (!acc[customizable.fabricListId]) acc[customizable.fabricListId] = [];
    acc[customizable.fabricListId].push(selectedFabricId);
    return acc;
  }, {} as Record<string, string[]>);

  const fetchFabricGroupSnapshotPromises = articleFabricGroupIds.map(
    async (fabricGroupId) => await getFirestore().collection('fabricGroups').doc(fabricGroupId).get()
  );

  // check that all fabric groups exist and that all selected fabrics are present in the fabric group
  await Promise.all(fetchFabricGroupSnapshotPromises).then((snapshots) => {
    snapshots.forEach((snapshot) => {
      if (!snapshot.exists) throw new Error('Fabric group does not exist');
      const fabricGroup = snapshot.data() as FabricGroup;
      const allFabricsAreValid = selectedFabricIdsByFabricGroupId[snapshot.id].every((selectedFabricId) =>
        fabricGroup.fabricIds.includes(selectedFabricId)
      );
      if (!allFabricsAreValid) throw new Error('One of the fabric ids in not present in specified fabric group');
    });
  });
}
