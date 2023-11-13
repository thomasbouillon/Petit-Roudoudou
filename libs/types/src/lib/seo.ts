import type { ItemAvailability } from 'schema-dts';

export type StructuredDataProduct = {
  '@type': 'Product';
  name: string;
  description: string;
  image: string;
  offers:
    | {
        '@type': 'Offer';
        price: number;
        priceCurrency: 'EUR';
        availability: ItemAvailability;
        priceValidUntil: string;
      }
    | {
        '@type': 'AggregateOffer';
        lowPrice: number;
        highPrice: number;
        priceCurrency: 'EUR';
      };
};
