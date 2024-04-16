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
  }
}

export {};
