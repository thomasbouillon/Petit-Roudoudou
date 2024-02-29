type ArticleBase = {
  name: string;
  namePlural: string;
  slug: string;
  description: string;
  treeJsModel: { uid: string; url: string };
  treeJsInitialCameraDistance: number;
  treeJsAllAxesRotation: boolean;
  images: { url: string; uid: string; placeholderDataUrl?: string }[];
  characteristics: Record<string, Characteristic>;
  customizables: Customizable[];
  skus: Sku[];
  seo: {
    title: string;
    description: string;
  };
  stocks: ArticleStock[];
  aggregatedRating?: number;
};

export type Review = {
  _id: string;
  createdAt: Date;
  text: string;
  score: number;
  articleId: string;
  authorId: string;
};

export type ArticleStock = {
  uid: string;
  slug: string;
  sku: string;
  stock: number;
  images: { url: string; uid: string; placeholderDataUrl?: string }[];
  title: string;
  description: string;
  inherits: {
    customizables: Record<string, true>;
  };
  seo: {
    description: string;
  };
};

export type Article = ArticleBase & {
  _id: string;
  reviewIds: string[];
};

export type NewArticle = ArticleBase;

export type Characteristic = {
  label: string;
  values: Record<string, string>;
};

export type Sku = {
  uid: string;
  characteristics: Record<string, string>;
  price: number;
  weight: number;
  enabled: boolean;
  composition: string;
};

type CustomizableBase = {
  label: string;
  uid: string;
};

export type ArticleMetadata = {
  updatedAt: number;
};

export type CustomizableText = CustomizableBase & {
  type: 'customizable-text';
  price: number;
  min: number;
  max: number;
  fabricListId?: never;
  treeJsModelPartId?: never;
  size?: never;
};

export type CustomizableBoolean = CustomizableBase & {
  type: 'customizable-boolean';
  price: number;
  fabricListId?: never;
  treeJsModelPartId?: never;
  size?: never;
  min?: never;
  max?: never;
};

export type CustomizablePart = CustomizableBase & {
  type: 'customizable-part';
  fabricListId: string;
  treeJsModelPartId: string;
  size: [number, number];
  min?: never;
  max?: never;
  price?: never;
};

export type Customizable = CustomizableText | CustomizableBoolean | CustomizablePart;
