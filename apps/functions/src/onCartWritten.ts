import { Article, Cart, CartItem, CartItemCustomizations, CartMetadata, Taxes } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { deleteImageWithSizeVariants } from './utils';
import { getFirestore } from 'firebase-admin/firestore';
import { getTaxes } from '@couture-next/utils';
import { trpc } from './trpc';

export const onCartWritten = onDocumentWritten('carts/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Cart, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Cart, '_id'> | undefined;

  const toSet: Partial<Cart> = {};

  // ---- keep articleIds in sync with items ----
  const nextArticleIds = nextData?.items.map((item) => item.articleId).filter((id): id is string => id !== undefined);
  const prevArticleIds = prevData?.items.map((item) => item.articleId).filter((id): id is string => id !== undefined);

  const deletedArticleIds = prevArticleIds?.filter((id) => !nextArticleIds?.includes(id));
  const addedArticleIds = nextArticleIds?.filter((id) => !prevArticleIds?.includes(id));
  if (nextData && nextArticleIds !== undefined && (deletedArticleIds?.length || addedArticleIds?.length)) {
    nextData.articleIds = nextArticleIds;
    toSet.articleIds = nextArticleIds;
  }
  // ---- END keep articleIds in sync with items ----

  // ---- Update price & weight ----
  const prevDataHash = prevData ? cartContentHash(prevData) : undefined;
  const nextDataHash = nextData ? cartContentHash(nextData) : undefined;
  if (nextData !== undefined && prevDataHash !== nextDataHash) {
    await calcAndSetCartPriceWithoutPersistence(nextData!);
    toSet.totalTaxExcluded = nextData!.totalTaxExcluded;
    toSet.totalTaxIncluded = nextData!.totalTaxIncluded;
    toSet.taxes = nextData!.taxes;
    toSet.totalWeight = nextData!.totalWeight;
    toSet.items = nextData!.items;
  }
  // ---- END Update price & weight ----

  // ---- Update cart & metadata ----
  if (Object.keys(toSet).length > 0) {
    // Update cart
    const firestore = getFirestore();
    if (snapshotAfter)
      await Promise.all([
        snapshotAfter.ref.set(toSet, { merge: true }),
        firestore
          .collection('carts-metadata')
          .doc(snapshotAfter.id)
          .set({ updatedAt: Date.now() } satisfies Partial<CartMetadata>, { merge: true }),
      ]);
  } else if (!snapshotBefore && snapshotAfter) {
    // New cart, set metadata
    const firestore = getFirestore();
    await firestore
      .collection('carts-metadata')
      .doc(snapshotAfter.id)
      .set({ updatedAt: Date.now() } satisfies Partial<CartMetadata>);
  }
  // ---- Update cart & metadata ----

  // ---- Deleted cart, cascade to cart metadata ----
  if (snapshotBefore && !snapshotAfter) {
    const firestore = getFirestore();
    await firestore.collection('carts-metadata').doc(snapshotBefore.id).delete();
    console.debug('Cascading delete to metadata', snapshotBefore.id);
  }
  // ---- END Deleted cart, cascade to cart metadata ----

  // ---- IMAGES ----
  const nextImages = nextData?.items.map((item) => item.image.uid);
  const prevImages = prevData?.items.map((item) => item.image.uid);

  const deletedImages = prevImages?.filter((image) => !nextImages?.includes(image));

  if (deletedImages && deletedImages.length > 0) {
    await Promise.all([deletedImages.map((image) => deleteImageWithSizeVariants(image))]);
  }
  // ---- END IMAGES ----
});

async function calcAndSetCartPriceWithoutPersistence(cart: Cart) {
  cart.totalTaxExcluded = 0;
  cart.taxes = {};

  const articles = await Promise.all(cart.articleIds.map((articleId) => trpc.articles.findById.query(articleId)));

  cart.items.forEach((item) => {
    if (item.type !== 'giftCard') {
      // instock or customized
      const article = articles.find((article) => article.id === item.articleId) as Article | undefined;
      if (!article) throw new Error(`Article ${item.articleId} not found`);
      const sku = article.skus.find((sku) => sku.uid === item.skuId);
      if (!sku) throw new Error(`SKU ${item.skuId} not found`);

      const itemPrice = calcCartItemPrice(item, sku, item.quantity, article.customizables);
      Object.assign(item, itemPrice satisfies Partial<CartItem>);
    } else {
      // gift card
      Object.assign(item, {
        perUnitTaxExcluded: item.amount * item.quantity,
        perUnitTaxIncluded: item.amount * item.quantity,
        totalTaxExcluded: item.amount * item.quantity,
        totalTaxIncluded: item.amount * item.quantity,
        taxes: {},
      } satisfies Partial<CartItem>);
    }

    // Append item price
    cart.totalTaxExcluded += item.totalTaxExcluded;

    // Apply taxes
    Object.entries(item.taxes).forEach(([tax, taxValue]) => {
      if (!cart.taxes[tax]) cart.taxes[tax] = 0;
      cart.taxes[tax] += taxValue;
    });
  });

  // round taxes
  Object.entries(cart.taxes).forEach(([tax, taxValue]) => {
    cart.taxes[tax] = roundToTwoDecimals(taxValue);
  });

  // calculate total tax included
  cart.totalTaxIncluded = cart.totalTaxExcluded + Object.values(cart.taxes).reduce((acc, tax) => acc + tax, 0);

  // Total weight
  cart.totalWeight = Math.round(cart.items.reduce((acc, item) => acc + item.totalWeight, 0));

  // round rest
  cart.totalTaxExcluded = roundToTwoDecimals(cart.totalTaxExcluded);
  cart.totalTaxIncluded = roundToTwoDecimals(cart.totalTaxIncluded);
}

function calcCartItemPrice(
  cartItem: CartItem,
  sku: Article['skus'][0],
  quantity: number,
  articleCustomizables: Article['customizables']
) {
  let itemPriceTaxExcluded = sku.price;
  articleCustomizables.forEach((customizable) => {
    if (
      customizable.type === 'customizable-part' ||
      cartItem.type === 'giftCard' ||
      !(customizable.uid in cartItem.customizations)
    )
      return;
    if (customizable.price && cartItem.customizations?.[customizable.uid].value)
      itemPriceTaxExcluded += customizable.price;
  });

  const vat = getTaxes(itemPriceTaxExcluded);
  return {
    totalTaxExcluded: itemPriceTaxExcluded * quantity,
    totalTaxIncluded: (itemPriceTaxExcluded + vat) * quantity,
    perUnitTaxExcluded: itemPriceTaxExcluded,
    perUnitTaxIncluded: itemPriceTaxExcluded + vat,
    taxes: {
      [Taxes.VAT_20]: vat * quantity,
    },
  };
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function cartContentHash(cart: Cart) {
  return cart.items
    .map(
      (item) =>
        `${item.type === 'giftCard' ? item.amount : item.articleId}-${item.type === 'inStock' ? item.stockUid : '#'}_${
          item.quantity
        }_${item.type !== 'giftCard' ? cartItemCustomizationsHash(item.customizations) : '#'}`
    )
    .join(';');
}

function cartItemCustomizationsHash(customizations: CartItemCustomizations) {
  return Object.entries(customizations ?? {})
    .map(
      ([customizableUid, value]) =>
        `${customizableUid}(${value.type}):${Buffer.from(value.value.toString()).toString('base64')}`
    )
    .join('/');
}
