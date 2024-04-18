import { Image } from '@prisma/client';

type CustomizableBase = {
  label: string;
  uid: string;
};

type CustomizableText = CustomizableBase & {
  type: 'customizable-text';
  price: number;
  min: number;
  max: number;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
};

type CustomizableBoolean = CustomizableBase & {
  type: 'customizable-boolean';
  price: number;
  fabricListId?: never;
  threeJsModelPartId?: never;
  size?: never;
  min?: never;
  max?: never;
};

type CustomizablePart = CustomizableBase & {
  type: 'customizable-part';
  fabricListId: string;
  threeJsModelPartId: string;
  size: [number, number];
  min?: never;
  max?: never;
  price?: never;
};

type Customizable = CustomizableText | CustomizableBoolean | CustomizablePart;

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
};

type ArticleRelatedCartItem = CartItemBase & {
  articleId: string;
  skuId: string;
  customizations: CartItemCustomizations;
};

type CartItemCustomizations = Record<
  string,
  { title: string; value: string | boolean; type: 'fabric' | 'text' | 'boolean' }
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
    type ArticleCustomizables = Customizable[];

    type CartItem = CartItemInStock | CartItemCustomized | CartItemGiftCard;

    type CartTaxes = Record<string, number>;
  }
}

export {};
