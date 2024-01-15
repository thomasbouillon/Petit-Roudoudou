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

export type BoxtalClientContract = {
  listPickUpPoints: (zipCode: string) => Promise<PickupPoint[]>;
  getPrice: (params: GetPricesParams) => Promise<{
    taxInclusive: number;
    taxExclusive: number;
  }>;
};
