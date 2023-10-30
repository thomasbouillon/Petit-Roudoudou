export type Order = {
  user: {
    uid: string;
    firstName: string;
    lastName: string;
  };
  items: OrderItem[];
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
  billing: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    paymentRef: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    method: 'colissimo';
  };
};

export type OrderItem = {
  description: string;
  customizations: { title: string; value: string }[];
  image: string;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};
