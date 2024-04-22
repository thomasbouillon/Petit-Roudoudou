export type PickupPoint = {
  code: string;
  name: string;
  address: string;
  city: string;
  zipcode: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type CarrierOffer = {
  carrierId: string;
  carrierLabel: string;
  carrierIconUrl: string;
  offerId: string;
  deliveryType: 'deliver-at-pickup-point' | 'deliver-at-home';
  price: {
    taxIncluded: number;
    taxExcluded: number;
  };
};
