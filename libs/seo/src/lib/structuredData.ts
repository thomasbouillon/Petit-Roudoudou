import { applyTaxes, firebaseServerImageLoader as loader } from '@couture-next/utils';
import { Organization, Product, ProductGroup } from 'schema-dts';
import { Article } from '@couture-next/types';
import { Review } from '@prisma/client';

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
    brand: {
      '@type': 'Organization',
      name: 'Petit Roudoudou',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Petit Roudoudou',
    },
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
      minValue: minWeight / 1000,
      maxValue: maxWeight / 1000,
      unitCode: 'KGM',
    },
  };
}

export function inStockArticle(article: Article, stockIndex: number, reviews: Review[], cdnBaseUrl: string): Product {
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
    brand: {
      '@type': 'Brand',
      name: 'Petit Roudoudou',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Petit Roudoudou',
    },
    material: sku?.composition,
    countryOfAssembly: 'FR',
    countryOfLastProcessing: 'FR',
    countryOfOrigin: 'FR',
    isFamilyFriendly: true,
    offers: [
      {
        '@type': 'Offer',
        price: applyTaxes(sku?.price ?? 0),
        priceCurrency: 'EUR',
        availability:
          article.stocks[stockIndex].stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(new Date().getTime() + 2592000000).toISOString(),
        shippingDetails: (sku?.estimatedShippingDetails ?? []).map((details) => ({
          '@type': 'OfferShippingDetails',
          weight: {
            '@type': 'QuantitativeValue',
            value: (sku?.weight ?? 0) / 1000,
            unitCode: 'KGM',
          },

          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: details.countryCode,
          },
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: details.priceTaxIncluded,
            currency: 'EUR',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 2,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: details.minDays,
              maxValue: details.maxDays,
              unitCode: 'DAY',
            },
          },
        })),
      },
    ],
    reviews: reviews.map((review) => ({
      '@type': 'Review',
      '@id': review.id,
      reviewBody: review.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.score,
        bestRating: 5,
      },
      datePublished: review.createdAt.toISOString(),
      isFamilyFriendly: true,
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
    })),
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
      value: (sku?.weight ?? 0) / 1000,
      unitCode: 'KGM',
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
    sameAs: [
      'https://www.tiktok.com/@petit_roudoudou',
      'https://www.facebook.com/ptitroudoudoucreatrice',
      'https://www.instagram.com/petit_roudoudou',
      'https://www.pinterest.com/ptitroudoudoucreatrice',
    ],
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${process.env['NEXT_PUBLIC_ASSET_PREFIX']}/images/logo.png`, // TODO logo is in CDN
    },
  };
}

// export function review(review: Review): UserReview {
//   return {
//     '@type': 'UserReview',
//     '@id': review.id,
//     reviewBody: review.text,
//     reviewRating: {
//       '@type': 'Rating',
//       ratingValue: review.score,
//       bestRating: 5,
//     },
//     datePublished: review.createdAt.toISOString(),
//     isFamilyFriendly: true,
//     itemReviewed: {
//       '@type': 'ProductGroup',
//       '@id': review.articleId,
//     },
//     author: {
//       '@type': 'Person',
//       givenName: review.authorName,
//     },
//   };
// }
