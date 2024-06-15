import { Civility, Image } from '@prisma/client';

type OptionBase = {
  label: string;
  uid: string;
};

type PipingOption = OptionBase & {
  type: 'customizable-piping';
  price?: never;
  min?: never;
  max?: never;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
};

type EmbroideryOption = OptionBase & {
  type: 'customizable-embroidery';
  price: number;
  min: number;
  max: number;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
};

type TextOption = OptionBase & {
  type: 'customizable-text';
  price: number;
  min: number;
  max: number;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
};

type BooleanOption = OptionBase & {
  type: 'customizable-boolean';
  price: number;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
  min?: never;
  max?: never;
};

type ArticleOption = TextOption | BooleanOption | PipingOption | EmbroideryOption;

type CartItemBase = {
  uid: string;
  description: string;
  image: Image;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  perUnitTaxExcluded: number;
  perUnitTaxIncluded: number;
  totalWeight: number;
  quantity: number;
  taxes: Record<string, number>;
  comment?: string;
};

type ArticleRelatedCartItem = CartItemBase & {
  articleId: string;
  skuId: string;
  customizations: CartItemCustomizations;
};

type CartItemCustomizations = Record<
  string,
  {
    title: string;
    displayValue?: string;
  } & (
    | { value: string; type: 'text' }
    | { value: boolean; type: 'boolean' }
    | { value?: { text: string; colorId: string }; type: 'embroidery' }
    | { value: string; type: 'fabric' | 'piping' }
  )
>;

type CartItemCustomized = ArticleRelatedCartItem & {
  type: 'customized';
  stockUid?: never;
};

type CartItemInStock = ArticleRelatedCartItem & {
  type: 'inStock';
  stockUid: string;
};

type CartItemGiftCard = CartItemBase & {
  type: 'giftCard';
  amount: number;
  recipient: { name: string; email: string };
  text: string;

  customizations?: Record<string, never>;
  skuId?: never;
  stockUid?: never;
  articleId?: never;
};

type OrderShippingWithFreeMethod = {
  civility?: never;
  firstName?: never;
  lastName?: never;
  address?: never;
  addressComplement?: never;
  city?: never;
  zipCode?: never;
  country?: never;
  price: {
    taxExcluded: 0;
    taxIncluded: 0;
    originalTaxExcluded: 0;
    originalTaxIncluded: 0;
  };
  trackingNumber?: never;
} & (
  | {
      deliveryMode: 'pickup-at-workshop';
      phoneNumber: string;
    }
  | {
      deliveryMode: 'do-not-ship' /* contains digital items only */;
    }
);

type OrderShippingWithPaidMethod = {
  civility: Civility;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  addressComplement: string;
  city: string;
  zipCode: string;
  country: string;
  price: {
    taxExcluded: number;
    taxIncluded: number;
    originalTaxExcluded: number;
    originalTaxIncluded: number;
  };
  carrierId: string;
  carrierLabel: string;
  carrierIconUrl: string;
  offerId: string;
  trackingNumber?: string;
  labelUrl?: string;
  pricePaidByUs?: {
    taxExcluded: number;
    taxIncluded: number;
  };
} & (
  | {
      deliveryMode: 'deliver-at-pickup-point';
      pickupPoint: {
        name: string;
        code: string;
        address: string;
        city: string;
        zipCode: string;
        country: string;
      };
    }
  | {
      deliveryMode: 'deliver-at-home';
      pickupPoint?: never;
    }
);

type OrderItemBase = {
  description: string;
  image: Image;
  totalTaxExcluded: number;
  totalTaxIncluded: number;
  perUnitTaxExcluded: number;
  perUnitTaxIncluded: number;
  originalTotalTaxExcluded: number;
  originalTotalTaxIncluded: number;
  originalPerUnitTaxExcluded: number;
  originalPerUnitTaxIncluded: number;
  weight: number;
  taxes: Record<string, number>;
  quantity: number;
  reviewId?: string;
  customerComment?: string;
};

type OrderItemCustomized = OrderItemBase & {
  type: 'customized';
  originalStockId?: never;
  originalArticleId: string;
  customizations: { title: string; value: string; type: 'fabric' | 'text' | 'boolean' | 'piping' | 'embroidery' }[];
};

type OrderItemInStock = OrderItemBase & {
  type: 'inStock';
  originalStockId: string;
  originalArticleId: string;
  customizations: { title: string; value: string; type: 'text' | 'boolean' | 'piping' }[];
};

type OrderItemGiftCard = OrderItemBase & {
  type: 'giftCard';
  originalStockId?: never;
  originalArticleId?: never;
  customizations?: Record<string, never>;
  details: {
    amount: number;
    recipient: {
      name: string;
      email: string;
    };
    text: string;
  };
};

declare global {
  namespace PrismaJson {
    type SizeTuple = [number, number];

    type SkuCharacteristics = Record<string, string>;
    type ArticleStockInheritsCustomizables = Record<string, true>;
    type ArticleCharacteristics = Record<
      string,
      {
        label: string;
        values: Record<string, string>;
      }
    >;
    type ArticleOptions = ArticleOption[];

    type CartItem = CartItemInStock | CartItemCustomized | CartItemGiftCard;

    type CartTaxes = Record<string, number>;

    type OrderShipping = OrderShippingWithFreeMethod | OrderShippingWithPaidMethod;

    type OrderItem = OrderItemCustomized | OrderItemInStock | OrderItemGiftCard;

    type OrderBillingGiftCards = Record<string, number>;
  }
}

export {};
