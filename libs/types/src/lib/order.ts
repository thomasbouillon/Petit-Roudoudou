type Base = {
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
    civility: 'M' | 'Mme';
    firstName: string;
    lastName: string;
    address: string;
    addressComplement: string;
    city: string;
    zipCode: string;
    country: string;
    checkoutSessionId: string;
  };
  shipping: {
    civility: 'M' | 'Mme';
    firstName: string;
    lastName: string;
    address: string;
    addressComplement: string;
    city: string;
    zipCode: string;
    country: string;
    method: 'colissimo';
  };
  manufacturingTimes?: {
    min: number;
    max: number;
    unit: 'days' | 'weeks' | 'months';
  };
};

export type DraftOrder = {
  status: 'draft';
  billing: {
    checkoutSessionUrl: string;
  };
} & Base;

export type NewDraftOrder = Omit<DraftOrder, '_id' | 'createdAt'> & {
  _id?: never;
  createdAt?: never;
};

export type PaidOrder = {
  status: 'paid';
  paidAt: Date;
} & Base;

export type Order = DraftOrder | PaidOrder;

export type OrderItemBase = {
  description: string;
  image: {
    url: string;
    uid: string;
    placeholderDataUrl?: string;
  };
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  taxes: Record<string, number>;
};

export type OrderItemCustomized = OrderItemBase & {
  type: 'customized';
  customizations: { title: string; value: string }[];
};

export type OrderItemInStock = OrderItemBase & {
  type: 'inStock';
  customizations?: never;
};

export type OrderItem = OrderItemCustomized | OrderItemInStock;
