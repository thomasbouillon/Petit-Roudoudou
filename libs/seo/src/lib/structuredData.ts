import { applyTaxes, firebaseServerImageLoader as loader } from '@couture-next/utils';
import { Organization, Product, ProductGroup, UserReview } from 'schema-dts';
import { Review } from '@prisma/client';
import { Article } from '@couture-next/types';

export function customizableArticle(article: Article, cdnBaseUrl: string): ProductGroup {
  let minWeight = 0;
  let maxWeight = 0;
  let lowestPrice = 0;
  let highestPrice = 0;
  article.skus.forEach((sku) => {
    if (sku.weight < minWeight) {
      minWeight = sku.weight;
    }
    if (sku.weight > maxWeight) {
      maxWeight = sku.weight;
    }
    if (sku.price < lowestPrice) {
      lowestPrice = sku.price;
    }
    if (sku.price > highestPrice) {
      highestPrice = sku.price;
    }
  });

  return {
    '@type': 'ProductGroup',
    '@id': article.id,
    productGroupID: article.id,
    name: article.name,
    description: article.seo.description,
    image: loader({ cdnBaseUrl })({
      src: article.images[0].url,
      width: 512,
    }),
    countryOfAssembly: 'FR',
    countryOfLastProcessing: 'FR',
    countryOfOrigin: 'FR',
    isFamilyFriendly: true,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: applyTaxes(lowestPrice),
      highPrice: applyTaxes(highestPrice),
      priceCurrency: 'EUR',
    },
    hasVariant: article.skus.map((sku) => ({
      '@type': 'Product',
      '@id': article.id + '-' + sku.uid,
    })),
    variesBy: Object.values(article.characteristics).map((characteristic) => characteristic.label),
    aggregateRating:
      article.aggregatedRating !== null
        ? {
            '@type': 'AggregateRating',
            ratingValue: article.aggregatedRating,
            reviewCount: article.reviewIds.length,
            bestRating: 5,
          }
        : undefined,
    weight: {
      '@type': 'QuantitativeValue',
      minValue: minWeight,
      maxValue: maxWeight,
    },
  };
}

export function inStockArticle(article: Article, stockIndex: number, cdnBaseUrl: string): Product {
  const sku = article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku);

  const r: Product = {
    '@type': 'Product',
    '@id': article.id + '-' + article.stocks[stockIndex].uid,
    name: article.stocks[stockIndex].title,
    description: article.stocks[stockIndex].seo.description,
    image: loader({ cdnBaseUrl })({
      src: article.stocks[stockIndex].images[0].url,
      width: 512,
    }),
    material: sku?.composition,
    countryOfAssembly: 'FR',
    countryOfLastProcessing: 'FR',
    countryOfOrigin: 'FR',
    isFamilyFriendly: true,
    offers: {
      '@type': 'Offer',
      price: applyTaxes(article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku)?.price ?? 0),
      priceCurrency: 'EUR',
      availability:
        article.stocks[stockIndex].stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(new Date().getTime() + 31536000000).toISOString(),
    },
    isVariantOf: {
      '@type': 'ProductGroup',
      '@id': article.id,
    },
    aggregateRating:
      article.aggregatedRating !== null
        ? {
            '@type': 'AggregateRating',
            ratingValue: article.aggregatedRating,
            reviewCount: article.reviewIds.length,
            bestRating: 5,
          }
        : undefined,
    weight: {
      '@type': 'QuantitativeValue',
      value: sku?.weight ?? 0,
    },
    gtin: sku?.gtin ?? undefined,
  };

  const [sizeOptionUid] = Object.entries(article.characteristics).find(([_, value]) => {
    return value.label.toLowerCase() === 'taille';
  }) ?? [null, null];

  if (sizeOptionUid) {
    const sku = article.skus.find((sku) => sku.uid === article.stocks[stockIndex].sku);
    const skuSizeUid = sku?.characteristics[sizeOptionUid];
    const sizeLabel = skuSizeUid ? article.characteristics[sizeOptionUid].values[skuSizeUid] : null;
    if (sizeLabel) {
      r.size = sizeLabel;
    }
  }

  if (!r.size) {
    r.size = 'Taille unique';
  }

  return r;
}

export function organization(BASE_URL: string): Exclude<Organization, string> {
  return {
    '@type': 'Organization',
    name: 'Petit Roudoudou',
    sameAs: [],
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/logo.png`, // TODO logo is in CDN
    },
  };
}

export function review(review: Review): UserReview {
  return {
    '@type': 'UserReview',
    '@id': review.id,
    reviewBody: review.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.score,
      bestRating: 5,
    },
    datePublished: review.createdAt.toISOString(),
    isFamilyFriendly: true,
    itemReviewed: {
      '@type': 'ProductGroup',
      '@id': review.articleId,
    },
    author: {
      '@type': 'Person',
      givenName: review.authorName,
    },
  };
}
