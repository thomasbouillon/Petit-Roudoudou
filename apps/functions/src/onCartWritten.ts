import { Article, Cart, CartItem, Taxes } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { deleteImageWithSizeVariants } from './utils';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { adminFirestoreConverterAddRemoveId } from '@couture-next/utils';

export const onCartWritten = onDocumentWritten('carts/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Cart, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Cart, '_id'> | undefined;

  // ---- keep articleIds in sync with items ----
  const nextArticleIds = nextData?.items.map((item) => item.articleId);
  const prevArticleIds = prevData?.items.map((item) => item.articleId);

  const deletedArticleIds = prevArticleIds?.filter((id) => !nextArticleIds?.includes(id));
  const addedArticleIds = nextArticleIds?.filter((id) => !prevArticleIds?.includes(id));
  if (nextData && nextArticleIds !== undefined && (deletedArticleIds?.length || addedArticleIds?.length)) {
    nextData.articleIds = nextArticleIds;
    snapshotAfter?.ref.set({ articleIds: nextArticleIds }, { merge: true });
  }
  // ---- END keep articleIds in sync with items ----

  // ---- Update price & weight ----
  const prevDataHash = prevData ? cartContentHash(prevData) : undefined;
  const nextDataHash = nextData ? cartContentHash(nextData) : undefined;
  console.log('prevDataHash', prevDataHash);
  console.log('nextDataHash', nextDataHash);
  if (prevDataHash !== nextDataHash) {
    await calcAndSetCartPriceWithoutPersistence(nextData!);
    await snapshotAfter?.ref.set(
      {
        items: nextData!.items,
        totalTaxExcluded: nextData!.totalTaxExcluded,
        totalTaxIncluded: nextData!.totalTaxIncluded,
        taxes: nextData!.taxes,
        totalWeight: nextData!.totalWeight,
      } satisfies Partial<Cart>,
      { merge: true }
    );
  }
  // ---- END Update price & weight ----

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

  const firestore = getFirestore();
  const articles =
    cart.articleIds.length > 0
      ? await firestore
          .collection('articles')
          .withConverter(adminFirestoreConverterAddRemoveId<Article>())
          .where(FieldPath.documentId(), 'in', cart.articleIds)
          .get()
      : { docs: [] };

  cart.items.forEach((item) => {
    const article = articles.docs.find((article) => article.id === item.articleId)?.data();
    if (!article) throw new Error(`Article ${item.articleId} not found`);
    const sku = article.skus.find((sku) => sku.uid === item.skuId);
    if (!sku) throw new Error(`SKU ${item.skuId} not found`);

    const itemPrice = calcCartItemPrice(item, sku, item.quantity, article.customizables);
    Object.assign(item, itemPrice satisfies Partial<CartItem>);

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
    if (customizable.type === 'customizable-part') return;
    if (customizable.price && cartItem.customizations?.[customizable.uid]) itemPriceTaxExcluded += customizable.price;
  });

  const vat = roundToTwoDecimals(itemPriceTaxExcluded * 0.2);
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
        `${item.articleId}-${item.stockUid ?? '#'}_${item.quantity}_${
          cartItemCustomizationsHash(item.customizations) || '#'
        }`
    )
    .join(';');
}

function cartItemCustomizationsHash(customizations: CartItem['customizations']) {
  return Object.entries(customizations ?? {})
    .map(
      ([customizableUid, value]) =>
        `${customizableUid}(${value.type}):${Buffer.from(value.value.toString()).toString('base64')}`
    )
    .join('/');
}
