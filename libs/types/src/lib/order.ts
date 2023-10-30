export type Order = {
  _id: string;
  createdAt: Date;
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

export type NewOrder = Omit<Order, '_id' | 'createdAt'>;

export type OrderItem = {
  description: string;
  customizations: { title: string; value: string }[];
  image: string;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};
