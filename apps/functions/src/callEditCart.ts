import { onCall } from 'firebase-functions/v2/https';
import {
  Taxes,
  type Article,
  type Cart,
  type NewCartItem,
  type FabricGroup,
  CallAddToCartMutationResponse,
  CallAddToCartMutationPayload,
  CartItem,
} from '@couture-next/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import env from './env';
import { uuidv4 } from '@firebase/util';

export const callEditCart = onCall<unknown, CallAddToCartMutationResponse>(
  { cors: env.CORS_FRONTEND_URL },
  async (event) => {
    const userId = event.auth?.uid;
    if (!userId) throw new Error('No user id provided');

    const db = getFirestore();

    let cart = await db
      .collection('carts')
      .doc(userId)
      .get()
      .then<Cart>((snapshot) => {
        if (snapshot.exists) return snapshot.data() as Cart;
        return {
          items: [],
          taxes: {},
          totalTaxExcluded: 0,
          totalTaxIncluded: 0,
          userId,
        };
      });

    const item = parseEventDataIntoCartItem(
      event.data
    ) satisfies CallAddToCartMutationPayload;

    const article = await db
      .collection('articles')
      .doc(item.articleId)
      .get()
      .then((snapshot) => {
        if (!snapshot.exists) throw new Error('Article does not exist');
        return snapshot.data() as Article;
      });

    validateCartItemExceptFabricsAgainstArticle(item, article);

    validateCartItemChosenFabrics(item, article);

    const image = await imageFromDataUrl(
      item.imageDataUrl,
      `${userId}-${uuidv4()}`
    );

    cart.items.push({
      articleId: item.articleId,
      skuId: item.skuId,
      customizations: item.customizations,
      image,
      description: getSkuLabel(item.skuId, article),
    });

    calcAndSetCartPrice(cart, article.skus);

    await db.collection('carts').doc(userId).set(cart);
  }
);

function parseEventDataIntoCartItem(data: unknown): NewCartItem {
  if (!data) throw new Error('No data provided');
  if (typeof data !== 'object') throw new Error('Data is not an object');
  const dataAsObject = data as Record<string, unknown>;
  if (typeof dataAsObject.articleId !== 'string')
    throw new Error('Article id is not a string');
  if (typeof dataAsObject.skuId !== 'string')
    throw new Error('Sku id is not a string');
  if (typeof dataAsObject.customizations !== 'object')
    throw new Error('Customizations is not an object');
  if (typeof dataAsObject.imageDataUrl !== 'string')
    throw new Error('imageDataUrl is not a string');

  const customizationsAsObject = dataAsObject.customizations as Record<
    string,
    unknown
  >;
  return {
    articleId: dataAsObject.articleId,
    skuId: dataAsObject.skuId,
    customizations: customizationsAsObject,
    imageDataUrl: dataAsObject.imageDataUrl,
  };
}

async function imageFromDataUrl(
  dataUrl: string,
  filename: string
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(`cart-items/${filename}`);
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  await file.save(buffer, { contentType: 'image/png' });
  return await getDownloadURL(file);
}

function getSkuLabel(skuId: string, article: Article) {
  const sku = article.skus.find((sku) => sku.uid === skuId);
  if (!sku) throw 'Impossible';
  const skuDesc = Object.entries(sku?.characteristics)
    .map(
      ([characId, valueId]) => article.characteristics[characId].values[valueId]
    )
    .join(' - ');
  if (!skuDesc) return article.name;
  return `${article.name} - ${skuDesc}`;
}

function validateCartItemExceptFabricsAgainstArticle(
  item: NewCartItem,
  article: Article
): void {
  // validate SKU
  const sku = article.skus.find((sku) => sku.uid === item.skuId);
  if (!sku) throw new Error('Sku does not exist');
  if (!sku.enabled) throw new Error('Sku is not enabled');

  // validate customizations
  const customizations = {} as NewCartItem['customizations'];
  article.customizables.forEach((customizable) => {
    if (!(customizable.uid in item.customizations))
      throw new Error(`Customization ${customizable.uid} is missing`);
    const value = item.customizations[customizable.uid];

    if (customizable.type === 'customizable-part') {
      if (typeof value !== 'string')
        throw new Error(
          `Customization ${customizable.uid} value is not a string`
        );
      customizations[customizable.uid] = value;
    } else {
      throw new Error(
        `Customization ${customizable.uid} type is not supported yet`
      );
    }
  });

  item.customizations = customizations;
}

async function validateCartItemChosenFabrics(
  item: NewCartItem,
  article: Article
) {
  const articleFabricGroupIds = [
    ...new Set(
      article.customizables
        .filter((customizable) => customizable.type === 'customizable-part')
        .map((customizable) => customizable.fabricListId)
    ),
  ];

  const selectedFabricIdsByFabricGroupId = article.customizables.reduce(
    (acc, customizable) => {
      if (customizable.type !== 'customizable-part') return acc;
      const selectedFabricId = item.customizations[customizable.uid];
      if (!selectedFabricId || typeof selectedFabricId !== 'string')
        throw 'Impossible';
      if (!acc[customizable.fabricListId]) acc[customizable.fabricListId] = [];
      acc[customizable.fabricListId].push(selectedFabricId);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const fetchFabricGroupSnapshotPromises = articleFabricGroupIds.map(
    async (fabricGroupId) =>
      await getFirestore().collection('fabricGroups').doc(fabricGroupId).get()
  );

  // check that all fabric groups exist and that all selected fabrics are present in the fabric group
  await Promise.all(fetchFabricGroupSnapshotPromises).then((snapshots) => {
    snapshots.forEach((snapshot) => {
      if (!snapshot.exists) throw new Error('Fabric group does not exist');
      const fabricGroup = snapshot.data() as FabricGroup;
      const allFabricsAreValid = selectedFabricIdsByFabricGroupId[
        snapshot.id
      ].every((selectedFabricId) =>
        fabricGroup.fabricIds.includes(selectedFabricId)
      );
      if (!allFabricsAreValid)
        throw new Error(
          'One of the fabric ids in not present in specified fabric group'
        );
    });
  });
}

function calcAndSetCartPrice(cart: Cart, skus: Article['skus']) {
  cart.totalTaxExcluded = 0;
  cart.items.forEach((item) => {
    const sku = skus.find((sku) => sku.uid === item.skuId);
    if (!sku) throw new Error('Impossible');
    // Calculate item price
    const itemTotal = calcCartItemPrice(item, sku);
    cart.totalTaxExcluded += itemTotal.totalTaxExcluded;
    // Apply taxes
    Object.entries(itemTotal.taxes).forEach(([tax, taxValue]) => {
      if (!cart.taxes[tax]) cart.taxes[tax] = 0;
      cart.taxes[tax] += taxValue;
    });
  });

  // round taxes
  Object.entries(cart.taxes).forEach(([tax, taxValue]) => {
    cart.taxes[tax] = roundToTwoDecimals(taxValue);
  });

  // calculate total tax included
  cart.totalTaxIncluded =
    cart.totalTaxExcluded +
    Object.values(cart.taxes).reduce((acc, tax) => acc + tax, 0);

  // round rest
  cart.totalTaxExcluded = roundToTwoDecimals(cart.totalTaxExcluded);
  cart.totalTaxIncluded = roundToTwoDecimals(cart.totalTaxIncluded);
}

function calcCartItemPrice(_: CartItem, sku: Article['skus'][0]) {
  // TODO future me, do not forget to add customizations prices and quantities
  return {
    totalTaxExcluded: sku.price,
    taxes: {
      [Taxes.VAT_20]: sku.price * 0.2,
    },
  };
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
