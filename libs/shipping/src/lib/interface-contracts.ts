export type PickupPoint = {
    code: string;
    name: string;
    address: string;
    city: string;
    zipcode: number;
    country: string;
    latitude: number;
    longitude: number;
    // phone: string;
    // description: string; // sometimes number ...
  };
  
  // export type GetCotationParams = {
  //   package: {
  //     weight: number;
  //     length: number;
  //     width: number;
  //     height: number;
  //   };
  //   reciver: {
  //     countryCode: string;
  //     zipCode: string;
  //     city: string;
  //   };
  // };
  
  // export type Cotation = {
  //   // TODO
  // };
  
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
    // getPrices: (params: GetPricesParams) => Promise<{
    //   [key in BoxtalCarriers]: {
    //     taxInclusive: number;
    //     taxExclusive: number;
    //   };
    // }>;
    // getPickUpPoint: (code: string, zipCode: string) => Promise<PickupPoint>;
    // buyShipping: <T extends BoxtalCarriers>(
    //   uid: string,
    //   params: {
    //     carrier: T;
    //     address: {
    //       firstName: string;
    //       lastName: string;
    //       address: string;
    //       zipCode: string;
    //       city: string;
    //       country: string;
    //     };
    //     weight: number;
    //   } & (T extends BoxtalCarriers.MONDIAL_RELAY
    //     ? {
    //         pickupPointCode: string;
    //       }
    //     : {
    //         pickupPointCode?: never;
    //       })
    // ) => Promise<{
    //   taxInclusive: number;
    //   taxExclusive: number;
    // }>;
  };
  