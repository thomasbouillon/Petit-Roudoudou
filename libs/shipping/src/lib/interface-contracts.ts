export type PickupPoint = {
  code: string;
  name: string;
  address: string;
  city: string;
  zipcode: number;
  country: string;
  latitude: number;
  longitude: number;
};

export type GetPricesParams = {
  carrier: BoxtalCarriers;
  weight: number;
};

export enum BoxtalCarriers {
  MONDIAL_RELAY = 'MONR',
  COLISSIMO = 'POFR',
}

export type BuyShippingParams<T extends BoxtalCarriers> = {
  carrier: T;
  internalReference: string;
  webhookUrl: string;
  address: {
    firstName: string;
    lastName: string;
    address: string;
    addressComplement: string;
    zipCode: string;
    city: string;
    country: string;
  };
  user: {
    email: string;
    phone: string;
  };
  contentDescription: string;
  weight: number;
} & (T extends BoxtalCarriers.MONDIAL_RELAY
  ? {
      pickupPointCode: string;
    }
  : {
      pickupPointCode?: never;
    });

export type BoxtalClientContract = {
  listPickUpPoints: (zipCode: string) => Promise<PickupPoint[]>;
  getPrice: (params: GetPricesParams) => Promise<{
    taxInclusive: number;
    taxExclusive: number;
  }>;
  buyShipping: <T extends BoxtalCarriers>(
    params: BuyShippingParams<T>
  ) => Promise<{
    boxtalReference: string;
    boxtalComments: string;
    taxInclusive: number;
    taxExclusive: number;
    estimatedDeliveryDate: string;
  }>;
};
